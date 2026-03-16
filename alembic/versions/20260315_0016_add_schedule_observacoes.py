"""add schedule observations fields

Revision ID: 20260315_0016
Revises: 20260315_0015
Create Date: 2026-03-15

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260315_0016"
down_revision = "20260315_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("ubs")}

    with op.batch_alter_table("ubs") as batch_op:
        if "cronograma_ubs_observacoes" not in existing:
            batch_op.add_column(sa.Column("cronograma_ubs_observacoes", sa.Text(), nullable=True))
        if "cronograma_residentes_observacoes" not in existing:
            batch_op.add_column(sa.Column("cronograma_residentes_observacoes", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("ubs")}

    with op.batch_alter_table("ubs") as batch_op:
        if "cronograma_ubs_observacoes" in existing:
            batch_op.drop_column("cronograma_ubs_observacoes")
        if "cronograma_residentes_observacoes" in existing:
            batch_op.drop_column("cronograma_residentes_observacoes")
