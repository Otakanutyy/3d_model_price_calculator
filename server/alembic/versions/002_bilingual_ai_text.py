"""add bilingual ai_text columns

Revision ID: 002
Revises: 001
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ai_texts", sa.Column("description_en", sa.Text(), nullable=True))
    op.add_column("ai_texts", sa.Column("description_ru", sa.Text(), nullable=True))
    op.add_column("ai_texts", sa.Column("commercial_text_en", sa.Text(), nullable=True))
    op.add_column("ai_texts", sa.Column("commercial_text_ru", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("ai_texts", "commercial_text_ru")
    op.drop_column("ai_texts", "commercial_text_en")
    op.drop_column("ai_texts", "description_ru")
    op.drop_column("ai_texts", "description_en")
