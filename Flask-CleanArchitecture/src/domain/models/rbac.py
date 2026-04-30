from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from .enums import UserStatus, UserType


@dataclass(frozen=True, slots=True)
class Function:
    """
    A permissioned capability in the system (RBAC).
    Example code: "product.read", "order.update_status".
    """

    id: UUID
    code: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Role:
    """
    A role groups functions (permissions).
    Examples: Admin, Sales, Warehouse, Marketing.
    """

    id: UUID
    code: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class User:
    """
    Represents both internal staff accounts and customers.
    Authentication uses either email or phone as login identifier.
    """

    id: UUID
    user_type: UserType
    status: UserStatus

    full_name: str
    email: str | None
    phone: str | None

    password_hash: str

    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class UserRole:
    id: UUID
    user_id: UUID
    role_id: UUID
    created_at: datetime


@dataclass(frozen=True, slots=True)
class RoleFunction:
    id: UUID
    role_id: UUID
    function_id: UUID
    created_at: datetime

