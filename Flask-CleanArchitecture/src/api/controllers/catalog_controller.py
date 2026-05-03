from __future__ import annotations

import os

from flask import Blueprint, jsonify, request, g
from sqlalchemy import select

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.models.inventory_models import InventoryLocationModel, StockItemModel
from infrastructure.repositories.catalog_repository import CatalogRepository
from services.catalog_service import CatalogService

bp = Blueprint("catalog", __name__, url_prefix="/catalog")


def _stock_map(session) -> dict[str, int] | None:
    """Return {variant_id_str: qty_on_hand} for the main warehouse.

    Returns None when inventory is not configured at all (location missing),
    so callers can distinguish "not configured" from "configured but qty=0".
    """
    loc_code = os.environ.get("DEFAULT_INVENTORY_LOCATION_CODE", "main_warehouse")
    loc = session.execute(
        select(InventoryLocationModel).where(InventoryLocationModel.code == loc_code)
    ).scalar_one_or_none()
    if not loc:
        return None
    rows = session.execute(
        select(StockItemModel).where(StockItemModel.location_id == loc.id)
    ).scalars().all()
    return {str(r.variant_id): int(r.qty_on_hand or 0) for r in rows}


def _variant_stock(stock: dict[str, int] | None, variant_id: str) -> tuple[bool, int | None]:
    """Return (in_stock, qty_on_hand) for a variant.

    Logic:
    - stock is None  → kho chưa cấu hình → in_stock=True, qty=None
    - variant KHÔNG có bản ghi → chưa nhập kho → in_stock=True, qty=None (không chặn oan)
    - variant có bản ghi qty=0 → hết hàng → in_stock=False
    - variant có bản ghi qty>0 → còn hàng → in_stock=True
    """
    if stock is None:
        return True, None
    qty = stock.get(variant_id)
    if qty is None:
        return True, None  # chưa nhập kho → không chặn
    return qty > 0, qty


@bp.get("/categories")
def list_categories():
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        cats = svc.list_categories()
        return jsonify(
            [{"id": str(c.id), "code": c.code, "name": c.name, "parent_id": str(c.parent_id) if c.parent_id else None} for c in cats]
        )


@bp.post("/categories")
@require_auth
@require_function(FunctionCodes.CATALOG_CATEGORY_CREATE)
def create_category():
    payload = request.get_json() or {}
    code = payload.get("code")
    name = payload.get("name")
    if not code or not name:
        return jsonify({"message": "code_and_name_required"}), 400
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        cat = svc.create_category(code=code, name=name, parent_id=payload.get("parent_id"))
        return jsonify({"id": str(cat.id), "code": cat.code, "name": cat.name}), 201


@bp.get("/products")
def list_products():
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        items = svc.list_products(limit=limit, offset=offset)
        stock = _stock_map(session)
        return jsonify(
            [
                {
                    "id": str(p.id),
                    "sku": p.sku,
                    "name": p.name,
                    "category_id": str(p.category_id) if p.category_id else None,
                    "style_segment": p.style_segment,
                    "is_active": p.is_active,
                    "original_price": p.original_price,
                    "rating_avg": p.rating_avg,
                    "review_count": p.review_count,
                    "images": [
                        {"id": str(i.id), "url": i.url, "sort_order": int(i.sort_order)}
                        for i in sorted((p.images or []), key=lambda x: int(x.sort_order or 0))
                    ],
                    "variants": [
                        {
                            "id": str(v.id),
                            "variant_sku": v.variant_sku,
                            "size": v.size,
                            "color": v.color,
                            "price": int(v.price),
                            **dict(zip(("in_stock", "qty_on_hand"), _variant_stock(stock, str(v.id)))),
                        }
                        for v in (p.variants or [])
                    ],
                }
                for p in items
            ]
        )


@bp.get("/products/<product_id>")
def get_product(product_id: str):
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            p, variants, images, tags = svc.get_product_detail(product_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        stock = _stock_map(session)
        return jsonify(
            {
                "id": str(p.id),
                "sku": p.sku,
                "name": p.name,
                "description": p.description,
                "material": p.material,
                "care_instructions": p.care_instructions,
                "category_id": str(p.category_id) if p.category_id else None,
                "style_segment": p.style_segment,
                "is_active": p.is_active,
                "original_price": p.original_price,
                "images": [{"id": str(i.id), "url": i.url, "sort_order": int(i.sort_order)} for i in images],
                "tags": [{"id": str(t.id), "code": t.code, "label": t.label} for t in tags],
                "variants": [
                    {
                        "id": str(v.id),
                        "variant_sku": v.variant_sku,
                        "size": v.size,
                        "color": v.color,
                        "price": int(v.price),
                        "in_stock": _variant_stock(stock, str(v.id))[0],
                        "qty_on_hand": _variant_stock(stock, str(v.id))[1],
                    }
                    for v in variants
                ],
            }
        )


@bp.post("/products")
@require_auth
@require_function(FunctionCodes.CATALOG_PRODUCT_CREATE)
def create_product():
    payload = request.get_json() or {}
    if not payload.get("sku") or not payload.get("name"):
        return jsonify({"message": "sku_and_name_required"}), 400
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        p = svc.create_product(payload)
        return jsonify({"id": str(p.id), "sku": p.sku, "name": p.name}), 201


@bp.post("/products/<product_id>/variants")
@require_auth
@require_function(FunctionCodes.CATALOG_VARIANT_CREATE)
def add_variant(product_id: str):
    payload = request.get_json() or {}
    if not payload.get("variant_sku") or payload.get("price") is None:
        return jsonify({"message": "variant_sku_and_price_required"}), 400
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            v = svc.add_variant(product_id, payload)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        return jsonify({"id": str(v.id), "variant_sku": v.variant_sku}), 201


@bp.get("/products/<product_id>/images")
def list_images(product_id: str):
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            imgs = svc.list_images(product_id)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        return jsonify([{"id": str(i.id), "url": i.url, "sort_order": int(i.sort_order)} for i in imgs])


@bp.post("/products/<product_id>/images")
@require_auth
@require_function(FunctionCodes.CATALOG_IMAGE_ADD)
def add_image(product_id: str):
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            img = svc.add_image(product_id, payload)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 404 if msg == "product_not_found" else 400
        return jsonify({"id": str(img.id), "url": img.url, "sort_order": int(img.sort_order)}), 201


@bp.get("/tags")
def list_tags():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        tags = svc.list_tags(limit=limit, offset=offset)
        return jsonify([{"id": str(t.id), "code": t.code, "label": t.label} for t in tags])


@bp.post("/tags")
@require_auth
@require_function(FunctionCodes.CATALOG_TAG_CREATE)
def create_tag():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            t = svc.create_tag(payload)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return jsonify({"id": str(t.id), "code": t.code, "label": t.label}), 201


@bp.post("/products/<product_id>/tags/<tag_id>")
@require_auth
@require_function(FunctionCodes.CATALOG_TAG_ASSIGN)
def assign_tag(product_id: str, tag_id: str):
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            link = svc.assign_tag(product_id, tag_id)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 404 if msg in ("product_not_found", "tag_not_found") else 400
        return jsonify({"id": str(link.id), "product_id": str(link.product_id), "tag_id": str(link.tag_id)}), 201


@bp.delete("/products/<product_id>/tags/<tag_id>")
@require_auth
@require_function(FunctionCodes.CATALOG_TAG_ASSIGN)
def unassign_tag(product_id: str, tag_id: str):
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            removed = svc.unassign_tag(product_id, tag_id)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 404 if msg == "product_not_found" else 400
        return jsonify({"removed": removed}), 200


@bp.get("/products/<product_id>/reviews")
def list_reviews(product_id: str):
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            reviews = svc.list_reviews(product_id, limit=limit, offset=offset)
        except ValueError as e:
            return jsonify({"message": str(e)}), 404
        return jsonify(
            [
                {
                    "id": str(r.id),
                    "user_id": str(r.user_id) if r.user_id else None,
                    "rating": int(r.rating),
                    "title": r.title,
                    "content": r.content,
                }
                for r in reviews
            ]
        )


@bp.post("/products/<product_id>/reviews")
@require_auth
def create_review(product_id: str):
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = CatalogService(CatalogRepository(session))
        try:
            r = svc.create_review(product_id=product_id, user_id=str(g.user_id), payload=payload)
        except ValueError as e:
            msg = str(e)
            return jsonify({"message": msg}), 404 if msg == "product_not_found" else 400
        return jsonify({"id": str(r.id), "rating": int(r.rating)}), 201

