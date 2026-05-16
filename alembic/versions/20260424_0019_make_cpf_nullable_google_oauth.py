"""make cpf nullable for google oauth users

Revision ID: 20260424_0019
Revises: 20260320_0018
Create Date: 2026-04-24
"""
from __future__ import annotations
from alembic import op

revision = "20260424_0019"
down_revision = "20260320_0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.alter_column("cpf", nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("usuarios") as batch_op:
        batch_op.alter_column("cpf", nullable=False)
