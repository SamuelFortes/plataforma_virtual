"""add active_ubs_id to usuarios

Revision ID: 20260320_0017
Revises: 20260315_0016
Create Date: 2026-03-20

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260320_0017"
down_revision = "20260315_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("usuarios")}

    with op.batch_alter_table("usuarios") as batch_op:
        if "active_ubs_id" not in existing:
            batch_op.add_column(sa.Column("active_ubs_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("usuarios")}

    with op.batch_alter_table("usuarios") as batch_op:
        if "active_ubs_id" in existing:
            batch_op.drop_column("active_ubs_id")
