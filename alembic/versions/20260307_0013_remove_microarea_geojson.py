"""remove microarea geojson

Revision ID: 20260307_0013
Revises: 20260307_0012
Create Date: 2026-03-07

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20260307_0013"
down_revision = "20260307_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "microareas" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("microareas")}

    if "geojson" not in existing_columns:
        return

    with op.batch_alter_table("microareas") as batch_op:
        batch_op.drop_column("geojson")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "microareas" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("microareas")}

    if "geojson" in existing_columns:
        return

    with op.batch_alter_table("microareas") as batch_op:
        batch_op.add_column(sa.Column("geojson", sa.JSON(), nullable=True))
