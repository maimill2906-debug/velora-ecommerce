from __future__ import annotations

from flask import Blueprint, jsonify, request

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.inventory_repository import InventoryRepository
from services.inventory_service import InventoryService

bp = Blueprint("inventory", __name__, url_prefix="/inventory")


@bp.get("/locations")
@require_auth
@require_function(FunctionCodes.INVENTORY_READ)
def list_locations():
    with session_scope() as session:
        svc = InventoryService(InventoryRepository(session))
        items = svc.list_locations()
        return jsonify([{"id": str(i.id), "code": i.code, "name": i.name} for i in items])


@bp.post("/locations")
@require_auth
@require_function(FunctionCodes.INVENTORY_WRITE)
def create_location():
    payload = request.get_json() or {}
    code = payload.get("code")
    name = payload.get("name")
    if not code or not name:
        return jsonify({"message": "code_and_name_required"}), 400
    with session_scope() as session:
        svc = InventoryService(InventoryRepository(session))
        try:
            loc = svc.create_location(code=code, name=name)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return jsonify({"id": str(loc.id), "code": loc.code, "name": loc.name}), 201


@bp.get("/stock-items")
@require_auth
@require_function(FunctionCodes.INVENTORY_READ)
def list_stock_items():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    location_id = request.args.get("location_id")
    with session_scope() as session:
        svc = InventoryService(InventoryRepository(session))
        items = svc.list_stock_items(location_id=location_id, limit=limit, offset=offset)
        return jsonify(
            [
                {
                    "id": str(i.id),
                    "location_id": str(i.location_id),
                    "variant_id": str(i.variant_id),
                    "qty_on_hand": int(i.qty_on_hand),
                    "qty_reserved": int(i.qty_reserved),
                }
                for i in items
            ]
        )


@bp.get("/stock-transactions")
@require_auth
@require_function(FunctionCodes.INVENTORY_READ)
def list_stock_txns():
    limit = int(request.args.get("limit", 200))
    offset = int(request.args.get("offset", 0))
    location_id = request.args.get("location_id")
    with session_scope() as session:
        svc = InventoryService(InventoryRepository(session))
        txns = svc.list_txns(location_id=location_id, limit=limit, offset=offset)
        return jsonify(
            [
                {
                    "id": str(t.id),
                    "txn_type": t.txn_type.value,
                    "location_id": str(t.location_id),
                    "variant_id": str(t.variant_id),
                    "quantity": int(t.quantity),
                    "note": t.note,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
                for t in txns
            ]
        )


@bp.post("/stock-transactions")
@require_auth
@require_function(FunctionCodes.INVENTORY_WRITE)
def create_stock_txn():
    payload = request.get_json() or {}
    with session_scope() as session:
        svc = InventoryService(InventoryRepository(session))
        try:
            txn, new_on_hand = svc.create_stock_txn(payload)
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        return (
            jsonify(
                {
                    "id": str(txn.id),
                    "txn_type": txn.txn_type.value,
                    "location_id": str(txn.location_id),
                    "variant_id": str(txn.variant_id),
                    "quantity": int(txn.quantity),
                    "new_qty_on_hand": int(new_on_hand),
                }
            ),
            201,
        )

