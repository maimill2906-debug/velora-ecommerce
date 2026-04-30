from __future__ import annotations

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth
from infrastructure.databases.session import session_scope
from infrastructure.repositories.customers_repository import CustomersRepository
from infrastructure.repositories.rbac_repository import RbacRepository
from services.customers_service import CustomersService

bp = Blueprint("customers", __name__, url_prefix="/customers")


@bp.get("/me")
@require_auth
def get_my_profile():
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        profile = svc.get_or_create_my_profile(g.user_id)
        return jsonify(
            {
                "id": str(profile.id),
                "user_id": str(profile.user_id) if profile.user_id else None,
                "full_name": profile.full_name,
                "email": profile.email,
                "phone": profile.phone,
            }
        )


@bp.patch("/me")
@require_auth
def update_my_profile():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        profile = svc.update_my_profile(g.user_id, payload)
        return jsonify(
            {
                "id": str(profile.id),
                "full_name": profile.full_name,
                "email": profile.email,
                "phone": profile.phone,
            }
        )


@bp.get("/me/wishlist")
@require_auth
def list_my_wishlist():
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        items = svc.list_my_wishlist(g.user_id)
        return jsonify([{"id": str(i.id), "product_id": str(i.product_id)} for i in items])


@bp.post("/me/wishlist")
@require_auth
def add_my_wishlist_item():
    payload = request.get_json() or {}
    product_id = payload.get("product_id")
    if not product_id:
        return jsonify({"message": "product_id_required"}), 400
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        try:
            item = svc.add_my_wishlist_item(g.user_id, product_id)
        except Exception:
            return jsonify({"message": "invalid_product_id"}), 400
        return jsonify({"id": str(item.id), "product_id": str(item.product_id)}), 201


@bp.delete("/me/wishlist/<product_id>")
@require_auth
def remove_my_wishlist_item(product_id: str):
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        try:
            removed = svc.remove_my_wishlist_item(g.user_id, product_id)
        except Exception:
            return jsonify({"message": "invalid_product_id"}), 400
        return jsonify({"removed": removed}), 200


@bp.get("/me/notification-preferences")
@require_auth
def list_my_notification_prefs():
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        prefs = svc.list_my_notification_prefs(g.user_id)
        return jsonify([{"channel": p.channel, "enabled": bool(p.enabled)} for p in prefs])


@bp.put("/me/notification-preferences")
@require_auth
def set_my_notification_prefs():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = CustomersService(CustomersRepository(session), RbacRepository(session))
        prefs = svc.set_my_notification_prefs(g.user_id, payload)
        return jsonify([{"channel": p.channel, "enabled": bool(p.enabled)} for p in prefs]), 200

