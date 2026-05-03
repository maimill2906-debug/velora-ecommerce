from __future__ import annotations

import uuid

from domain.models.enums import StockTxnType
from infrastructure.models.inventory_models import (
    InventoryLocationModel,
    StockTransactionModel,
)
from infrastructure.repositories.inventory_repository import InventoryRepository


class InventoryError(Exception):
    """Lỗi nghiệp vụ kho hàng — hết hàng, kho không tồn tại, v.v."""


class InventoryService:
    def __init__(self, repo: InventoryRepository):
        self.repo = repo

    # Locations
    def list_locations(self):
        return self.repo.list_locations()

    def create_location(self, *, code: str, name: str):
        if self.repo.get_location_by_code(code):
            raise ValueError("location_code_exists")
        return self.repo.create_location(InventoryLocationModel(code=code, name=name))

    # Stock items
    def list_stock_items(self, *, location_id: str | None, limit: int, offset: int):
        lid = uuid.UUID(location_id) if location_id else None
        return self.repo.list_stock_items(location_id=lid, limit=limit, offset=offset)

    # Transactions: apply to stock on-hand
    def create_stock_txn(self, payload: dict):
        required = ["txn_type", "location_id", "variant_id", "quantity"]
        missing = [k for k in required if k not in payload]
        if missing:
            raise ValueError("missing_fields:" + ",".join(missing))

        txn_type = StockTxnType(payload["txn_type"])
        location_id = uuid.UUID(payload["location_id"])
        variant_id = uuid.UUID(payload["variant_id"])
        qty = int(payload["quantity"])
        if qty <= 0:
            raise ValueError("quantity_must_be_positive")

        # Get current stock, compute new qty
        item = self.repo.get_stock_item(location_id=location_id, variant_id=variant_id)
        on_hand = int(item.qty_on_hand) if item else 0

        if txn_type == StockTxnType.in_:
            new_on_hand = on_hand + qty
        elif txn_type == StockTxnType.out:
            if on_hand < qty:
                raise ValueError("insufficient_stock")
            new_on_hand = on_hand - qty
        elif txn_type == StockTxnType.adjust:
            # set qty_on_hand exactly (inventory adjustment)
            new_on_hand = qty
        else:
            raise ValueError("txn_type_not_supported")

        self.repo.upsert_stock_item(location_id=location_id, variant_id=variant_id, qty_on_hand=new_on_hand)

        txn = self.repo.create_txn(
            StockTransactionModel(
                txn_type=txn_type,
                location_id=location_id,
                variant_id=variant_id,
                quantity=qty,
                note=payload.get("note"),
            )
        )
        return txn, new_on_hand

    def list_txns(self, *, location_id: str | None, limit: int, offset: int):
        lid = uuid.UUID(location_id) if location_id else None
        return self.repo.list_txns(location_id=lid, limit=limit, offset=offset)

    # ── Multi-location helpers ────────────────────────────────────────────────

    def _require_location(self, location_code: str) -> InventoryLocationModel:
        loc = self.repo.get_location_by_code(location_code)
        if not loc:
            raise InventoryError(f"location_not_found:{location_code}")
        return loc

    def get_stock(self, *, location_code: str, variant_id: uuid.UUID) -> int:
        """Trả về qty_on_hand tại kho `location_code` cho variant. 0 nếu chưa có record."""
        loc = self.repo.get_location_by_code(location_code)
        if not loc:
            return 0
        item = self.repo.get_stock_item(location_id=loc.id, variant_id=variant_id)
        return int(item.qty_on_hand) if item else 0

    def reduce_stock(
        self,
        *,
        location_code: str,
        variant_id: uuid.UUID,
        quantity: int,
        note: str | None = None,
    ) -> int:
        """Giảm tồn kho tại kho chỉ định. Raise InventoryError nếu không đủ hàng."""
        loc = self._require_location(location_code)
        item = self.repo.get_stock_item(location_id=loc.id, variant_id=variant_id)
        on_hand = int(item.qty_on_hand) if item else 0
        if on_hand < quantity:
            raise InventoryError("insufficient_stock")
        new_qty = on_hand - quantity
        self.repo.upsert_stock_item(location_id=loc.id, variant_id=variant_id, qty_on_hand=new_qty)
        self.repo.create_txn(
            StockTransactionModel(
                txn_type=StockTxnType.out,
                location_id=loc.id,
                variant_id=variant_id,
                quantity=quantity,
                note=note,
            )
        )
        return new_qty

    def transfer_stock(
        self,
        *,
        from_code: str,
        to_code: str,
        variant_id: uuid.UUID,
        quantity: int,
        actor_user_id: uuid.UUID | None = None,
    ) -> dict:
        """Chuyển hàng từ kho `from_code` sang kho `to_code`. Ghi 2 giao dịch (out + in)."""
        if from_code == to_code:
            raise InventoryError("same_location")
        from_loc = self._require_location(from_code)
        to_loc   = self._require_location(to_code)

        from_item = self.repo.get_stock_item(location_id=from_loc.id, variant_id=variant_id)
        from_qty  = int(from_item.qty_on_hand) if from_item else 0
        if from_qty < quantity:
            raise InventoryError("insufficient_stock")

        new_from_qty = from_qty - quantity
        self.repo.upsert_stock_item(location_id=from_loc.id, variant_id=variant_id, qty_on_hand=new_from_qty)
        self.repo.create_txn(
            StockTransactionModel(
                txn_type=StockTxnType.out,
                location_id=from_loc.id,
                variant_id=variant_id,
                quantity=quantity,
                note=f"transfer_to:{to_code}",
            )
        )

        to_item    = self.repo.get_stock_item(location_id=to_loc.id, variant_id=variant_id)
        to_qty     = int(to_item.qty_on_hand) if to_item else 0
        new_to_qty = to_qty + quantity
        self.repo.upsert_stock_item(location_id=to_loc.id, variant_id=variant_id, qty_on_hand=new_to_qty)
        self.repo.create_txn(
            StockTransactionModel(
                txn_type=StockTxnType.in_,
                location_id=to_loc.id,
                variant_id=variant_id,
                quantity=quantity,
                note=f"transfer_from:{from_code}",
            )
        )

        return {
            "from_location": from_code,
            "from_qty": new_from_qty,
            "to_location": to_code,
            "to_qty": new_to_qty,
        }

