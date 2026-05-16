"""add status to ubs_problems

Revision ID: 20260516_0020
Revises: 20260424_0019
Create Date: 2026-05-16
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa

revision = "20260516_0020"
down_revision = "20260424_0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ubs_problems",
        sa.Column("status", sa.String(20), nullable=False, server_default="ATIVO"),
    )


def downgrade() -> None:
    op.drop_column("ubs_problems", "status")
