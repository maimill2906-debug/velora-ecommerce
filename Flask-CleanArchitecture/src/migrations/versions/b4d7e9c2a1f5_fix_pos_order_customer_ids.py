"""fix pos order customer ids

Revision ID: b4d7e9c2a1f5
Revises: f3a8b2c91d7e
Create Date: 2026-05-03

Đơn POS cũ bị gán customer_id trỏ về profile của nhân viên (sales/admin)
thay vì khách hàng thực. Migration này set customer_id = NULL cho những
đơn đó để hiển thị "Khách lẻ" thay vì tên nhân viên.

Điều kiện chọn:
  - orders.code LIKE 'POS%'
  - orders.customer_id IS NOT NULL
  - customer_profiles.user_id → users.user_type != 'customer'
"""

from alembic import op
import sqlalchemy as sa

revision = "b4d7e9c2a1f5"
down_revision = "f3a8b2c91d7e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    result = conn.execute(
        sa.text(
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
    print(f"[fix_pos_order_customer_ids] Đã xóa customer_id khỏi {fixed} đơn POS.")


def downgrade() -> None:
    # Không thể khôi phục dữ liệu đã xóa — downgrade là no-op.
    pass
