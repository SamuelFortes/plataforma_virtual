"""add encerrado to suporte_feedback and create mensagens table

Revision ID: 20260528_0022
Revises: 20260528_0021
Create Date: 2026-05-28
"""
from __future__ import annotations
import sqlalchemy as sa
from alembic import op

revision = "20260528_0022"
down_revision = "20260528_0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "suporte_feedback",
        sa.Column("encerrado", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "suporte_feedback_mensagens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("feedback_id", sa.Integer(), nullable=False),
        sa.Column("autor_id", sa.Integer(), nullable=False),
        sa.Column("conteudo", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["feedback_id"], ["suporte_feedback.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["autor_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sfm_feedback_id", "suporte_feedback_mensagens", ["feedback_id"])
    op.create_index("ix_sfm_autor_id", "suporte_feedback_mensagens", ["autor_id"])


def downgrade() -> None:
    op.drop_index("ix_sfm_autor_id", table_name="suporte_feedback_mensagens")
    op.drop_index("ix_sfm_feedback_id", table_name="suporte_feedback_mensagens")
    op.drop_table("suporte_feedback_mensagens")
    op.drop_column("suporte_feedback", "encerrado")
