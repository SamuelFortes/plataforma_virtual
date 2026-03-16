"""add weekly schedule fields to ubs

Revision ID: 20260315_0015
Revises: 20260315_0014
Create Date: 2026-03-15

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260315_0015"
down_revision = "20260315_0014"
branch_labels = None
depends_on = None


COLUMNS = [
    "cronograma_ubs_seg_manha",
    "cronograma_ubs_seg_tarde",
    "cronograma_ubs_ter_manha",
    "cronograma_ubs_ter_tarde",
    "cronograma_ubs_qua_manha",
    "cronograma_ubs_qua_tarde",
    "cronograma_ubs_qui_manha",
    "cronograma_ubs_qui_tarde",
    "cronograma_ubs_sex_manha",
    "cronograma_ubs_sex_tarde",
    "cronograma_residentes_seg_manha",
    "cronograma_residentes_seg_tarde",
    "cronograma_residentes_ter_manha",
    "cronograma_residentes_ter_tarde",
    "cronograma_residentes_qua_manha",
    "cronograma_residentes_qua_tarde",
    "cronograma_residentes_qui_manha",
    "cronograma_residentes_qui_tarde",
    "cronograma_residentes_sex_manha",
    "cronograma_residentes_sex_tarde",
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("ubs")}

    with op.batch_alter_table("ubs") as batch_op:
        for name in COLUMNS:
            if name not in existing:
                batch_op.add_column(sa.Column(name, sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("ubs")}

    with op.batch_alter_table("ubs") as batch_op:
        for name in COLUMNS:
            if name in existing:
                batch_op.drop_column(name)
