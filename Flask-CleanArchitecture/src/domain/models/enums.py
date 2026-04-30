from __future__ import annotations

from enum import Enum


class UserStatus(str, Enum):
    active = "active"
    locked = "locked"
    disabled = "disabled"


class UserType(str, Enum):
    # System actors
    admin = "admin"
    sales = "sales"
    warehouse = "warehouse"
    marketing = "marketing"
    # External actor
    customer = "customer"


class OrderStatus(str, Enum):
    draft = "draft"
    placed = "placed"
    confirmed = "confirmed"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentMethod(str, Enum):
    cod = "cod"
    momo = "momo"
    zalopay = "zalopay"
    bank = "bank"
    card = "card"


class PaymentStatus(str, Enum):
    pending = "pending"
    authorized = "authorized"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class StockTxnType(str, Enum):
    in_ = "in"
    out = "out"
    adjust = "adjust"
    transfer = "transfer"


class MarketingCampaignStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    ended = "ended"


class MarketingChannel(str, Enum):
    facebook = "facebook"
    tiktok = "tiktok"
    google = "google"
    shopee = "shopee"
    lazada = "lazada"
    other = "other"


class SalesChannel(str, Enum):
    online = "online"
    pos = "pos"
    shopee = "shopee"
    lazada = "lazada"
    tiktok_shop = "tiktok_shop"


