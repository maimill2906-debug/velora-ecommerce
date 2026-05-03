from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.models.rbac_models import (
    FunctionModel,
    RoleFunctionModel,
    RoleModel,
    UserModel,
    UserRoleModel,
)


class RbacRepository:
    def __init__(self, session: Session):
        self.session = session

    # Users
    def get_user_by_email(self, email: str) -> UserModel | None:
        return self.session.execute(
            select(UserModel).where(UserModel.email == email)
        ).scalar_one_or_none()

    def get_user_by_phone(self, phone: str) -> UserModel | None:
        return self.session.execute(
            select(UserModel).where(UserModel.phone == phone)
        ).scalar_one_or_none()

    def get_user(self, user_id: uuid.UUID) -> UserModel | None:
        return self.session.get(UserModel, user_id)

    def list_users(self, limit: int = 50, offset: int = 0) -> list[UserModel]:
        return (
            self.session.execute(select(UserModel).limit(limit).offset(offset))
            .scalars()
            .all()
        )

    def create_user(self, user: UserModel) -> UserModel:
        self.session.add(user)
        self.session.flush()
        return user

    def update_user(self, user: UserModel) -> UserModel:
        self.session.add(user)
        self.session.flush()
        return user

    # Roles / Functions
    def get_role_by_code(self, code: str) -> RoleModel | None:
        return self.session.execute(select(RoleModel).where(RoleModel.code == code)).scalar_one_or_none()

    def get_function_by_code(self, code: str) -> FunctionModel | None:
        return self.session.execute(select(FunctionModel).where(FunctionModel.code == code)).scalar_one_or_none()

    def create_role(self, role: RoleModel) -> RoleModel:
        self.session.add(role)
        self.session.flush()
        return role

    def create_function(self, fn: FunctionModel) -> FunctionModel:
        self.session.add(fn)
        self.session.flush()
        return fn

    def list_functions(self, limit: int = 200, offset: int = 0) -> list[FunctionModel]:
        return (
            self.session.execute(
                select(FunctionModel).order_by(FunctionModel.code).limit(limit).offset(offset)
            )
            .scalars()
            .all()
        )

    def list_roles(self, limit: int = 200, offset: int = 0) -> list[RoleModel]:
        return (
            self.session.execute(
                select(RoleModel).order_by(RoleModel.code).limit(limit).offset(offset)
            )
            .scalars()
            .all()
        )

    def list_user_roles(self, user_id: uuid.UUID) -> list[RoleModel]:
        rows = (
            self.session.execute(
                select(RoleModel)
                .join(UserRoleModel, UserRoleModel.role_id == RoleModel.id)
                .where(UserRoleModel.user_id == user_id)
                .order_by(RoleModel.code)
            )
            .scalars()
            .all()
        )
        return list(rows)

    def remove_role_from_user(self, user_id: uuid.UUID, role_id: uuid.UUID) -> bool:
        link = self.session.execute(
            select(UserRoleModel)
            .where(UserRoleModel.user_id == user_id)
            .where(UserRoleModel.role_id == role_id)
        ).scalar_one_or_none()
        if not link:
            return False
        self.session.delete(link)
        return True

    def assign_role_to_user(self, user_id: uuid.UUID, role_id: uuid.UUID) -> None:
        link = UserRoleModel(user_id=user_id, role_id=role_id)
        self.session.add(link)

    def assign_function_to_role(self, role_id: uuid.UUID, function_id: uuid.UUID) -> None:
        link = RoleFunctionModel(role_id=role_id, function_id=function_id)
        self.session.add(link)

    def user_has_function(self, user_id: uuid.UUID, function_code: str) -> bool:
        stmt = (
            select(RoleFunctionModel.id)
            .join(RoleModel, RoleModel.id == RoleFunctionModel.role_id)
            .join(UserRoleModel, UserRoleModel.role_id == RoleModel.id)
            .join(FunctionModel, FunctionModel.id == RoleFunctionModel.function_id)
            .where(UserRoleModel.user_id == user_id)
            .where(FunctionModel.code == function_code)
            .limit(1)
        )
        return self.session.execute(stmt).first() is not None

