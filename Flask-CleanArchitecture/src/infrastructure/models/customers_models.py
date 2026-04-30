from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class CustomerProfileModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True)

    wishlist: Mapped[list["WishlistItemModel"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    notification_prefs: Mapped[list["NotificationPreferenceModel"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )


class WishlistItemModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "wishlist_items"
    __table_args__ = (
        UniqueConstraint("customer_id", "product_id", name="uq_wishlist_customer_product"),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )

    customer: Mapped["CustomerProfileModel"] = relationship(back_populates="wishlist")


class NotificationPreferenceModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "notification_preferences"
    __table_args__ = (
        UniqueConstraint("customer_id", "channel", name="uq_notification_preferences_customer_channel"),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(String(30), nullable=False)  # email/sms/zalo/push...
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    customer: Mapped["CustomerProfileModel"] = relationship(back_populates="notification_prefs")

