"""expand sale role permissions

Revision ID: f3a8b2c91d7e
Revises: d8c7a3e51f02
Create Date: 2026-05-03

Seeds 8 new granular function codes and assigns them to the admin and sales
roles. Also grants order.view_all to the marketing role so existing marketing
users keep read access to the order list endpoint.
"""

from alembic import op
import sqlalchemy as sa

revision = "f3a8b2c91d7e"
down_revision = "d8c7a3e51f02"
branch_labels = None
depends_on = None

# (code, name, description)
NEW_FUNCTIONS = [
    ("order.view_all",      "Xem tất cả đơn hàng",    "Xem đơn từ mọi kênh: website, Shopee, Lazada, POS"),
    ("order.confirm",       "Xác nhận đơn hàng",       "Chuyển trạng thái Đã đặt → Đã xác nhận"),
    ("order.pack",          "Đóng gói đơn hàng",       "Chuyển trạng thái → Đã đóng gói"),
    ("order.cancel",        "Hủy đơn hàng",            "Hủy đơn và hoàn kho tự động"),
    ("order.create_online", "Tạo đơn hàng online",     "Tạo đơn hàng từ chat/page thay mặt khách"),
    ("page.view_messages",  "Xem tin nhắn page",       "Xem tin nhắn Facebook/Zalo trong hệ thống"),
    ("page.reply_messages", "Trả lời tin nhắn page",   "Trả lời tin nhắn Facebook/Zalo"),
    ("page.create_order",   "Tạo đơn từ tin nhắn",    "Tạo đơn hàng trực tiếp từ hội thoại chat"),
]

SALES_CODES = {row[0] for row in NEW_FUNCTIONS}

MARKETING_CODES = {"order.view_all"}

ADMIN_CODES = SALES_CODES  # admin gets everything


def upgrade() -> None:
    conn = op.get_bind()

    # 1) Insert new functions (idempotent via ON CONFLICT DO NOTHING)
    for code, name, description in NEW_FUNCTIONS:
        conn.execute(
            sa.text(
                """
                INSERT INTO functions (id, code, name, description, created_at, updated_at)
                VALUES (gen_random_uuid(), :code, :name, :desc, now(), now())
                ON CONFLICT (code) DO NOTHING
                """
            ),
            {"code": code, "name": name, "desc": description},
        )

    # 2) Assign to admin role
    conn.execute(
        sa.text(
            """
            INSERT INTO role_functions (id, role_id, function_id, created_at)
            SELECT gen_random_uuid(), r.id, f.id, now()
            FROM roles r
            CROSS JOIN functions f
            WHERE r.code = 'admin'
              AND f.code = ANY(:codes)
            ON CONFLICT (role_id, function_id) DO NOTHING
            """
        ),
        {"codes": list(ADMIN_CODES)},
    )

    # 3) Assign to sales role
    conn.execute(
        sa.text(
            """
            INSERT INTO role_functions (id, role_id, function_id, created_at)
            SELECT gen_random_uuid(), r.id, f.id, now()
            FROM roles r
            CROSS JOIN functions f
            WHERE r.code = 'sales'
              AND f.code = ANY(:codes)
            ON CONFLICT (role_id, function_id) DO NOTHING
            """
        ),
        {"codes": list(SALES_CODES)},
    )

    # 4) Assign order.view_all to marketing so they keep order-list access
    conn.execute(
        sa.text(
            """
            INSERT INTO role_functions (id, role_id, function_id, created_at)
            SELECT gen_random_uuid(), r.id, f.id, now()
            FROM roles r
            CROSS JOIN functions f
            WHERE r.code = 'marketing'
              AND f.code = ANY(:codes)
            ON CONFLICT (role_id, function_id) DO NOTHING
            """
        ),
        {"codes": list(MARKETING_CODES)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    codes = [row[0] for row in NEW_FUNCTIONS]

    # Remove role assignments first (FK)
    conn.execute(
        sa.text(
            """
            DELETE FROM role_functions
            WHERE function_id IN (
                SELECT id FROM functions WHERE code = ANY(:codes)
            )
            """
        ),
        {"codes": codes},
    )

    # Remove functions
    conn.execute(
        sa.text("DELETE FROM functions WHERE code = ANY(:codes)"),
        {"codes": codes},
    )
