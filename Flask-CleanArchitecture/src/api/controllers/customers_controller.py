from __future__ import annotations

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.customers_repository import CustomersRepository
from infrastructure.repositories.rbac_repository import RbacRepository
from services.customers_service import CustomersService

bp = Blueprint("customers", __name__, url_prefix="/customers")


# ── Admin / Marketing endpoints ─────────────────────────────────────────────

@bp.get("")
@require_auth
@require_function(FunctionCodes.CUSTOMER_READ)
def list_customers():
    """Danh sách customer profiles — dành cho admin/marketing."""
    limit  = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        repo     = CustomersRepository(session)
        profiles = repo.list_profiles(limit=limit, offset=offset)
        return jsonify([
            {
                "id":         str(p.id),
                "user_id":    str(p.user_id) if p.user_id else None,
                "full_name":  p.full_name,
                "email":      p.email,
                "phone":      p.phone,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in profiles
        ])


@bp.get("/<customer_id>")
@require_auth
@require_function(FunctionCodes.CUSTOMER_READ)
def get_customer(customer_id: str):
    """Chi tiết một customer profile — dành cho admin/marketing."""
    import uuid as _uuid
    from infrastructure.models.customers_models import CustomerProfileModel
    with session_scope() as session:
        profile = session.get(CustomerProfileModel, _uuid.UUID(customer_id))
        if not profile:
            return jsonify({"message": "customer_not_found"}), 404
        return jsonify({
            "id":         str(profile.id),
            "user_id":    str(profile.user_id) if profile.user_id else None,
            "full_name":  profile.full_name,
            "email":      profile.email,
            "phone":      profile.phone,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        })


@bp.patch("/<customer_id>")
@require_auth
@require_function(FunctionCodes.CUSTOMER_UPDATE)
def update_customer(customer_id: str):
    """Cập nhật thông tin khách hàng — dành cho admin/sale."""
    import uuid as _uuid
    from infrastructure.models.customers_models import CustomerProfileModel
    payload = request.get_json() or {}
    allowed = {"full_name", "email", "phone"}
    with session_scope() as session:
        profile = session.get(CustomerProfileModel, _uuid.UUID(customer_id))
        if not profile:
            return jsonify({"message": "customer_not_found"}), 404
        for field in allowed:
            if field in payload:
                setattr(profile, field, payload[field])
        session.flush()
        return jsonify({
            "id":        str(profile.id),
            "user_id":   str(profile.user_id) if profile.user_id else None,
            "full_name": profile.full_name,
            "email":     profile.email,
            "phone":     profile.phone,
        })


# ── Customer self-service endpoints ─────────────────────────────────────────

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

