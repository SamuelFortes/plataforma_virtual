"""add indexes to microareas and agentes_saude FK columns

Revision ID: 20260528_0021
Revises: 20260516_0020
Create Date: 2026-05-28
"""
from __future__ import annotations
from alembic import op

revision = "20260528_0021"
down_revision = "20260516_0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_microareas_ubs_id", "microareas", ["ubs_id"])
    op.create_index("ix_agentes_saude_usuario_id", "agentes_saude", ["usuario_id"])
    op.create_index("ix_agentes_saude_microarea_id", "agentes_saude", ["microarea_id"])


def downgrade() -> None:
    op.drop_index("ix_microareas_ubs_id", table_name="microareas")
    op.drop_index("ix_agentes_saude_usuario_id", table_name="agentes_saude")
    op.drop_index("ix_agentes_saude_microarea_id", table_name="agentes_saude")
