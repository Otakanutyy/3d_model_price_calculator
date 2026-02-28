import os
import uuid
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.model3d import Model as Model3D
from app.schemas.project import ModelResponse
from app.tasks import enqueue_process_model

settings = get_settings()

router = APIRouter(prefix="/api/projects/{project_id}/model", tags=["models"])

ALLOWED_EXTENSIONS = {"stl", "obj", "3mf"}


def _get_extension(filename: str) -> str:
    """Extract lowercase extension without dot."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


async def _verify_project_ownership(
    project_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Project:
    """Verify that the project exists and belongs to the user."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def upload_model(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a 3D model file (STL/OBJ/3MF) to a project."""
    await _verify_project_ownership(project_id, user, db)

    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: .{ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Check file size
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Delete existing model if re-uploading
    existing = await db.execute(
        select(Model3D).where(Model3D.project_id == project_id)
    )
    old_model = existing.scalar_one_or_none()
    if old_model:
        # Remove old file
        old_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
        if os.path.exists(old_dir):
            shutil.rmtree(old_dir)
        await db.delete(old_model)
        await db.flush()

    # Save file to disk
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(upload_dir, exist_ok=True)

    # Use a deterministic filename to avoid collisions
    saved_filename = f"model.{ext}"
    file_path = os.path.join(upload_dir, saved_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    model = Model3D(
        project_id=project_id,
        filename=saved_filename,
        original_name=file.filename,
        format=ext,
        status="queued",
    )
    db.add(model)
    await db.flush()
    await db.refresh(model)

    # Enqueue Celery task
    enqueue_process_model(str(model.id), file_path)

    return model


@router.get("/status", response_model=ModelResponse)
async def get_model_status(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current status and analysis data of the project's 3D model."""
    await _verify_project_ownership(project_id, user, db)

    result = await db.execute(
        select(Model3D).where(Model3D.project_id == project_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="No model uploaded for this project")

    return model


@router.get("/file")
async def get_model_file(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Serve the raw 3D model file for the viewer."""
    await _verify_project_ownership(project_id, user, db)

    result = await db.execute(
        select(Model3D).where(Model3D.project_id == project_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="No model uploaded for this project")

    file_path = os.path.join(settings.UPLOAD_DIR, str(project_id), model.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model file not found on disk")

    # Content type mapping
    content_types = {
        "stl": "application/sla",
        "obj": "text/plain",
        "3mf": "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
    }

    return FileResponse(
        path=file_path,
        filename=model.original_name,
        media_type=content_types.get(model.format, "application/octet-stream"),
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the model from a project."""
    await _verify_project_ownership(project_id, user, db)

    result = await db.execute(
        select(Model3D).where(Model3D.project_id == project_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="No model uploaded for this project")

    # Remove file from disk
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)

    await db.delete(model)
