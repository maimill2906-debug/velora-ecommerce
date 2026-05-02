"""merge duplicate customer_profiles and unique user_id

Revision ID: e4f2a8c1b9d0
Revises: 70b59758fb1f
Create Date: 2026-04-30

"""

from alembic import op
import sqlalchemy as sa


revision = "e4f2a8c1b9d0"
down_revision = "70b59758fb1f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    # Gộp bản ghi trùng user_id về profile tạo sớm nhất; cập nhật FK rồi xóa bản thừa.
    bind.execute(
        sa.text(
            """
            CREATE TEMP TABLE _cp_dup ON COMMIT DROP AS
            WITH keepers AS (
              SELECT DISTINCT ON (user_id) id AS keeper_id, user_id
              FROM customer_profiles
              WHERE user_id IS NOT NULL
              ORDER BY user_id, created_at ASC
            ),
            dup AS (
              SELECT cp.id AS dup_id, k.keeper_id
              FROM customer_profiles cp
              INNER JOIN keepers k ON k.user_id = cp.user_id
              WHERE cp.id <> k.keeper_id
            )
            SELECT dup_id, keeper_id FROM dup;
            """
        )
    )

    bind.execute(
        sa.text(
            """
            DELETE FROM wishlist_items wi
            USING _cp_dup d
            WHERE wi.customer_id = d.dup_id
              AND EXISTS (
                SELECT 1 FROM wishlist_items w2
                WHERE w2.customer_id = d.keeper_id AND w2.product_id = wi.product_id
              );
            """
        )
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM notification_preferences np
            USING _cp_dup d
            WHERE np.customer_id = d.dup_id
              AND EXISTS (
                SELECT 1 FROM notification_preferences np2
                WHERE np2.customer_id = d.keeper_id AND np2.channel = np.channel
              );
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE addresses a SET customer_id = d.keeper_id
            FROM _cp_dup d
            WHERE a.customer_id = d.dup_id;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE orders o SET customer_id = d.keeper_id
            FROM _cp_dup d
            WHERE o.customer_id = d.dup_id;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE wishlist_items wi SET customer_id = d.keeper_id
            FROM _cp_dup d
            WHERE wi.customer_id = d.dup_id;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE notification_preferences np SET customer_id = d.keeper_id
            FROM _cp_dup d
            WHERE np.customer_id = d.dup_id;
            """
        )
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM customer_profiles cp
            USING _cp_dup d
            WHERE cp.id = d.dup_id;
            """
        )
    )

    op.create_index(
        "uq_customer_profiles_user_id",
        "customer_profiles",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_customer_profiles_user_id", table_name="customer_profiles")
