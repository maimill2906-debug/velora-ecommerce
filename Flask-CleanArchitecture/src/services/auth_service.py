from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from domain.models.enums import UserStatus, UserType
from infrastructure.models.rbac_models import UserModel
from infrastructure.repositories.rbac_repository import RbacRepository


class AuthService:
    def __init__(self, repo: RbacRepository):
        self.repo = repo

    def register_customer(
        self,
        *,
        full_name: str,
        email: str | None,
        phone: str | None,
        password: str,
    ) -> UserModel:
        if not email and not phone:
            raise ValueError("email_or_phone_required")
        if email and self.repo.get_user_by_email(email):
            raise ValueError("email_exists")
        if phone and self.repo.get_user_by_phone(phone):
            raise ValueError("phone_exists")

        user = UserModel(
            user_type=UserType.customer,
            status=UserStatus.active,
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=generate_password_hash(password),
        )
        return self.repo.create_user(user)

    def login(self, *, identifier: str, password: str) -> tuple[str, UserModel]:
        user = self.repo.get_user_by_email(identifier) or self.repo.get_user_by_phone(identifier)
        if not user:
            raise ValueError("invalid_credentials")
        if user.status != UserStatus.active:
            raise ValueError("user_inactive")
        if not check_password_hash(user.password_hash, password):
            raise ValueError("invalid_credentials")
        return self._issue_jwt(user.id), user

    def change_password(self, *, user_id: uuid.UUID, current_password: str, new_password: str) -> None:
        user = self.repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")
        if user.status != UserStatus.active:
            raise ValueError("user_inactive")
        if not check_password_hash(user.password_hash, current_password):
            raise ValueError("invalid_current_password")
        if len(new_password or "") < 6:
            raise ValueError("password_too_short")
        user.password_hash = generate_password_hash(new_password)
        self.repo.update_user(user)

    def issue_password_reset_token(self, *, identifier: str) -> tuple[str, UserModel]:
        """Issue a short-lived JWT for password reset.

        Returns the (token, user). Does NOT send email — the caller can integrate
        with an email/SMS provider. In dev/demo, expose token to UI to allow
        manual reset.
        """
        user = self.repo.get_user_by_email(identifier) or self.repo.get_user_by_phone(identifier)
        if not user:
            raise ValueError("user_not_found")
        if user.status != UserStatus.active:
            raise ValueError("user_inactive")

        secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY") or "dev_secret"
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "purpose": "password_reset",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=15)).timestamp()),
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        return token, user

    def reset_password_with_token(self, *, token: str, new_password: str) -> None:
        if len(new_password or "") < 6:
            raise ValueError("password_too_short")
        secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY") or "dev_secret"
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
        except Exception:
            raise ValueError("invalid_or_expired_token")
        if payload.get("purpose") != "password_reset":
            raise ValueError("invalid_or_expired_token")
        try:
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
            raise ValueError("invalid_or_expired_token")
        user = self.repo.get_user(user_id)
        if not user:
            raise ValueError("user_not_found")
        if user.status != UserStatus.active:
            raise ValueError("user_inactive")
        user.password_hash = generate_password_hash(new_password)
        self.repo.update_user(user)

    def _issue_jwt(self, user_id: uuid.UUID) -> str:
        secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY") or "dev_secret"
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=12)).timestamp()),
        }
        return jwt.encode(payload, secret, algorithm="HS256")

    @staticmethod
    def decode_jwt(token: str) -> uuid.UUID:
        secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY") or "dev_secret"
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        if payload.get("purpose") == "password_reset":
            # Reset tokens must NOT be accepted as session tokens.
            raise ValueError("invalid_token")
        return uuid.UUID(payload["sub"])

