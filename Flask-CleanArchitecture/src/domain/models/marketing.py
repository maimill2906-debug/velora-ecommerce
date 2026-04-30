from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class MarketingCampaignStatus(str, Enum):
    scheduled = "scheduled"
    running = "running"
    ended = "ended"
    paused = "paused"


class MarketingChannel(str, Enum):
    website = "website"
    shopee = "shopee"
    store = "store"
    email = "email"
    sms = "sms"
    facebook = "facebook"
    instagram = "instagram"
    tiktok = "tiktok"
    google_ads = "google_ads"
    organic = "organic"


@dataclass(frozen=True, slots=True)
class MarketingCampaign:
    id: UUID
    name: str
    campaign_type: str  # e.g. discount/email/content/voucher
    status: MarketingCampaignStatus

    start_at: datetime | None
    end_at: datetime | None

    budget: int | None  # VND
    channel: MarketingChannel

    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class CampaignMetricSnapshot:
    """
    Metrics shown in Marketing tabs (reach/orders/revenue/open rate/click rate, etc.)
    Stored as snapshots for reporting.
    """

    id: UUID
    campaign_id: UUID
    captured_at: datetime

    reach: int | None
    orders: int | None
    revenue: int | None  # VND
    open_rate: float | None
    click_rate: float | None


@dataclass(frozen=True, slots=True)
class SocialPost:
    id: UUID
    platform: MarketingChannel  # facebook/instagram/tiktok
    content: str
    scheduled_at: datetime | None
    published_at: datetime | None

    likes: int | None
    comments: int | None
    reach: int | None

    created_at: datetime
    updated_at: datetime

