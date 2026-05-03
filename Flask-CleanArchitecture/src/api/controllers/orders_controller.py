from __future__ import annotations

import uuid

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.models.channels_models import SalesChannelModel
from infrastructure.models.customers_models import CustomerProfileModel
from datetime import datetime, timezone

from infrastructure.repositories.channels_repository import ChannelsRepository
from infrastructure.repositories.inventory_repository import InventoryRepository
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.repositories.rbac_repository import RbacRepository
from services.orders_service import OrdersService


def _addr_dict(addr):
    if not addr:
        return None
    return {
        "id": str(addr.id),
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


def _customer_dict(profile):
    if not profile:
        return None
    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "email": profile.email,
        "phone": profile.phone,
    }


_ORDER_CHANNEL_LABEL_VI = {
    "online": "Website",
    "pos": "Cửa hàng (POS)",
    "shopee": "Shopee",
    "lazada": "Lazada",
    "tiktok_shop": "TikTok Shop",
}


def _sales_channel_enum_by_id(session, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
    out: dict[uuid.UUID, str] = {}
    for cid in ids:
        row = session.get(SalesChannelModel, cid)
        if row is not None:
            out[cid] = row.channel.value
    return out


def _infer_channel_from_code(code: str | None) -> tuple[str, str] | None:
    """Suy luận kênh từ prefix mã đơn khi sales_channel_id chưa được ghi vào DB."""
    if not code:
        return None
    if code.startswith("POS"):
        return ("pos", _ORDER_CHANNEL_LABEL_VI["pos"])
    if code.startswith("VL"):
        return ("online", _ORDER_CHANNEL_LABEL_VI["online"])
    if code.startswith("SP"):
        rest = code[2:]
        if len(rest) >= 8 and rest.isdigit():
            return ("shopee", _ORDER_CHANNEL_LABEL_VI["shopee"])
    return None


def _resolve_order_channel(session, order, ch_enum: dict[uuid.UUID, str]) -> tuple[str | None, str]:
    """Ưu tiên FK sales_channels; nếu NULL (đơn cũ / lỗi ghi) suy luận từ mã đơn."""
    if order.sales_channel_id:
        ev = ch_enum.get(order.sales_channel_id)
        if ev is None:
            row = session.get(SalesChannelModel, order.sales_channel_id)
            if row is not None:
                ev = row.channel.value
                ch_enum[order.sales_channel_id] = ev
        if ev:
            return ev, _ORDER_CHANNEL_LABEL_VI.get(ev, ev)
    inferred = _infer_channel_from_code(order.code)
    if inferred:
        return inferred
    return None, "Chưa gán kênh"


bp = Blueprint("orders", __name__, url_prefix="/orders")


@bp.post("/fix-pos-customer-ids")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def fix_pos_customer_ids():
    """Fix một lần: đơn POS cũ đang gán customer_id về profile nhân viên → set NULL.

    Chạy sau khi deploy để dọn dữ liệu cũ. Idempotent.
    """
    from sqlalchemy import text
    fixed = 0
    with session_scope() as session:
        result = session.execute(
            text(
                """
                UPDATE orders
                SET customer_id = NULL
                WHERE code LIKE 'POS%%'
                  AND customer_id IS NOT NULL
                  AND customer_id IN (
                      SELECT cp.id
                      FROM   customer_profiles cp
                      JOIN   users u ON u.id = cp.user_id
                      WHERE  u.user_type::text != 'customer'
                  )
                """
            )
        )
        fixed = result.rowcount
    return jsonify({"message": "ok", "fixed": fixed}), 200


@bp.post("/fix-pos")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def fix_pos_orders():
    """Fix một lần: đơn POS cũ trong DB có status != delivered → chuyển thành delivered + paid."""
    from domain.models.enums import OrderStatus, PaymentMethod, PaymentStatus
    from infrastructure.models.orders_models import OrderModel, PaymentModel
    from sqlalchemy import select

    fixed = 0
    with session_scope() as session:
        # Lấy tất cả đơn POS chưa ở trạng thái hoàn thành
        pos_orders = (
            session.execute(
                select(OrderModel).where(
                    OrderModel.code.like("POS%"),
                    OrderModel.status.notin_([OrderStatus.delivered, OrderStatus.cancelled, OrderStatus.returned]),
                )
            ).scalars().all()
        )
        now = datetime.now(timezone.utc)
        for order in pos_orders:
            order.status = OrderStatus.delivered
            session.add(order)

            # Cập nhật hoặc tạo payment
            payment = session.execute(
                select(PaymentModel)
                .where(PaymentModel.order_id == order.id)
                .order_by(PaymentModel.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.paid
                if not payment.paid_at:
                    payment.paid_at = now
                session.add(payment)
            else:
                session.add(PaymentModel(
                    order_id=order.id,
                    method=PaymentMethod.cod,
                    status=PaymentStatus.paid,
                    amount=int(order.total_amount),
                    paid_at=now,
                ))

            fixed += 1

    return jsonify({"message": "ok", "fixed": fixed}), 200


@bp.post("/fix-channels")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def fix_channels():
    """Backfill: gán sales_channel_id cho mọi đơn cũ đang NULL dựa vào prefix mã đơn."""
    from domain.models.enums import SalesChannel
    from infrastructure.models.orders_models import OrderModel
    from infrastructure.repositories.channels_repository import ChannelsRepository
    from sqlalchemy import select

    fixed = 0
    with session_scope() as session:
        ch_repo = ChannelsRepository(session)

        # Lấy hoặc tạo các channel rows một lần.
        pos_ch = ch_repo.ensure_channel(SalesChannel.pos, "pos", "Cửa hàng (POS)")
        online_ch = ch_repo.ensure_channel(SalesChannel.online, "online", "Website")
        shopee_ch = ch_repo.ensure_shopee_channel()

        orders = (
            session.execute(
                select(OrderModel).where(OrderModel.sales_channel_id.is_(None))
            )
            .scalars()
            .all()
        )
        for order in orders:
            code = order.code or ""
            if code.startswith("POS"):
                order.sales_channel_id = pos_ch.id
            elif code.startswith("VL"):
                order.sales_channel_id = online_ch.id
            elif code.startswith("SP"):
                order.sales_channel_id = shopee_ch.id
            else:
                continue
            session.add(order)
            fixed += 1

    return jsonify({"message": "ok", "fixed": fixed}), 200


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
            channels_repo=ChannelsRepository(session),
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
@require_function(FunctionCodes.ORDER_VIEW_ALL)
def list_orders():
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        orders = svc.list_orders(limit=limit, offset=offset)

        cust_ids = {o.customer_id for o in orders if o.customer_id}
        cust_map = {}
        for cid in cust_ids:
            row = session.get(CustomerProfileModel, cid)
            if row:
                cust_map[cid] = row

        ch_ids = {o.sales_channel_id for o in orders if o.sales_channel_id}
        ch_enum = _sales_channel_enum_by_id(session, ch_ids)

        out_rows = []
        for o in orders:
            sc_code, ch_label = _resolve_order_channel(session, o, ch_enum)
            out_rows.append(
                {
                    "id": str(o.id),
                    "code": o.code,
                    "status": o.status.value,
                    "customer_id": str(o.customer_id) if o.customer_id else None,
                    "customer": _customer_dict(cust_map.get(o.customer_id)),
                    "sales_channel": sc_code,
                    "channel": ch_label,
                    "items_count": sum(int(i.quantity) for i in (o.items or [])),
                    "subtotal_amount": int(o.subtotal_amount),
                    "discount_amount": int(o.discount_amount),
                    "shipping_fee": int(o.shipping_fee),
                    "total_amount": int(o.total_amount),
                    "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
            )
        return jsonify(out_rows)


@bp.get("/<order_id>")
@require_auth
@require_function(FunctionCodes.ORDER_VIEW_ALL)
def get_order_detail(order_id: str):
    with session_scope() as session:
        orders_repo = OrdersRepository(session)
        svc = OrdersService(orders_repo, RbacRepository(session))
        try:
            o = svc.get_order_detail(order_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404

        customer = (
            session.get(CustomerProfileModel, o.customer_id) if o.customer_id else None
        )
        address = orders_repo.get_address(o.shipping_address_id) if o.shipping_address_id else None
        history = orders_repo.list_status_history(o.id)

        ch_enum = (
            _sales_channel_enum_by_id(session, {o.sales_channel_id})
            if o.sales_channel_id
            else {}
        )
        sc_code, ch_label = _resolve_order_channel(session, o, ch_enum)

        return jsonify(
            {
                "id": str(o.id),
                "code": o.code,
                "status": o.status.value,
                "customer_id": str(o.customer_id) if o.customer_id else None,
                "customer": _customer_dict(customer),
                "sales_channel": sc_code,
                "channel": ch_label,
                "shipping_address_id": str(o.shipping_address_id) if o.shipping_address_id else None,
                "shipping_address": _addr_dict(address),
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
                "status_history": [
                    {
                        "id": str(h.id),
                        "status": h.status.value,
                        "note": h.note,
                        "changed_by_user_id": str(h.changed_by_user_id) if h.changed_by_user_id else None,
                        "created_at": h.created_at.isoformat() if h.created_at else None,
                    }
                    for h in history
                ],
            }
        )


@bp.patch("/<order_id>/payment-status")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def update_payment_status(order_id: str):
    payload = request.get_json() or {}
    payment_status = payload.get("payment_status")
    payment_method = payload.get("payment_method")
    if not payment_status:
        return jsonify({"message": "payment_status_required"}), 400
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            result = svc.update_payment_status(
                order_id=order_id,
                payment_status=payment_status,
                payment_method=payment_method,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify(result), 200


@bp.patch("/<order_id>/status")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def update_order_status(order_id: str):
    payload = request.get_json() or {}
    status = payload.get("status")
    note = payload.get("note")
    if not status:
        return jsonify({"message": "status_required"}), 400
    with session_scope() as session:
        svc = OrdersService(
            OrdersRepository(session),
            RbacRepository(session),
            inventory_repo=InventoryRepository(session),
        )
        try:
            o = svc.update_order_status(
                order_id=order_id,
                status=str(status),
                note=str(note) if note else None,
                actor_user_id=g.user_id,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify({"id": str(o.id), "code": o.code, "status": o.status.value}), 200


@bp.post("/<order_id>/cancel")
@require_auth
@require_function(FunctionCodes.ORDER_CANCEL)
def cancel_order(order_id: str):
    payload = request.get_json() or {}
    note = payload.get("note") or "H\u1ee7y \u0111\u01a1n t\u1eeb admin/sales"
    with session_scope() as session:
        svc = OrdersService(
            OrdersRepository(session),
            RbacRepository(session),
            inventory_repo=InventoryRepository(session),
        )
        try:
            o = svc.update_order_status(
                order_id=order_id,
                status="cancelled",
                note=str(note),
                actor_user_id=g.user_id,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify({"id": str(o.id), "code": o.code, "status": o.status.value}), 200


@bp.post("/<order_id>/confirm")
@require_auth
@require_function(FunctionCodes.ORDER_CONFIRM)
def confirm_order(order_id: str):
    payload = request.get_json() or {}
    note = payload.get("note") or "X\u00e1c nh\u1eadn \u0111\u01a1n"
    with session_scope() as session:
        svc = OrdersService(
            OrdersRepository(session),
            RbacRepository(session),
            inventory_repo=InventoryRepository(session),
        )
        try:
            o = svc.update_order_status(
                order_id=order_id,
                status="confirmed",
                note=str(note),
                actor_user_id=g.user_id,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify({"id": str(o.id), "code": o.code, "status": o.status.value}), 200


@bp.post("/<order_id>/pack")
@require_auth
@require_function(FunctionCodes.ORDER_PACK)
def pack_order(order_id: str):
    payload = request.get_json() or {}
    note = payload.get("note") or "Đóng gói đơn hàng"
    with session_scope() as session:
        svc = OrdersService(
            OrdersRepository(session),
            RbacRepository(session),
            inventory_repo=InventoryRepository(session),
        )
        try:
            o = svc.update_order_status(
                order_id=order_id,
                status="packed",
                note=str(note),
                actor_user_id=g.user_id,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify({"id": str(o.id), "code": o.code, "status": o.status.value}), 200


@bp.get("/<order_id>/history")
@require_auth
@require_function(FunctionCodes.ORDER_VIEW_ALL)
def get_order_history(order_id: str):
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            history = svc.list_order_history(order_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        return jsonify(
            [
                {
                    "id": str(h.id),
                    "status": h.status.value,
                    "note": h.note,
                    "changed_by_user_id": str(h.changed_by_user_id) if h.changed_by_user_id else None,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                }
                for h in history
            ]
        )


@bp.patch("/<order_id>/confirm-payment")
@require_auth
@require_function(FunctionCodes.ORDER_UPDATE_STATUS)
def confirm_payment(order_id: str):
    """Admin manually confirms payment for an order (e.g. bank transfer verification)."""
    payload = request.get_json() or {}
    payment_method = payload.get("payment_method")
    with session_scope() as session:
        svc = OrdersService(OrdersRepository(session), RbacRepository(session))
        try:
            result = svc.update_payment_status(
                order_id=order_id,
                payment_status="paid",
                payment_method=payment_method,
            )
        except ValueError as e:
            msg = str(e)
            code = 404 if msg == "order_not_found" else 400
            return jsonify({"message": msg}), code
        return jsonify(result), 200


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

