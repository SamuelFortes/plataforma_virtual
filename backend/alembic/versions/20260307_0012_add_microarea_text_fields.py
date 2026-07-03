"""add microarea text fields

Revision ID: 20260307_0012
Revises: 20260305_0011
Create Date: 2026-03-07

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260307_0012"
down_revision = "20260305_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "microareas" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("microareas")}

    json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")

    with op.batch_alter_table("microareas") as batch_op:
        if "localidades" not in existing_columns:
            batch_op.add_column(
                sa.Column(
                    "localidades",
                    json_type,
                    nullable=False,
                    server_default=sa.text("'[]'"),
                )
            )
        if "descricao" not in existing_columns:
            batch_op.add_column(
                sa.Column(
                    "descricao",
                    sa.Text(),
                    nullable=False,
                    server_default=sa.text("''"),
                )
            )
        if "observacoes" not in existing_columns:
            batch_op.add_column(sa.Column("observacoes", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "microareas" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("microareas")}

    with op.batch_alter_table("microareas") as batch_op:
        if "observacoes" in existing_columns:
            batch_op.drop_column("observacoes")
        if "descricao" in existing_columns:
            batch_op.drop_column("descricao")
        if "localidades" in existing_columns:
            batch_op.drop_column("localidades")
