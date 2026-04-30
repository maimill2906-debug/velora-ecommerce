from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from domain.models.enums import SalesChannel
from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class SalesChannelModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sales_channels"

    channel: Mapped[SalesChannel] = mapped_column(
        Enum(SalesChannel, name="sales_channel"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class ChannelSyncStateModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "channel_sync_states"
    __table_args__ = (
        UniqueConstraint("sales_channel_id", "resource", name="uq_channel_sync_state_channel_resource"),
    )

    sales_channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sales_channels.id", ondelete="CASCADE"),
        nullable=False,
    )
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    cursor: Mapped[str | None] = mapped_column(String(255))

