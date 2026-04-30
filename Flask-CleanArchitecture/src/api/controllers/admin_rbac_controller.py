from __future__ import annotations

import os
import uuid

from flask import Blueprint, jsonify, request

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from domain.models.enums import UserType
from infrastructure.databases.session import session_scope
from infrastructure.models.rbac_models import FunctionModel, RoleModel
from infrastructure.repositories.rbac_repository import RbacRepository

bp = Blueprint("admin_rbac", __name__, url_prefix="/admin/rbac")


@bp.post("/bootstrap")
def bootstrap_admin():
    """One-shot setup endpoint to create the first admin.

    Protected by the `BOOTSTRAP_TOKEN` environment variable. The caller must
    send the same value in the `X-Bootstrap-Token` header.

    Idempotent. Performs:
    - Seeds all function codes used by the app
    - Creates a role with code `admin` (if missing) and links it to every
      function
    - Promotes the user identified by `identifier` (email or phone) to
      `user_type=admin` and assigns the `admin` role
    """
    expected = os.environ.get("BOOTSTRAP_TOKEN")
    if not expected:
        return jsonify({"message": "bootstrap_disabled"}), 403
    provided = request.headers.get("X-Bootstrap-Token") or ""
    if provided != expected:
        return jsonify({"message": "bootstrap_token_invalid"}), 403

    payload = request.get_json() or {}
    identifier = (payload.get("identifier") or payload.get("email") or payload.get("phone") or "").strip()
    if not identifier:
        return jsonify({"message": "identifier_required"}), 400

    seed_codes = [
        (FunctionCodes.RBAC_MANAGE, "Quản lý phân quyền (RBAC)"),
        (FunctionCodes.CATALOG_CATEGORY_CREATE, "Tạo danh mục"),
        (FunctionCodes.CATALOG_PRODUCT_CREATE, "Tạo sản phẩm"),
        (FunctionCodes.CATALOG_VARIANT_CREATE, "Tạo biến thể sản phẩm"),
        (FunctionCodes.CATALOG_IMAGE_ADD, "Thêm ảnh sản phẩm"),
        (FunctionCodes.CATALOG_TAG_CREATE, "Tạo tag sản phẩm"),
        (FunctionCodes.CATALOG_TAG_ASSIGN, "Gán tag cho sản phẩm"),
        (FunctionCodes.ORDER_CREATE, "Tạo đơn hàng"),
        (FunctionCodes.ORDER_READ, "Xem đơn hàng"),
        (FunctionCodes.ORDER_UPDATE_STATUS, "Cập nhật trạng thái đơn hàng"),
        (FunctionCodes.CUSTOMER_READ, "Xem khách hàng"),
        (FunctionCodes.CUSTOMER_UPDATE, "Cập nhật khách hàng"),
        (FunctionCodes.INVENTORY_READ, "Xem kho"),
        (FunctionCodes.INVENTORY_WRITE, "Cập nhật kho"),
        (FunctionCodes.MARKETING_READ, "Xem marketing"),
        (FunctionCodes.MARKETING_WRITE, "Cập nhật marketing"),
    ]

    with session_scope() as session:
        repo = RbacRepository(session)

        user = repo.get_user_by_email(identifier) or repo.get_user_by_phone(identifier)
        if not user:
            return jsonify({"message": "user_not_found", "hint": "Đăng ký user qua POST /auth/register trước"}), 404

        # 1) Seed functions
        functions: list[FunctionModel] = []
        for code, name in seed_codes:
            existing = repo.get_function_by_code(code)
            if existing:
                functions.append(existing)
                continue
            functions.append(repo.create_function(FunctionModel(code=code, name=name, description=None)))

        # 2) Ensure admin role
        admin_role = repo.get_role_by_code("admin")
        if not admin_role:
            admin_role = repo.create_role(RoleModel(code="admin", name="Administrator", description="Toàn quyền"))

        # 3) Link every function to admin role (idempotent)
        for fn in functions:
            try:
                repo.assign_function_to_role(admin_role.id, fn.id)
            except Exception:
                # likely UniqueConstraint violation if already linked
                session.rollback()

        # 4) Assign admin role to user (idempotent) + promote to admin user_type
        try:
            repo.assign_role_to_user(user.id, admin_role.id)
        except Exception:
            session.rollback()
        if user.user_type != UserType.admin:
            user.user_type = UserType.admin
            repo.update_user(user)

        return jsonify(
            {
                "message": "ok",
                "user_id": str(user.id),
                "role": admin_role.code,
                "functions": [f.code for f in functions],
            }
        ), 200


@bp.post("/functions")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def create_function():
    payload = request.get_json() or {}
    code = payload.get("code")
    name = payload.get("name")
    if not code or not name:
        return jsonify({"message": "code_and_name_required"}), 400

    with session_scope() as session:
        repo = RbacRepository(session)
        if repo.get_function_by_code(code):
            return jsonify({"message": "function_code_exists"}), 400
        fn = repo.create_function(FunctionModel(code=code, name=name, description=payload.get("description")))
        return jsonify({"id": str(fn.id), "code": fn.code, "name": fn.name}), 201


@bp.post("/roles")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def create_role():
    payload = request.get_json() or {}
    code = payload.get("code")
    name = payload.get("name")
    if not code or not name:
        return jsonify({"message": "code_and_name_required"}), 400

    with session_scope() as session:
        repo = RbacRepository(session)
        if repo.get_role_by_code(code):
            return jsonify({"message": "role_code_exists"}), 400
        role = repo.create_role(RoleModel(code=code, name=name, description=payload.get("description")))
        return jsonify({"id": str(role.id), "code": role.code, "name": role.name}), 201


@bp.post("/users/<user_id>/roles/<role_id>")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def assign_role(user_id: str, role_id: str):
    with session_scope() as session:
        repo = RbacRepository(session)
        user = repo.get_user(uuid.UUID(user_id))
        if not user:
            return jsonify({"message": "user_not_found"}), 404
        role = session.get(RoleModel, uuid.UUID(role_id))
        if not role:
            return jsonify({"message": "role_not_found"}), 404
        repo.assign_role_to_user(user.id, role.id)
        return jsonify({"message": "ok"}), 200


@bp.post("/roles/<role_id>/functions/<function_id>")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def assign_function(role_id: str, function_id: str):
    with session_scope() as session:
        repo = RbacRepository(session)
        role = session.get(RoleModel, uuid.UUID(role_id))
        if not role:
            return jsonify({"message": "role_not_found"}), 404
        fn = session.get(FunctionModel, uuid.UUID(function_id))
        if not fn:
            return jsonify({"message": "function_not_found"}), 404
        repo.assign_function_to_role(role.id, fn.id)
        return jsonify({"message": "ok"}), 200


@bp.get("/functions")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def list_functions():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        items = RbacRepository(session).list_functions(limit=limit, offset=offset)
        return jsonify(
            [
                {"id": str(f.id), "code": f.code, "name": f.name, "description": f.description}
                for f in items
            ]
        )


@bp.post("/functions/seed")
@require_auth
@require_function(FunctionCodes.RBAC_MANAGE)
def seed_functions():
    """
    Idempotent: creates missing function codes used by the app.
    """
    from domain.constants import FunctionCodes as FC

    seed = [
        (FC.RBAC_MANAGE, "Quản lý phân quyền (RBAC)"),
        (FC.CATALOG_CATEGORY_CREATE, "Tạo danh mục"),
        (FC.CATALOG_PRODUCT_CREATE, "Tạo sản phẩm"),
        (FC.CATALOG_VARIANT_CREATE, "Tạo biến thể sản phẩm"),
        (FC.CATALOG_IMAGE_ADD, "Thêm ảnh sản phẩm"),
        (FC.CATALOG_TAG_CREATE, "Tạo tag sản phẩm"),
        (FC.CATALOG_TAG_ASSIGN, "Gán tag cho sản phẩm"),
        (FC.ORDER_CREATE, "Tạo đơn hàng"),
        (FC.ORDER_READ, "Xem đơn hàng"),
        (FC.ORDER_UPDATE_STATUS, "Cập nhật trạng thái đơn hàng"),
        (FC.CUSTOMER_READ, "Xem khách hàng"),
        (FC.CUSTOMER_UPDATE, "Cập nhật khách hàng"),
        (FC.INVENTORY_READ, "Xem kho"),
        (FC.INVENTORY_WRITE, "Cập nhật kho"),
        (FC.MARKETING_READ, "Xem marketing"),
        (FC.MARKETING_WRITE, "Cập nhật marketing"),
    ]

    created = 0
    with session_scope() as session:
        repo = RbacRepository(session)
        for code, name in seed:
            if repo.get_function_by_code(code):
                continue
            repo.create_function(FunctionModel(code=code, name=name, description=None))
            created += 1
    return jsonify({"message": "ok", "created": created}), 200

