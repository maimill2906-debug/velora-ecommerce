"""add order_status_history

Revision ID: d8c7a3e51f02
Revises: e4f2a8c1b9d0
Create Date: 2026-05-02

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "d8c7a3e51f02"
down_revision = "e4f2a8c1b9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    order_status_enum = postgresql.ENUM(
        "draft",
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        name="order_status",
        create_type=False,
    )
    op.create_table(
        "order_status_history",
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("status", order_status_enum, nullable=False),
        sa.Column("note", sa.String(length=1000), nullable=True),
        sa.Column("changed_by_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_order_status_history_order_id_created_at",
        "order_status_history",
        ["order_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_status_history_order_id_created_at",
        table_name="order_status_history",
    )
    op.drop_table("order_status_history")
