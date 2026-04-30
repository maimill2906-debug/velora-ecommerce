from __future__ import annotations

import os

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth
from api.schemas.auth import ChangePasswordRequestSchema, LoginRequestSchema, RegisterRequestSchema
from infrastructure.databases.session import session_scope
from infrastructure.repositories.rbac_repository import RbacRepository
from services.auth_service import AuthService

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.post("/register")
def register():
    payload = RegisterRequestSchema().load(request.get_json() or {})
    with session_scope() as session:
        svc = AuthService(RbacRepository(session))
        try:
            user = svc.register_customer(
                full_name=payload["full_name"],
                email=payload.get("email"),
                phone=payload.get("phone"),
                password=payload["password"],
            )
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

        return (
            jsonify(
                {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                }
            ),
            201,
        )


@bp.post("/login")
def login():
    payload = LoginRequestSchema().load(request.get_json() or {})
    with session_scope() as session:
        svc = AuthService(RbacRepository(session))
        try:
            token, user = svc.login(identifier=payload["identifier"], password=payload["password"])
        except ValueError as e:
            return jsonify({"message": str(e)}), 401
        return jsonify({"token": token, "user_type": user.user_type.value}), 200


@bp.get("/me")
@require_auth
def me():
    with session_scope() as session:
        user = RbacRepository(session).get_user(g.user_id)
        if not user:
            return jsonify({"message": "user_not_found"}), 404
        return (
            jsonify(
                {
                    "id": str(user.id),
                    "user_type": user.user_type.value,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                }
            ),
            200,
        )


@bp.post("/forgot-password")
def forgot_password():
    payload = request.get_json() or {}
    identifier = (payload.get("identifier") or payload.get("email") or payload.get("phone") or "").strip()
    if not identifier:
        return jsonify({"message": "identifier_required"}), 400

    with session_scope() as session:
        svc = AuthService(RbacRepository(session))
        try:
            token, user = svc.issue_password_reset_token(identifier=identifier)
        except ValueError:
            # Always return ok to avoid revealing existence of accounts.
            return jsonify({"message": "ok"}), 200

        # In real deployment you'd send `token` via email/SMS and only return
        # ok here. To support the demo flow without an email provider, we
        # expose the token when DEV_EXPOSE_RESET_TOKEN=1 (default in dev).
        body: dict = {"message": "ok"}
        if os.environ.get("DEV_EXPOSE_RESET_TOKEN", "1") == "1":
            body["reset_token"] = token
            body["full_name"] = user.full_name
        return jsonify(body), 200


@bp.post("/reset-password")
def reset_password():
    payload = request.get_json() or {}
    token = (payload.get("token") or "").strip()
    new_password = payload.get("new_password") or ""
    if not token or not new_password:
        return jsonify({"message": "token_and_new_password_required"}), 400

    with session_scope() as session:
        svc = AuthService(RbacRepository(session))
        try:
            svc.reset_password_with_token(token=token, new_password=new_password)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 400
        return jsonify({"reset": True}), 200


@bp.post("/change-password")
@require_auth
def change_password():
    payload = ChangePasswordRequestSchema().load(request.get_json() or {})
    with session_scope() as session:
        svc = AuthService(RbacRepository(session))
        try:
            svc.change_password(
                user_id=g.user_id,
                current_password=payload["current_password"],
                new_password=payload["new_password"],
            )
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 400 if msg != "invalid_current_password" else 401
        return jsonify({"changed": True}), 200

