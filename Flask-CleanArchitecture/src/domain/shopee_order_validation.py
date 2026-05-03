"""Validate payload webhook Shopee (demo). Pure Python — không Flask/SQLAlchemy."""

from __future__ import annotations

from domain.exceptions import ValidationException


def validate_shopee_order_payload(data: dict) -> None:
    if not isinstance(data, dict):
        raise ValidationException("payload_must_be_json_object")
    order_id = data.get("order_id")
    if order_id is None or str(order_id).strip() == "":
        raise ValidationException("order_id_required")
    items = data.get("items")
    if not items or not isinstance(items, list):
        raise ValidationException("items_required")
    for idx, it in enumerate(items):
        if not isinstance(it, dict):
            raise ValidationException(f"item_invalid_at_index_{idx}")
        if "product_id" not in it:
            raise ValidationException(f"product_id_required_at_index_{idx}")
        if "quantity" not in it:
            raise ValidationException(f"quantity_required_at_index_{idx}")
        try:
            qty = int(it["quantity"])
        except (TypeError, ValueError) as exc:
            raise ValidationException("quantity_must_be_integer") from exc
        if qty < 1:
            raise ValidationException("quantity_must_be_positive")
