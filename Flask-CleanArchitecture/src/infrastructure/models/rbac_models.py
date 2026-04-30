from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from domain.models.enums import UserStatus, UserType
from infrastructure.databases.base import Base

from ._base import TimestampMixin, UUIDPrimaryKeyMixin


class FunctionModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "functions"

    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))

    role_links: Mapped[list["RoleFunctionModel"]] = relationship(
        back_populates="function", cascade="all, delete-orphan"
    )


class RoleModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))

    user_links: Mapped[list["UserRoleModel"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )
    function_links: Mapped[list["RoleFunctionModel"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )


class UserModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    user_type: Mapped[UserType] = mapped_column(Enum(UserType, name="user_type"), nullable=False)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus, name="user_status"), nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)

    roles: Mapped[list["UserRoleModel"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserRoleModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_id_role_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["UserModel"] = relationship(back_populates="roles")
    role: Mapped["RoleModel"] = relationship(back_populates="user_links")


class RoleFunctionModel(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "role_functions"
    __table_args__ = (
        UniqueConstraint("role_id", "function_id", name="uq_role_functions_role_id_function_id"),
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("functions.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    role: Mapped["RoleModel"] = relationship(back_populates="function_links")
    function: Mapped["FunctionModel"] = relationship(back_populates="role_links")

