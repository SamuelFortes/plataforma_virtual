"""drop ativo from educational_materials

Revision ID: 20260320_0018
Revises: 20260320_0017
Create Date: 2026-03-20

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260320_0018"
down_revision = "20260320_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("educational_materials")}

    if "ativo" in existing:
        with op.batch_alter_table("educational_materials") as batch_op:
            batch_op.drop_column("ativo")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("educational_materials")}

    if "ativo" not in existing:
        with op.batch_alter_table("educational_materials") as batch_op:
            batch_op.add_column(sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("1")))
