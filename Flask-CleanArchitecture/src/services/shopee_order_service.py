"""
Luồng đặt hàng giả lập Shopee: validate domain → lưu đơn → trừ tồn kho.
Controller chỉ gọi handle_shopee_order(data).
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone

from domain.models.enums import OrderStatus, StockTxnType
from domain.shopee_order_validation import validate_shopee_order_payload
from infrastructure.models.inventory_models import StockTransactionModel
from infrastructure.models.orders_models import OrderItemModel, OrderModel
from infrastructure.repositories.catalog_repository import CatalogRepository
from infrastructure.repositories.channels_repository import ChannelsRepository
from infrastructure.repositories.inventory_repository import InventoryRepository
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.databases.session import session_scope

logger = logging.getLogger(__name__)

def _resolve_product_uuid(catalog_repo: CatalogRepository, raw) -> uuid.UUID:
    try:
        return uuid.UUID(str(raw))
    except ValueError:
        pass
    try:
        pos = int(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError("invalid_product_id") from exc
    product = catalog_repo.get_product_at_position(pos)
    if not product:
        raise ValueError("product_not_found")
    return product.id


def _default_inventory_location_id(inv_repo: InventoryRepository):
    code = os.environ.get("DEFAULT_INVENTORY_LOCATION_CODE")
    if code:
        loc = inv_repo.get_location_by_code(code)
        if loc:
            return loc.id
    locs = inv_repo.list_locations()
    if not locs:
        return None
    return locs[0].id


def _first_variant_id(catalog_repo: CatalogRepository, product_id: uuid.UUID) -> uuid.UUID:
    variants = catalog_repo.list_variants(product_id)
    if not variants:
        raise ValueError("product_has_no_variant")
    return variants[0].id


def _qty_on_hand(inv_repo: InventoryRepository, location_id: uuid.UUID, variant_id: uuid.UUID) -> int:
    stock = inv_repo.get_stock_item(location_id=location_id, variant_id=variant_id)
    return int(stock.qty_on_hand or 0) if stock else 0


def _decrement_stock(
    inv_repo: InventoryRepository,
    *,
    location_id: uuid.UUID,
    variant_id: uuid.UUID,
    quantity: int,
    order_code: str,
) -> int:
    current = _qty_on_hand(inv_repo, location_id, variant_id)
    if current < quantity:
        raise ValueError("insufficient_stock")
    new_qty = current - quantity
    inv_repo.upsert_stock_item(
        location_id=location_id, variant_id=variant_id, qty_on_hand=new_qty
    )
    inv_repo.create_txn(
        StockTransactionModel(
            txn_type=StockTxnType.out,
            location_id=location_id,
            variant_id=variant_id,
            quantity=quantity,
            note=f"shopee_webhook:{order_code}",
        )
    )
    return new_qty


def get_shopee_demo_stock_for_product(product_ref) -> dict:
    """GET demo: tồn kho hiện tại (variant đầu tiên của sản phẩm, kho mặc định)."""
    with session_scope() as session:
        catalog_repo = CatalogRepository(session)
        inv_repo = InventoryRepository(session)
        product_id = _resolve_product_uuid(catalog_repo, product_ref)
        variant_id = _first_variant_id(catalog_repo, product_id)
        loc_id = _default_inventory_location_id(inv_repo)
        if not loc_id:
            return {"product_id": str(product_id), "qty_on_hand": None, "note": "no_inventory_location"}
        qty = _qty_on_hand(inv_repo, loc_id, variant_id)
        return {"product_id": str(product_id), "variant_id": str(variant_id), "qty_on_hand": qty}


def handle_shopee_order(data: dict) -> dict:
    validate_shopee_order_payload(data)

    logger.info("[SHOPEE] New order received")

    with session_scope() as session:
        orders_repo = OrdersRepository(session)
        catalog_repo = CatalogRepository(session)
        inv_repo = InventoryRepository(session)
        ch_repo = ChannelsRepository(session)

        sales_channel_id = ch_repo.ensure_shopee_channel().id
        session.flush()

        location_id = _default_inventory_location_id(inv_repo)

        items_payload = data["items"]
        resolved_lines: list[tuple[uuid.UUID, uuid.UUID, int, int]] = []

        for it in items_payload:
            product_id = _resolve_product_uuid(catalog_repo, it["product_id"])
            variant_id = _first_variant_id(catalog_repo, product_id)
            qty = int(it["quantity"])
            product_row = catalog_repo.get_product(product_id)
            if not product_row:
                raise ValueError("product_not_found")
            unit_price = int(catalog_repo.list_variants(product_id)[0].price)
            resolved_lines.append((product_id, variant_id, qty, unit_price))

        if not location_id:
            raise ValueError("no_inventory_location")

        first_variant_id = resolved_lines[0][1]
        previous_stock = _qty_on_hand(inv_repo, location_id, first_variant_id)

        line_totals = [qty * price for _, _, qty, price in resolved_lines]
        subtotal = sum(line_totals)
        shipping_fee = 0

        order_code = str(data["order_id"])

        order = orders_repo.create_order(
            OrderModel(
                code=order_code,
                status=OrderStatus.placed,
                sales_channel_id=sales_channel_id,
                customer_id=None,
                shipping_address_id=None,
                subtotal_amount=subtotal,
                discount_amount=0,
                shipping_fee=shipping_fee,
                total_amount=subtotal + shipping_fee,
                placed_at=datetime.now(timezone.utc),
            )
        )

        for idx, (product_id, variant_id, qty, unit_price) in enumerate(resolved_lines, start=1):
            orders_repo.add_order_item(
                OrderItemModel(
                    order_id=order.id,
                    line_no=idx,
                    product_id=product_id,
                    variant_id=variant_id,
                    quantity=qty,
                    unit_price=unit_price,
                    line_total=qty * unit_price,
                )
            )

        for _, variant_id, qty, _ in resolved_lines:
            _decrement_stock(
                inv_repo,
                location_id=location_id,
                variant_id=variant_id,
                quantity=qty,
                order_code=order_code,
            )

        new_stock = _qty_on_hand(inv_repo, location_id, first_variant_id)

        orders_repo.add_status_history(
            order_id=order.id,
            status=OrderStatus.placed.value,
            note="Đơn Shopee (webhook demo)",
            changed_by_user_id=None,
        )

        return {
            "message": "Order processed",
            "new_stock": new_stock,
            "previous_stock": previous_stock,
        }
