"""drop ubs attachments table

Revision ID: 20260315_0014
Revises: 20260307_0013
Create Date: 2026-03-15

"""

from __future__ import annotations

from alembic import op


# revision identifiers, used by Alembic.
revision = "20260315_0014"
down_revision = "20260307_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove funcionalidade de anexos do relatório situacional.
    op.execute("DROP TABLE IF EXISTS ubs_attachments")


def downgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ubs_attachments (
            id serial PRIMARY KEY,
            ubs_id integer NOT NULL REFERENCES ubs (id) ON DELETE CASCADE,
            original_filename character varying(255) NOT NULL,
            content_type character varying(100) NULL,
            size_bytes integer NOT NULL,
            storage_path text NOT NULL,
            section character varying(50) NULL,
            description text NULL,
            created_at timestamp with time zone NULL DEFAULT now()
        )
        """
    )
