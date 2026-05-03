from __future__ import annotations

from flask import Blueprint, jsonify, request

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.marketing_repository import MarketingRepository
from services.marketing_service import MarketingService

bp = Blueprint("marketing", __name__, url_prefix="/marketing")


# Vouchers
@bp.get("/vouchers/validate")
@require_auth
def validate_voucher():
    """Kiểm tra mã giảm giá — dùng cho POS/checkout, không cần quyền marketing."""
    code = request.args.get("code", "").strip().upper()
    subtotal = int(request.args.get("subtotal", 0))
    if not code:
        return jsonify({"message": "code_required"}), 400
    with session_scope() as session:
        repo = MarketingRepository(session)
        v = repo.get_voucher_by_code(code)
        if not v:
            return jsonify({"message": "voucher_not_found"}), 404
        if v.discount_amount:
            calculated = min(int(v.discount_amount), subtotal)
        elif v.discount_percent:
            calculated = int(subtotal * v.discount_percent / 100)
        else:
            calculated = 0
        return jsonify({
            "id": str(v.id),
            "code": v.code,
            "name": v.name,
            "discount_amount": v.discount_amount,
            "discount_percent": v.discount_percent,
            "calculated_discount": calculated,
        }), 200


@bp.get("/vouchers")
@require_auth
@require_function(FunctionCodes.MARKETING_READ)
def list_vouchers():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = MarketingService(MarketingRepository(session))
        items = svc.list_vouchers(limit=limit, offset=offset)
        return jsonify(
            [
                {
                    "id": str(v.id),
                    "code": v.code,
                    "name": v.name,
                    "discount_amount": v.discount_amount,
                    "discount_percent": v.discount_percent,
                    "max_uses": v.max_uses,
                }
                for v in items
            ]
        )


@bp.post("/vouchers")
@require_auth
@require_function(FunctionCodes.MARKETING_WRITE)
def create_voucher():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = MarketingService(MarketingRepository(session))
        try:
            v = svc.create_voucher(payload)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return jsonify({"id": str(v.id), "code": v.code, "name": v.name}), 201


# Campaigns
@bp.get("/campaigns")
@require_auth
@require_function(FunctionCodes.MARKETING_READ)
def list_campaigns():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = MarketingService(MarketingRepository(session))
        items = svc.list_campaigns(limit=limit, offset=offset)
        return jsonify(
            [
                {
                    "id": str(c.id),
                    "code": c.code,
                    "name": c.name,
                    "channel": c.channel.value,
                    "status": c.status.value,
                }
                for c in items
            ]
        )


@bp.post("/campaigns")
@require_auth
@require_function(FunctionCodes.MARKETING_WRITE)
def create_campaign():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = MarketingService(MarketingRepository(session))
        try:
            c = svc.create_campaign(payload)
        except (ValueError, Exception) as e:
            return jsonify({"message": str(e)}), 400
        return jsonify({"id": str(c.id), "code": c.code, "name": c.name}), 201

