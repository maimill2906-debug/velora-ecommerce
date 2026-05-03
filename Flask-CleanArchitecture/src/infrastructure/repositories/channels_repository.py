from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from domain.models.enums import SalesChannel
from infrastructure.models.channels_models import SalesChannelModel


class ChannelsRepository:
    def __init__(self, session: Session):
        self.session = session

    def ensure_shopee_channel(self) -> SalesChannelModel:
        """Luôn map đơn Shopee tới dòng có enum channel=shopee (báo cáo đọc cột này)."""
        row = (
            self.session.execute(
                select(SalesChannelModel)
                .where(SalesChannelModel.channel == SalesChannel.shopee)
                .limit(1)
            )
            .scalars()
            .first()
        )
        if row:
            return row
        row = self.get_by_code("shopee")
        if row:
            if row.channel != SalesChannel.shopee:
                row.channel = SalesChannel.shopee
                self.session.add(row)
                self.session.flush()
            return row
        return self.create_sales_channel(
            channel=SalesChannel.shopee,
            code="shopee",
            name="Shopee",
        )

    def ensure_channel(self, channel: SalesChannel, code: str, name: str) -> SalesChannelModel:
        """Get-or-create a channel row by its enum value."""
        row = (
            self.session.execute(
                select(SalesChannelModel)
                .where(SalesChannelModel.channel == channel)
                .limit(1)
            )
            .scalars()
            .first()
        )
        if row:
            return row
        row = self.get_by_code(code)
        if row:
            if row.channel != channel:
                row.channel = channel
                self.session.add(row)
                self.session.flush()
            return row
        return self.create_sales_channel(channel=channel, code=code, name=name)

    def get_by_code(self, code: str) -> SalesChannelModel | None:
        return self.session.execute(
            select(SalesChannelModel).where(SalesChannelModel.code == code)
        ).scalar_one_or_none()

    def create_sales_channel(
        self, *, channel: SalesChannel, code: str, name: str
    ) -> SalesChannelModel:
        row = SalesChannelModel(channel=channel, code=code, name=name)
        self.session.add(row)
        self.session.flush()
        return row
