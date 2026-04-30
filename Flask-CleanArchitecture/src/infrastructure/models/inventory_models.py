from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from domain.models.enums import StockTxnType
from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class InventoryLocationModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "inventory_locations"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class StockItemModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_items"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory_locations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    qty_on_hand: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    qty_reserved: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    location: Mapped["InventoryLocationModel"] = relationship()


class StockTransactionModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_transactions"

    txn_type: Mapped[StockTxnType] = mapped_column(
        Enum(StockTxnType, name="stock_txn_type"), nullable=False
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory_locations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(String(500))

    location: Mapped["InventoryLocationModel"] = relationship()

