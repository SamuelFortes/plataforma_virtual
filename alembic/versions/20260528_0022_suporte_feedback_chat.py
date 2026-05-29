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
    # Usa SQL direto com IF NOT EXISTS para ser idempotente caso o banco já tenha
    # os objetos criados pelo create_all automático do SQLAlchemy.
    op.execute(sa.text(
        "ALTER TABLE suporte_feedback ADD COLUMN IF NOT EXISTS encerrado BOOLEAN NOT NULL DEFAULT false"
    ))

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS suporte_feedback_mensagens (
            id SERIAL NOT NULL,
            feedback_id INTEGER NOT NULL,
            autor_id INTEGER NOT NULL,
            conteudo TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            FOREIGN KEY(feedback_id) REFERENCES suporte_feedback (id) ON DELETE CASCADE,
            FOREIGN KEY(autor_id) REFERENCES usuarios (id)
        )
    """))

    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_sfm_feedback_id ON suporte_feedback_mensagens (feedback_id)"
    ))
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_sfm_autor_id ON suporte_feedback_mensagens (autor_id)"
    ))


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS ix_sfm_autor_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_sfm_feedback_id"))
    op.execute(sa.text("DROP TABLE IF EXISTS suporte_feedback_mensagens"))
    op.execute(sa.text(
        "ALTER TABLE suporte_feedback DROP COLUMN IF EXISTS encerrado"
    ))
