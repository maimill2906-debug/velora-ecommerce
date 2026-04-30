from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"


@dataclass(frozen=True, slots=True)
class CustomerProfile:
    """
    Extends User with customer-specific attributes used in Profile page.
    """

    id: UUID
    user_id: UUID
    birth_date: date | None
    gender: Gender
    default_address_text: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class WishlistItem:
    id: UUID
    user_id: UUID
    product_id: UUID
    created_at: datetime


@dataclass(frozen=True, slots=True)
class NotificationPreference:
    """
    Mirrors the toggles in Profile > Settings.
    """

    id: UUID
    user_id: UUID

    email_order_updates: bool
    email_promotions: bool
    email_new_collection: bool
    sms_shipping_updates: bool

    created_at: datetime
    updated_at: datetime

