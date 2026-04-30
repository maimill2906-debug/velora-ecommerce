from __future__ import annotations

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.inventory_repository import InventoryRepository
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.repositories.rbac_repository import RbacRepository
from services.orders_service import OrdersService

bp = Blueprint("orders", __name__, url_prefix="/orders")


@bp.post("")
@require_auth
def create_order():
    payload = request.get_json() or {}
    required = ["code", "subtotal_amount", "total_amount", "items"]
    missing = [k for k in required if k not in payload]
    if missing:
        return jsonify({"message": "missing_fields", "fields": missing}), 400

    with session_scope() as session:
        svc = OrdersService(
            OrdersRepository(session),
            RbacRepository(session),
            inventory_repo=InventoryRepository(session),
        )
        try:
            order = svc.create_order_for_user(g.user_id, payload)
        except KeyError as e:
            return jsonify({"message": "invalid_payload", "detail": str(e)}), 400
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return jsonify({"id": str(order.id), "code": order.code, "status": order.status.value}), 201


@bp.get("")
@require_auth
@require_function(FunctionCodes.ORDER_READ)
def list_orders():
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        orders = svc.list_orders(limit=limit, offset=offset)
        return jsonify(
            [
                {
                    "id": str(o.id),
                    "code": o.code,
                    "status": o.status.value,
                    "customer_id": str(o.customer_id) if o.customer_id else None,
                    "subtotal_amount": int(o.subtotal_amount),
                    "discount_amount": int(o.discount_amount),
                    "shipping_fee": int(o.shipping_fee),
                    "total_amount": int(o.total_amount),
                    "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in orders
            ]
        )


@bp.get("/<order_id>")
@require_auth
@require_function(FunctionCodes.ORDER_READ)
def get_order_detail(order_id: str):
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            o = svc.get_order_detail(order_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        return jsonify(
            {
                "id": str(o.id),
                "code": o.code,
                "status": o.status.value,
                "customer_id": str(o.customer_id) if o.customer_id else None,
                "shipping_address_id": str(o.shipping_address_id) if o.shipping_address_id else None,
                "subtotal_amount": int(o.subtotal_amount),
                "discount_amount": int(o.discount_amount),
                "shipping_fee": int(o.shipping_fee),
                "total_amount": int(o.total_amount),
                "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                "items": [
                    {
                        "id": str(i.id),
                        "line_no": int(i.line_no),
                        "product_id": str(i.product_id) if i.product_id else None,
                        "variant_id": str(i.variant_id) if i.variant_id else None,
                        "quantity": int(i.quantity),
                        "unit_price": int(i.unit_price),
                        "line_total": int(i.line_total),
                    }
                    for i in (o.items or [])
                ],
                "payments": [
                    {
                        "id": str(p.id),
                        "method": p.method.value,
                        "status": p.status.value,
                        "amount": int(p.amount),
                        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                    for p in (o.payments or [])
                ],
            }
        )


@bp.patch("/<order_id>/status")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def update_order_status(order_id: str):
    payload = request.get_json() or {}
    status = payload.get("status")
    if not status:
        return jsonify({"message": "status_required"}), 400
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            o = svc.update_order_status(order_id=order_id, status=str(status))
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 404 if msg == "order_not_found" else 400
        return jsonify({"id": str(o.id), "code": o.code, "status": o.status.value}), 200


# Customer endpoints
@bp.get("/me")
@require_auth
def list_my_orders():
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            orders = svc.list_my_orders(g.user_id, limit=limit, offset=offset)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return jsonify(
            [
                {
                    "id": str(o.id),
                    "code": o.code,
                    "status": o.status.value,
                    "total_amount": int(o.total_amount),
                    "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                }
                for o in orders
            ]
        )


@bp.get("/track/<code>")
@require_auth
def track_order(code: str):
    with session_scope() as session:
        orders_repo = OrdersRepository(session)
        svc = OrdersService(orders_repo, RbacRepository(session))
        try:
            o = svc.track_my_order_by_code(g.user_id, code)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 403 if msg == "forbidden" else 404

        addr = None
        if o.shipping_address_id:
            addr = orders_repo.get_address(o.shipping_address_id)
        return jsonify(
            {
                "id": str(o.id),
                "code": o.code,
                "status": o.status.value,
                "total_amount": int(o.total_amount),
                "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                "shipping_address": (
                    {
                        "full_name": addr.full_name,
                        "phone": addr.phone,
                        "line1": addr.line1,
                        "line2": addr.line2,
                        "ward": addr.ward,
                        "district": addr.district,
                        "province": addr.province,
                        "country": addr.country,
                        "postal_code": addr.postal_code,
                    }
                    if addr
                    else None
                ),
                "items": [
                    {
                        "product_id": str(i.product_id) if i.product_id else None,
                        "variant_id": str(i.variant_id) if i.variant_id else None,
                        "quantity": int(i.quantity),
                        "unit_price": int(i.unit_price),
                        "line_total": int(i.line_total),
                    }
                    for i in (o.items or [])
                ],
            }
        )

