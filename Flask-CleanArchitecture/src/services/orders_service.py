from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from domain.models.enums import OrderStatus, PaymentMethod, PaymentStatus, StockTxnType
from infrastructure.models.inventory_models import StockTransactionModel
from infrastructure.models.orders_models import (
    AddressModel,
    OrderItemModel,
    OrderModel,
    PaymentModel,
)
from infrastructure.repositories.customers_repository import CustomersRepository
from infrastructure.repositories.inventory_repository import InventoryRepository
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.repositories.rbac_repository import RbacRepository

# Bộ chuyển trạng thái hợp lệ (FSM) — chặn admin/sales đổi tùy ý.
ALLOWED_STATUS_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.draft: {OrderStatus.placed, OrderStatus.cancelled},
    OrderStatus.placed: {OrderStatus.confirmed, OrderStatus.cancelled},
    OrderStatus.confirmed: {OrderStatus.packed, OrderStatus.cancelled},
    OrderStatus.packed: {OrderStatus.shipped, OrderStatus.cancelled},
    OrderStatus.shipped: {OrderStatus.delivered, OrderStatus.returned},
    OrderStatus.delivered: {OrderStatus.returned},
    OrderStatus.cancelled: set(),
    OrderStatus.returned: set(),
}


class OrdersService:
    def __init__(
        self,
        orders_repo: OrdersRepository,
        rbac_repo: RbacRepository,
        inventory_repo: InventoryRepository | None = None,
    ):
        self.orders_repo = orders_repo
        self.rbac_repo = rbac_repo
        self.inventory_repo = inventory_repo

    def _profile_for_user(self, user):
        """Một customer_profile / user — dùng CustomersRepository (unique user_id + xử lý race)."""
        customers = CustomersRepository(self.orders_repo.session)
        return customers.get_or_create_profile(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
        )

    def _resolve_default_location(self):
        if not self.inventory_repo:
            return None
        code = os.environ.get("DEFAULT_INVENTORY_LOCATION_CODE")
        if code:
            loc = self.inventory_repo.get_location_by_code(code)
            if loc:
                return loc
        locs = self.inventory_repo.list_locations()
        return locs[0] if locs else None

    def _decrement_stock_for_items(self, items: list[dict], order_code: str) -> None:
        """Auto-deduct stock for variants in an order.

        - If no inventory repo or no location available, silently skip.
        - If a variant doesn't have a stock_item yet, skip (warehouse may be tracked elsewhere).
        - If insufficient stock, raise ValueError("insufficient_stock").
        """
        if not self.inventory_repo:
            return
        location = self._resolve_default_location()
        if not location:
            return

        for it in items:
            if not it.get("variant_id"):
                continue
            variant_id = uuid.UUID(it["variant_id"])
            qty = int(it["quantity"])
            stock = self.inventory_repo.get_stock_item(
                location_id=location.id, variant_id=variant_id
            )
            if not stock:
                # No stock record yet: skip, do not block order creation.
                continue
            current = int(stock.qty_on_hand or 0)
            if current < qty:
                raise ValueError("insufficient_stock")
            new_on_hand = current - qty
            self.inventory_repo.upsert_stock_item(
                location_id=location.id, variant_id=variant_id, qty_on_hand=new_on_hand
            )
            self.inventory_repo.create_txn(
                StockTransactionModel(
                    txn_type=StockTxnType.out,
                    location_id=location.id,
                    variant_id=variant_id,
                    quantity=qty,
                    note=f"order:{order_code}",
                )
            )

    def create_order_for_user(self, user_id: uuid.UUID, payload: dict) -> OrderModel:
        user = self.rbac_repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")

        profile = self._profile_for_user(user)

        addr_payload = payload.get("shipping_address") or {}
        addr = None
        if addr_payload:
            addr = self.orders_repo.create_address(
                AddressModel(
                    customer_id=profile.id,
                    full_name=addr_payload.get("full_name") or user.full_name,
                    phone=addr_payload.get("phone") or (user.phone or ""),
                    line1=addr_payload["line1"],
                    line2=addr_payload.get("line2"),
                    ward=addr_payload.get("ward"),
                    district=addr_payload.get("district"),
                    province=addr_payload.get("province"),
                    country=addr_payload.get("country") or "VN",
                    postal_code=addr_payload.get("postal_code"),
                )
            )

        order = self.orders_repo.create_order(
            OrderModel(
                code=payload["code"],
                status=OrderStatus.placed,
                sales_channel_id=uuid.UUID(payload["sales_channel_id"])
                if payload.get("sales_channel_id")
                else None,
                customer_id=profile.id,
                shipping_address_id=addr.id if addr else None,
                subtotal_amount=int(payload["subtotal_amount"]),
                discount_amount=int(payload.get("discount_amount", 0)),
                shipping_fee=int(payload.get("shipping_fee", 0)),
                total_amount=int(payload["total_amount"]),
                placed_at=datetime.now(timezone.utc),
            )
        )

        items = payload.get("items") or []
        if not items:
            raise ValueError("items_required")

        for idx, it in enumerate(items, start=1):
            qty = int(it["quantity"])
            unit_price = int(it["unit_price"])
            self.orders_repo.add_order_item(
                OrderItemModel(
                    order_id=order.id,
                    line_no=idx,
                    product_id=uuid.UUID(it["product_id"]) if it.get("product_id") else None,
                    variant_id=uuid.UUID(it["variant_id"]) if it.get("variant_id") else None,
                    quantity=qty,
                    unit_price=unit_price,
                    line_total=qty * unit_price,
                )
            )

        if payload.get("payment"):
            pay = payload["payment"]
            self.orders_repo.create_payment(
                PaymentModel(
                    order_id=order.id,
                    method=PaymentMethod(pay.get("method", "cod")),
                    status=PaymentStatus.pending,
                    amount=int(payload["total_amount"]),
                )
            )

        # Auto-deduct stock for the items if inventory tracking is wired up.
        try:
            self._decrement_stock_for_items(items, order_code=order.code)
        except ValueError:
            # Re-raise so the controller can return 400 to the customer.
            raise

        # Lưu mốc lịch sử "đặt hàng" để admin/sales nhìn thấy.
        self.orders_repo.add_status_history(
            order_id=order.id,
            status=OrderStatus.placed.value,
            note="Khách đặt hàng",
            changed_by_user_id=user.id,
        )
        return order

    def list_orders(self, *, limit: int = 50, offset: int = 0) -> list[OrderModel]:
        return self.orders_repo.list_orders(limit=limit, offset=offset)

    def get_order_detail(self, order_id: str) -> OrderModel:
        oid = uuid.UUID(order_id)
        order = self.orders_repo.get_order_with_details(oid)
        if not order:
            raise ValueError("order_not_found")
        return order

    def _restock_for_order(self, order: OrderModel, *, reason: str) -> None:
        """Tr\u1ea3 h\u00e0ng v\u1ec1 kho khi h\u1ee7y/ho\u00e0n. Skip n\u1ebfu kh\u00f4ng c\u00f3 inventory_repo / location."""
        if not self.inventory_repo:
            return
        location = self._resolve_default_location()
        if not location:
            return
        items = order.items or self.orders_repo.get_order_with_details(order.id).items
        for it in items or []:
            if not it.variant_id:
                continue
            stock = self.inventory_repo.get_stock_item(
                location_id=location.id, variant_id=it.variant_id
            )
            current = int(stock.qty_on_hand or 0) if stock else 0
            new_on_hand = current + int(it.quantity)
            self.inventory_repo.upsert_stock_item(
                location_id=location.id,
                variant_id=it.variant_id,
                qty_on_hand=new_on_hand,
            )
            self.inventory_repo.create_txn(
                StockTransactionModel(
                    txn_type=StockTxnType.in_,
                    location_id=location.id,
                    variant_id=it.variant_id,
                    quantity=int(it.quantity),
                    note=f"{reason}:{order.code}",
                )
            )

    def update_order_status(
        self,
        *,
        order_id: str,
        status: str,
        note: str | None = None,
        actor_user_id: uuid.UUID | None = None,
    ) -> OrderModel:
        oid = uuid.UUID(order_id)
        order = self.orders_repo.get_order(oid)
        if not order:
            raise ValueError("order_not_found")

        try:
            new_status = OrderStatus(status)
        except ValueError as exc:
            raise ValueError("invalid_status") from exc

        if new_status == order.status:
            # ghi nh\u1eadn ghi ch\u00fa nh\u01b0ng kh\u00f4ng \u0111\u1ed5i status
            if note:
                self.orders_repo.add_status_history(
                    order_id=order.id,
                    status=order.status.value,
                    note=note,
                    changed_by_user_id=actor_user_id,
                )
            return order

        allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise ValueError("invalid_transition")

        order.status = new_status
        updated = self.orders_repo.update_order(order)
        self.orders_repo.add_status_history(
            order_id=order.id,
            status=new_status.value,
            note=note,
            changed_by_user_id=actor_user_id,
        )

        if new_status in (OrderStatus.cancelled, OrderStatus.returned):
            self._restock_for_order(
                updated,
                reason="cancel" if new_status == OrderStatus.cancelled else "return",
            )

        return updated

    def list_order_history(self, order_id: str):
        oid = uuid.UUID(order_id)
        order = self.orders_repo.get_order(oid)
        if not order:
            raise ValueError("order_not_found")
        return self.orders_repo.list_status_history(oid)

    # Customer ("me")
    def list_my_orders(self, user_id: uuid.UUID, *, limit: int = 50, offset: int = 0) -> list[OrderModel]:
        user = self.rbac_repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")
        profile = self._profile_for_user(user)
        return self.orders_repo.list_orders_for_customer(profile.id, limit=limit, offset=offset)

    def track_my_order_by_code(self, user_id: uuid.UUID, code: str) -> OrderModel:
        user = self.rbac_repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")
        profile = self._profile_for_user(user)
        order = self.orders_repo.get_order_by_code_with_details(code)
        if not order or not order.customer_id:
            raise ValueError("order_not_found")
        if order.customer_id != profile.id:
            raise ValueError("forbidden")
        return order

