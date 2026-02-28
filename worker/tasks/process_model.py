"""
3D Model processing task — parses STL/OBJ/3MF using trimesh,
extracts bounding box, volume, and face count, saves results to DB.
"""

import os
import uuid
import traceback

import trimesh
from sqlalchemy import create_engine, update
from sqlalchemy.orm import Session, sessionmaker

from tasks.celery_app import celery_app

# Sync DB connection for Celery worker (Celery doesn't support async)
DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL_SYNC", "postgresql://postgres:postgres@db:5432/calculator"
)
engine = create_engine(DATABASE_URL_SYNC)
SessionLocal = sessionmaker(bind=engine)

# We need the Model table — import via raw SQLAlchemy to avoid app dependency issues
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, MetaData, Table,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

metadata = MetaData()

models_table = Table(
    "models",
    metadata,
    Column("id", PG_UUID(as_uuid=True), primary_key=True),
    Column("project_id", PG_UUID(as_uuid=True)),
    Column("filename", String),
    Column("original_name", String),
    Column("format", String),
    Column("status", String),
    Column("dim_x", Float),
    Column("dim_y", Float),
    Column("dim_z", Float),
    Column("volume", Float),
    Column("polygons", Integer),
    Column("error_message", String),
    Column("created_at", DateTime(timezone=True)),
)


@celery_app.task(name="tasks.process_model", bind=True, max_retries=2)
def process_model(self, model_id: str, file_path: str):
    """
    Process a 3D model file:
    1. Set status to 'processing'
    2. Load with trimesh
    3. Extract dimensions, volume, polygon count
    4. Update DB with results (status='done') or error (status='error')
    """
    model_uuid = uuid.UUID(model_id)

    with SessionLocal() as session:
        # Mark as processing
        session.execute(
            update(models_table)
            .where(models_table.c.id == model_uuid)
            .values(status="processing", error_message=None)
        )
        session.commit()

    try:
        # Load mesh with trimesh
        mesh = trimesh.load(file_path, force="mesh")

        if mesh is None or not hasattr(mesh, "vertices") or len(mesh.vertices) == 0:
            raise ValueError("Failed to load mesh or mesh is empty")

        # Calculate bounding box dimensions
        bounds = mesh.bounds  # [[min_x, min_y, min_z], [max_x, max_y, max_z]]
        dim_x = float(bounds[1][0] - bounds[0][0])
        dim_y = float(bounds[1][1] - bounds[0][1])
        dim_z = float(bounds[1][2] - bounds[0][2])

        # Volume (only meaningful for watertight meshes, but we compute it anyway)
        try:
            volume = float(abs(mesh.volume))
        except Exception:
            # Fallback: estimate from bounding box if mesh isn't watertight
            volume = float(mesh.convex_hull.volume) if mesh.convex_hull else 0.0

        # Polygon/face count
        polygons = int(len(mesh.faces))

        # Update DB with results
        with SessionLocal() as session:
            session.execute(
                update(models_table)
                .where(models_table.c.id == model_uuid)
                .values(
                    status="done",
                    dim_x=round(dim_x, 4),
                    dim_y=round(dim_y, 4),
                    dim_z=round(dim_z, 4),
                    volume=round(volume, 6),
                    polygons=polygons,
                    error_message=None,
                )
            )
            session.commit()

        return {
            "status": "done",
            "dim_x": dim_x,
            "dim_y": dim_y,
            "dim_z": dim_z,
            "volume": volume,
            "polygons": polygons,
        }

    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {str(exc)}"
        tb = traceback.format_exc()
        print(f"Error processing model {model_id}: {error_msg}\n{tb}")

        with SessionLocal() as session:
            session.execute(
                update(models_table)
                .where(models_table.c.id == model_uuid)
                .values(status="error", error_message=error_msg[:1000])
            )
            session.commit()

        return {"status": "error", "error": error_msg}
