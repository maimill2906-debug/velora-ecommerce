"""Webhook Shopee giả — chỉ nhận JSON và gọi service (không chứa business logic)."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from domain.exceptions import ValidationException
from services.shopee_order_service import get_shopee_demo_stock_for_product, handle_shopee_order

bp = Blueprint("shopee_webhook", __name__, url_prefix="/webhook/shopee")


@bp.post("/order")
def shopee_order_webhook():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"message": "json_body_required"}), 400
    try:
        result = handle_shopee_order(data)
    except ValidationException as exc:
        return jsonify({"message": exc.message}), 400
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(result), 200


@bp.get("/product-stock")
def shopee_product_stock_demo():
    """Demo UI: xem tồn kho trước khi đặt (không cần đăng nhập)."""
    raw = request.args.get("product_id")
    if raw is None or str(raw).strip() == "":
        return jsonify({"message": "product_id_required"}), 400
    try:
        info = get_shopee_demo_stock_for_product(raw)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(info), 200
