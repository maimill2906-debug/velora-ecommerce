from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from .enums import OrderStatus, PaymentMethod, PaymentStatus


@dataclass(frozen=True, slots=True)
class Address:
    id: UUID
    user_id: UUID
    full_name: str
    phone: str
    email: str | None
    province: str
    district: str
    ward: str
    address_line: str
    note: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Order:
    id: UUID
    code: str  # e.g. "VLxxxxxxx" (frontend generates similarly)
    channel: str  # e.g. "web", "shopee" — kênh bán (domain string, không phụ thuộc DB)
    customer_id: UUID | None
    status: OrderStatus

    shipping_address_id: UUID
    shipping_fee: int  # VND
    subtotal: int  # VND
    total: int  # VND

    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class OrderItem:
    id: UUID
    order_id: UUID
    product_id: UUID
    variant_id: UUID | None
    title: str
    unit_price: int  # VND
    quantity: int
    created_at: datetime


@dataclass(frozen=True, slots=True)
class Payment:
    id: UUID
    order_id: UUID
    method: PaymentMethod
    status: PaymentStatus
    amount: int  # VND
    created_at: datetime
    updated_at: datetime

