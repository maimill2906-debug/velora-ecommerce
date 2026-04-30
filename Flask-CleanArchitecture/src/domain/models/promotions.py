from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class Voucher:
    id: UUID
    code: str
    name: str
    description: str | None

    # percent or fixed VND; simplify as fixed amount for now
    discount_amount: int | None
    discount_percent: int | None

    min_order_total: int | None
    max_uses: int | None
    used_count: int

    starts_at: datetime | None
    ends_at: datetime | None
    is_active: bool

    created_at: datetime
    updated_at: datetime

