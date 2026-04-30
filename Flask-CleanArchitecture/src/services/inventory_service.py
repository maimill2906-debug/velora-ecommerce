from __future__ import annotations

import uuid

from domain.models.enums import StockTxnType
from infrastructure.models.inventory_models import (
    InventoryLocationModel,
    StockTransactionModel,
)
from infrastructure.repositories.inventory_repository import InventoryRepository


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

