from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.models.inventory_models import (
    InventoryLocationModel,
    StockItemModel,
    StockTransactionModel,
)


class InventoryRepository:
    def __init__(self, session: Session):
        self.session = session

    # Locations
    def list_locations(self) -> list[InventoryLocationModel]:
        return self.session.execute(
            select(InventoryLocationModel).order_by(InventoryLocationModel.code)
        ).scalars().all()

    def get_location_by_code(self, code: str) -> InventoryLocationModel | None:
        return self.session.execute(
            select(InventoryLocationModel).where(InventoryLocationModel.code == code)
        ).scalar_one_or_none()

    def create_location(self, loc: InventoryLocationModel) -> InventoryLocationModel:
        self.session.add(loc)
        self.session.flush()
        return loc

    # Stock items
    def get_stock_item(self, *, location_id: uuid.UUID, variant_id: uuid.UUID) -> StockItemModel | None:
        return self.session.execute(
            select(StockItemModel)
            .where(StockItemModel.location_id == location_id)
            .where(StockItemModel.variant_id == variant_id)
        ).scalar_one_or_none()

    def upsert_stock_item(
        self,
        *,
        location_id: uuid.UUID,
        variant_id: uuid.UUID,
        qty_on_hand: int,
        qty_reserved: int | None = None,
    ) -> StockItemModel:
        existing = self.get_stock_item(location_id=location_id, variant_id=variant_id)
        if existing:
            existing.qty_on_hand = qty_on_hand
            if qty_reserved is not None:
                existing.qty_reserved = qty_reserved
            self.session.add(existing)
            self.session.flush()
            return existing

        item = StockItemModel(
            location_id=location_id,
            variant_id=variant_id,
            qty_on_hand=qty_on_hand,
            qty_reserved=qty_reserved or 0,
        )
        self.session.add(item)
        self.session.flush()
        return item

    def list_stock_items(self, *, location_id: uuid.UUID | None = None, limit: int = 200, offset: int = 0) -> list[StockItemModel]:
        stmt = select(StockItemModel)
        if location_id:
            stmt = stmt.where(StockItemModel.location_id == location_id)
        return (
            self.session.execute(stmt.order_by(StockItemModel.created_at.desc()).limit(limit).offset(offset))
            .scalars()
            .all()
        )

    # Transactions
    def create_txn(self, txn: StockTransactionModel) -> StockTransactionModel:
        self.session.add(txn)
        self.session.flush()
        return txn

    def list_txns(self, *, location_id: uuid.UUID | None = None, limit: int = 200, offset: int = 0) -> list[StockTransactionModel]:
        stmt = select(StockTransactionModel)
        if location_id:
            stmt = stmt.where(StockTransactionModel.location_id == location_id)
        return (
            self.session.execute(stmt.order_by(StockTransactionModel.created_at.desc()).limit(limit).offset(offset))
            .scalars()
            .all()
        )

