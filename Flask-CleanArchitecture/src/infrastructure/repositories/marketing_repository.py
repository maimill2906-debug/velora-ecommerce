from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.models.marketing_models import MarketingCampaignModel, VoucherModel


class MarketingRepository:
    def __init__(self, session: Session):
        self.session = session

    # Vouchers
    def list_vouchers(self, limit: int = 200, offset: int = 0) -> list[VoucherModel]:
        return (
            self.session.execute(
                select(VoucherModel).order_by(VoucherModel.created_at.desc()).limit(limit).offset(offset)
            )
            .scalars()
            .all()
        )

    def get_voucher_by_code(self, code: str) -> VoucherModel | None:
        return self.session.execute(select(VoucherModel).where(VoucherModel.code == code)).scalar_one_or_none()

    def create_voucher(self, v: VoucherModel) -> VoucherModel:
        self.session.add(v)
        self.session.flush()
        return v

    # Campaigns
    def list_campaigns(self, limit: int = 200, offset: int = 0) -> list[MarketingCampaignModel]:
        return (
            self.session.execute(
                select(MarketingCampaignModel)
                .order_by(MarketingCampaignModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .scalars()
            .all()
        )

    def get_campaign_by_code(self, code: str) -> MarketingCampaignModel | None:
        return (
            self.session.execute(select(MarketingCampaignModel).where(MarketingCampaignModel.code == code))
            .scalar_one_or_none()
        )

    def create_campaign(self, c: MarketingCampaignModel) -> MarketingCampaignModel:
        self.session.add(c)
        self.session.flush()
        return c

