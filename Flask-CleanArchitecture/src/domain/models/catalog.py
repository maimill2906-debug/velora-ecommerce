from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class Category:
    id: UUID
    code: str
    name: str
    parent_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Product:
    id: UUID
    sku: str
    name: str
    description: str | None
    material: str | None
    care_instructions: str | None
    category_id: UUID | None
    # Used by shop filters: "nam" / "nu"
    style_segment: str | None
    is_active: bool
    original_price: int | None  # VND
    rating_avg: float | None
    review_count: int
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class ProductImage:
    id: UUID
    product_id: UUID
    url: str
    sort_order: int
    created_at: datetime


@dataclass(frozen=True, slots=True)
class ProductVariant:
    """
    Variant = size/color (frontend currently uses size; color can be added later).
    """

    id: UUID
    product_id: UUID
    variant_sku: str
    size: str | None
    color: str | None
    price: int  # VND
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class ProductTag:
    id: UUID
    code: str
    label: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class ProductTagLink:
    id: UUID
    product_id: UUID
    tag_id: UUID
    created_at: datetime


@dataclass(frozen=True, slots=True)
class ProductReview:
    id: UUID
    product_id: UUID
    user_id: UUID | None
    rating: int  # 1..5
    title: str | None
    content: str | None
    created_at: datetime

