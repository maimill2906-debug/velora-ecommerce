from __future__ import annotations

from domain.models.enums import MarketingCampaignStatus, MarketingChannel
from infrastructure.models.marketing_models import MarketingCampaignModel, VoucherModel
from infrastructure.repositories.marketing_repository import MarketingRepository


class MarketingService:
    def __init__(self, repo: MarketingRepository):
        self.repo = repo

    # Vouchers
    def list_vouchers(self, *, limit: int, offset: int):
        return self.repo.list_vouchers(limit=limit, offset=offset)

    def create_voucher(self, payload: dict) -> VoucherModel:
        code = payload.get("code")
        name = payload.get("name")
        if not code or not name:
            raise ValueError("code_and_name_required")
        if self.repo.get_voucher_by_code(code):
            raise ValueError("voucher_code_exists")

        discount_amount = payload.get("discount_amount")
        discount_percent = payload.get("discount_percent")
        if discount_amount is None and discount_percent is None:
            raise ValueError("discount_required")

        return self.repo.create_voucher(
            VoucherModel(
                code=code,
                name=name,
                discount_amount=discount_amount,
                discount_percent=discount_percent,
                max_uses=payload.get("max_uses"),
            )
        )

    # Campaigns
    def list_campaigns(self, *, limit: int, offset: int):
        return self.repo.list_campaigns(limit=limit, offset=offset)

    def create_campaign(self, payload: dict) -> MarketingCampaignModel:
        code = payload.get("code")
        name = payload.get("name")
        channel = payload.get("channel")
        status = payload.get("status")
        if not code or not name or not channel or not status:
            raise ValueError("code_name_channel_status_required")
        if self.repo.get_campaign_by_code(code):
            raise ValueError("campaign_code_exists")

        return self.repo.create_campaign(
            MarketingCampaignModel(
                code=code,
                name=name,
                channel=MarketingChannel(channel),
                status=MarketingCampaignStatus(status),
            )
        )

