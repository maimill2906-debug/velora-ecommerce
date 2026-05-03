from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from domain.models.enums import UserType
from infrastructure.models.customers_models import (
    CustomerProfileModel,
    NotificationPreferenceModel,
    WishlistItemModel,
)
from infrastructure.models.rbac_models import UserModel


class CustomersRepository:
    def __init__(self, session: Session):
        self.session = session

    # Profile
    def get_profile_by_user_id(self, user_id: uuid.UUID) -> CustomerProfileModel | None:
        return self.session.execute(
            select(CustomerProfileModel)
            .where(CustomerProfileModel.user_id == user_id)
            .order_by(CustomerProfileModel.created_at.asc())
            .limit(1)
        ).scalar_one_or_none()

    def get_or_create_profile(
        self,
        *,
        user_id: uuid.UUID,
        full_name: str,
        email: str | None,
        phone: str | None,
    ) -> CustomerProfileModel:
        existing = self.get_profile_by_user_id(user_id)
        if existing:
            return existing
        profile = CustomerProfileModel(user_id=user_id, full_name=full_name, email=email, phone=phone)
        self.session.add(profile)
        try:
            with self.session.begin_nested():
                self.session.flush()
        except IntegrityError:
            self.session.expunge(profile)
            existing = self.get_profile_by_user_id(user_id)
            if existing:
                return existing
            raise
        return profile

    def update_profile(
        self,
        profile: CustomerProfileModel,
        *,
        full_name: str | None = None,
        email: str | None = None,
        phone: str | None = None,
    ) -> CustomerProfileModel:
        if full_name is not None:
            profile.full_name = full_name
        if email is not None:
            profile.email = email
        if phone is not None:
            profile.phone = phone
        self.session.add(profile)
        self.session.flush()
        return profile

    def list_profiles(self, limit: int = 100, offset: int = 0) -> list[CustomerProfileModel]:
        """Chỉ trả về profile của khách hàng thực — loại trừ admin/sales/warehouse/marketing."""
        return (
            self.session.execute(
                select(CustomerProfileModel)
                .outerjoin(UserModel, UserModel.id == CustomerProfileModel.user_id)
                .where(
                    (CustomerProfileModel.user_id.is_(None)) |
                    (UserModel.user_type == UserType.customer)
                )
                .order_by(CustomerProfileModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .scalars()
            .all()
        )

    def count_customers(self) -> int:
        """Đếm số khách hàng thực (không tính system actors)."""
        from sqlalchemy import func
        return self.session.execute(
            select(func.count()).select_from(CustomerProfileModel)
            .outerjoin(UserModel, UserModel.id == CustomerProfileModel.user_id)
            .where(
                (CustomerProfileModel.user_id.is_(None)) |
                (UserModel.user_type == UserType.customer)
            )
        ).scalar() or 0

    # Wishlist
    def list_wishlist(self, customer_id: uuid.UUID) -> list[WishlistItemModel]:
        return (
            self.session.execute(
                select(WishlistItemModel).where(WishlistItemModel.customer_id == customer_id)
            )
            .scalars()
            .all()
        )

    def add_to_wishlist(self, *, customer_id: uuid.UUID, product_id: uuid.UUID) -> WishlistItemModel:
        link = WishlistItemModel(customer_id=customer_id, product_id=product_id)
        self.session.add(link)
        self.session.flush()
        return link

    def remove_from_wishlist(self, *, customer_id: uuid.UUID, product_id: uuid.UUID) -> int:
        item = self.session.execute(
            select(WishlistItemModel)
            .where(WishlistItemModel.customer_id == customer_id)
            .where(WishlistItemModel.product_id == product_id)
        ).scalar_one_or_none()
        if not item:
            return 0
        self.session.delete(item)
        return 1

    # Notification preferences (by channel)
    def list_notification_prefs(self, customer_id: uuid.UUID) -> list[NotificationPreferenceModel]:
        return (
            self.session.execute(
                select(NotificationPreferenceModel)
                .where(NotificationPreferenceModel.customer_id == customer_id)
                .order_by(NotificationPreferenceModel.channel)
            )
            .scalars()
            .all()
        )

    def upsert_notification_pref(
        self, *, customer_id: uuid.UUID, channel: str, enabled: bool
    ) -> NotificationPreferenceModel:
        existing = self.session.execute(
            select(NotificationPreferenceModel)
            .where(NotificationPreferenceModel.customer_id == customer_id)
            .where(NotificationPreferenceModel.channel == channel)
        ).scalar_one_or_none()
        if existing:
            existing.enabled = enabled
            self.session.add(existing)
            self.session.flush()
            return existing

        pref = NotificationPreferenceModel(customer_id=customer_id, channel=channel, enabled=enabled)
        self.session.add(pref)
        self.session.flush()
        return pref

