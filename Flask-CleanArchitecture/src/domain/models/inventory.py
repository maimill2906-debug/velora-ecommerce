from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class StockTxnType(str, Enum):
    in_ = "in"
    out = "out"
    check = "check"
    adjust = "adjust"


@dataclass(frozen=True, slots=True)
class InventoryLocation:
    """
    Physical bin/location code shown in Warehouse UI like "A1-01".
    """

    id: UUID
    code: str
    name: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class StockItem:
    """
    Stock is managed per SKU (typically product variant SKU).
    """

    id: UUID
    sku: str
    product_id: UUID | None
    variant_id: UUID | None
    location_id: UUID | None

    on_hand: int
    min_stock: int

    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class StockTransaction:
    """
    Warehouse history: in/out/check transactions (and future adjustments).
    """

    id: UUID
    code: str  # e.g. "WH2025001"
    txn_type: StockTxnType
    occurred_at: datetime

    stock_item_id: UUID
    quantity: int

    order_id: UUID | None
    note: str | None

    created_at: datetime

