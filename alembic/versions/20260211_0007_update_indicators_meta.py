"""Update indicators: remove type/precision, add meta/tipo_valor

Revision ID: 20260211_0007
Revises: 20260205_merge_heads
Create Date: 2026-02-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260211_0007"
down_revision = "20260205_merge_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("indicators")}

    with op.batch_alter_table("indicators") as batch_op:
        if "meta" not in columns:
            batch_op.add_column(sa.Column("meta", sa.Numeric(18, 4), nullable=True))
        if "tipo_valor" not in columns:
            batch_op.add_column(sa.Column("tipo_valor", sa.String(length=40), nullable=True, server_default="PERCENTUAL"))
        if "tipo_dado" in columns:
            batch_op.drop_column("tipo_dado")
        if "grau_precisao_valor" in columns:
            batch_op.drop_column("grau_precisao_valor")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("indicators")}

    with op.batch_alter_table("indicators") as batch_op:
        if "tipo_dado" not in columns:
            batch_op.add_column(
                sa.Column("tipo_dado", sa.String(length=40), nullable=False, server_default="TAXA_PERCENTUAL")
            )
        if "grau_precisao_valor" not in columns:
            batch_op.add_column(
                sa.Column("grau_precisao_valor", sa.String(length=40), nullable=False, server_default="UNIDADE")
            )
        if "meta" in columns:
            batch_op.drop_column("meta")
        if "tipo_valor" in columns:
            batch_op.drop_column("tipo_valor")
