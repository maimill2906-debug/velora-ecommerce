from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.models.inventory_models import InventoryLocationModel

_DEFAULT_LOCATIONS = [
    {"code": "main_warehouse", "name": "Kho trung tâm"},
    {"code": "pos_store_1",    "name": "Cửa hàng HN"},
    {"code": "pos_store_2",    "name": "Cửa hàng TPHCM"},
]


def seed_inventory_locations(session: Session) -> None:
    """Tạo các kho mặc định nếu chưa tồn tại. Idempotent — an toàn gọi nhiều lần."""
    for loc in _DEFAULT_LOCATIONS:
        exists = session.execute(
            select(InventoryLocationModel).where(InventoryLocationModel.code == loc["code"])
        ).scalar_one_or_none()
        if not exists:
            session.add(InventoryLocationModel(code=loc["code"], name=loc["name"]))
    session.commit()
