from __future__ import annotations

from flask import Blueprint, jsonify, request

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.customers_repository import CustomersRepository
from infrastructure.repositories.orders_repository import OrdersRepository
from infrastructure.repositories.rbac_repository import RbacRepository

bp = Blueprint("admin_users", __name__, url_prefix="/admin/users")


@bp.get("")
@require_auth
@require_function(FunctionCodes.CUSTOMER_READ)
def list_users():
    """List all users (admin)."""
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    user_type = request.args.get("user_type")
    with session_scope() as session:
        rbac = RbacRepository(session)
        customers_repo = CustomersRepository(session)
        orders_repo = OrdersRepository(session)
        items = rbac.list_users(limit=limit, offset=offset)
        if user_type:
            items = [u for u in items if (u.user_type.value if hasattr(u.user_type, "value") else str(u.user_type)) == user_type]

        result = []
        for u in items:
            # Aggregate purchase stats from this user's customer profile (if any)
            profile = customers_repo.get_profile_by_user_id(u.id)
            order_count = 0
            total_spent = 0
            last_order_at = None
            if profile is not None:
                user_orders = orders_repo.list_orders_for_customer(profile.id, limit=1000, offset=0)
                order_count = len(user_orders)
                total_spent = sum(int(o.total_amount or 0) for o in user_orders)
                placed_dates = [o.placed_at for o in user_orders if o.placed_at]
                if placed_dates:
                    last_order_at = max(placed_dates).isoformat()

            result.append(
                {
                    "id": str(u.id),
                    "user_type": u.user_type.value if hasattr(u.user_type, "value") else str(u.user_type),
                    "status": u.status.value if hasattr(u.status, "value") else str(u.status),
                    "full_name": u.full_name,
                    "email": u.email,
                    "phone": u.phone,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "order_count": order_count,
                    "total_spent": total_spent,
                    "last_order_at": last_order_at,
                }
            )
        return jsonify(result)
