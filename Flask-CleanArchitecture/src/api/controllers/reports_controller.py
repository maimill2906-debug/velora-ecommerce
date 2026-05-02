from __future__ import annotations

from flask import Blueprint, jsonify, request

from api.auth import require_auth, require_function
from domain.constants import FunctionCodes
from infrastructure.databases.session import session_scope
from infrastructure.repositories.reports_repository import ReportsRepository
from services.reports_service import ReportsService

bp = Blueprint("reports", __name__, url_prefix="/reports")


@bp.get("/summary")
@require_auth
@require_function(FunctionCodes.ORDER_READ)
def reports_summary():
    months = int(request.args.get("months", 6))
    months = max(1, min(months, 24))
    with session_scope() as session:
        svc = ReportsService(ReportsRepository(session))
        data = svc.dashboard_summary(months_back=months)
        return jsonify(data)
