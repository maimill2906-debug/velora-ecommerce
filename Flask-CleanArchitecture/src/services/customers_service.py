from __future__ import annotations

import uuid

from infrastructure.repositories.customers_repository import CustomersRepository
from infrastructure.repositories.rbac_repository import RbacRepository


class CustomersService:
    def __init__(self, customers_repo: CustomersRepository, rbac_repo: RbacRepository):
        self.customers_repo = customers_repo
        self.rbac_repo = rbac_repo

    def get_or_create_my_profile(self, user_id: uuid.UUID):
        user = self.rbac_repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")
        return self.customers_repo.get_or_create_profile(
            user_id=user.id, full_name=user.full_name, email=user.email, phone=user.phone
        )

    def update_my_profile(self, user_id: uuid.UUID, payload: dict):
        profile = self.get_or_create_my_profile(user_id)
        full_name = payload.get("full_name")
        email = payload.get("email")
        phone = payload.get("phone")
        return self.customers_repo.update_profile(profile, full_name=full_name, email=email, phone=phone)

    def list_my_wishlist(self, user_id: uuid.UUID):
        profile = self.get_or_create_my_profile(user_id)
        return self.customers_repo.list_wishlist(profile.id)

    def add_my_wishlist_item(self, user_id: uuid.UUID, product_id: str):
        profile = self.get_or_create_my_profile(user_id)
        return self.customers_repo.add_to_wishlist(customer_id=profile.id, product_id=uuid.UUID(product_id))

    def remove_my_wishlist_item(self, user_id: uuid.UUID, product_id: str) -> int:
        profile = self.get_or_create_my_profile(user_id)
        return self.customers_repo.remove_from_wishlist(customer_id=profile.id, product_id=uuid.UUID(product_id))

    def list_my_notification_prefs(self, user_id: uuid.UUID):
        profile = self.get_or_create_my_profile(user_id)
        return self.customers_repo.list_notification_prefs(profile.id)

    def set_my_notification_prefs(self, user_id: uuid.UUID, payload: dict):
        """
        Payload example:
        {
          "email_order_updates": true,
          "email_promotions": false,
          "sms_shipping_updates": true
        }
        Stored as channel toggles to keep the schema flexible.
        """
        profile = self.get_or_create_my_profile(user_id)
        created_or_updated = []
        for key, enabled in (payload or {}).items():
            if not isinstance(enabled, bool):
                continue
            created_or_updated.append(
                self.customers_repo.upsert_notification_pref(
                    customer_id=profile.id, channel=str(key), enabled=enabled
                )
            )
        return created_or_updated

