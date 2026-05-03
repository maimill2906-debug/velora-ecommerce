from __future__ import annotations

from flask import Blueprint, jsonify, request, g

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.repositories.rbac_repository import RbacRepository
from services.orders_service import OrdersService
from infrastructure.repositories.channels_repository import ChannelsRepository
from infrastructure.repositories.inventory_repository import InventoryRepository

bp = Blueprint("page", __name__, url_prefix="/page")


@bp.get("/messages")
@require_auth
@require_function(FunctionCodes.PAGE_VIEW_MESSAGES)
def list_messages():
    """Xem tin nhắn từ Facebook/Zalo page.

    Endpoint stub — tích hợp thực tế với Facebook Graph API / Zalo OA API
    sẽ được thêm vào sau. Hiện trả về danh sách rỗng với metadata.
    """
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    channel = request.args.get("channel")  # "facebook" | "zalo" | None (all)

    return jsonify({
        "channel": channel,
        "limit": limit,
        "offset": offset,
        "total": 0,
        "messages": [],
        "note": "Tích hợp Facebook/Zalo chưa được cấu hình.",
    }), 200


@bp.post("/messages/reply")
@require_auth
@require_function(FunctionCodes.PAGE_REPLY_MESSAGES)
def reply_message():
    """Trả lời tin nhắn Facebook/Zalo.

    Endpoint stub — tích hợp thực tế sẽ gọi Graph API / Zalo OA.
    """
    payload = request.get_json() or {}
    required = ["message_id", "text"]
    missing = [k for k in required if not payload.get(k)]
    if missing:
        return jsonify({"message": "missing_fields", "fields": missing}), 400

    return jsonify({
        "message_id": payload["message_id"],
        "status": "queued",
        "note": "Tích hợp Facebook/Zalo chưa được cấu hình.",
    }), 202


@bp.post("/messages/create-order")
@require_auth
@require_function(FunctionCodes.PAGE_CREATE_ORDER)
def create_order_from_message():
    """Tạo đơn hàng từ hội thoại chat (thay mặt khách hàng).

    Nhận payload tương tự POST /orders nhưng phải có thêm `customer_id`
    để xác định khách hàng đặt hàng.
    """
    payload = request.get_json() or {}
    required = ["customer_id", "code", "subtotal_amount", "total_amount", "items"]
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

        return jsonify({
            "id": str(order.id),
            "code": order.code,
            "status": order.status.value,
            "source": "page_chat",
        }), 201
