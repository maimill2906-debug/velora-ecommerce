from __future__ import annotations

from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from domain.models.enums import MarketingCampaignStatus, MarketingChannel
from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class VoucherModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vouchers"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    discount_amount: Mapped[int | None] = mapped_column(Integer)
    discount_percent: Mapped[int | None] = mapped_column(Integer)
    max_uses: Mapped[int | None] = mapped_column(Integer)


class MarketingCampaignModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "marketing_campaigns"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[MarketingChannel] = mapped_column(
        Enum(MarketingChannel, name="marketing_channel"), nullable=False
    )
    status: Mapped[MarketingCampaignStatus] = mapped_column(
        Enum(MarketingCampaignStatus, name="marketing_campaign_status"), nullable=False
    )

