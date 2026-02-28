"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Projects
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("client", sa.String(255), nullable=True),
        sa.Column("contact", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Models (3D files)
    op.create_table(
        "models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("format", sa.String(10), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("dim_x", sa.Float, nullable=True),
        sa.Column("dim_y", sa.Float, nullable=True),
        sa.Column("dim_z", sa.Float, nullable=True),
        sa.Column("volume", sa.Float, nullable=True),
        sa.Column("polygons", sa.Integer, nullable=True),
        sa.Column("error_message", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Calculation parameters
    op.create_table(
        "calc_params",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("technology", sa.String(50), server_default="FDM"),
        sa.Column("material_density", sa.Float, server_default="1.24"),
        sa.Column("material_price", sa.Float, server_default="25.0"),
        sa.Column("waste_factor", sa.Float, server_default="1.1"),
        sa.Column("infill", sa.Float, server_default="20.0"),
        sa.Column("support_percent", sa.Float, server_default="10.0"),
        sa.Column("print_time_h", sa.Float, server_default="1.0"),
        sa.Column("post_process_time_h", sa.Float, server_default="0.5"),
        sa.Column("modeling_time_h", sa.Float, server_default="0.0"),
        sa.Column("quantity", sa.Integer, server_default="1"),
        sa.Column("is_batch", sa.Boolean, server_default="false"),
        sa.Column("markup", sa.Float, server_default="1.5"),
        sa.Column("reject_rate", sa.Float, server_default="0.05"),
        sa.Column("tax_rate", sa.Float, server_default="0.20"),
        sa.Column("depreciation_rate", sa.Float, server_default="2.0"),
        sa.Column("energy_rate", sa.Float, server_default="0.15"),
        sa.Column("hourly_rate", sa.Float, server_default="30.0"),
        sa.Column("currency", sa.String(10), server_default="'USD'"),
        sa.Column("language", sa.String(10), server_default="'en'"),
    )

    # Calculation results
    op.create_table(
        "calc_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("weight", sa.Float, server_default="0.0"),
        sa.Column("material_cost", sa.Float, server_default="0.0"),
        sa.Column("energy_cost", sa.Float, server_default="0.0"),
        sa.Column("depreciation", sa.Float, server_default="0.0"),
        sa.Column("prep_cost", sa.Float, server_default="0.0"),
        sa.Column("reject_cost", sa.Float, server_default="0.0"),
        sa.Column("unit_cost", sa.Float, server_default="0.0"),
        sa.Column("profit", sa.Float, server_default="0.0"),
        sa.Column("tax", sa.Float, server_default="0.0"),
        sa.Column("price_per_unit", sa.Float, server_default="0.0"),
        sa.Column("total_price", sa.Float, server_default="0.0"),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # AI texts
    op.create_table(
        "ai_texts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("commercial_text", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("ai_texts")
    op.drop_table("calc_results")
    op.drop_table("calc_params")
    op.drop_table("models")
    op.drop_table("projects")
    op.drop_table("users")
