import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectListItem,
    ProjectDetail,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.model))
        .where(Project.user_id == user.id)
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()

    items = []
    for p in projects:
        items.append(
            ProjectListItem(
                id=p.id,
                name=p.name,
                date=p.date,
                client=p.client,
                contact=p.contact,
                created_at=p.created_at,
                updated_at=p.updated_at,
                has_model=p.model is not None,
                model_status=p.model.status if p.model else None,
            )
        )
    return items


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=user.id,
        name=data.name,
        date=data.date,
        client=data.client,
        contact=data.contact,
        notes=data.notes,
    )
    db.add(project)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.model),
            selectinload(Project.calc_params),
            selectinload(Project.calc_result),
            selectinload(Project.ai_text),
        )
        .where(Project.id == project.id)
    )
    return result.scalar_one()


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.model),
            selectinload(Project.calc_params),
            selectinload(Project.calc_result),
            selectinload(Project.ai_text),
        )
        .where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectDetail)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.model),
            selectinload(Project.calc_params),
            selectinload(Project.calc_result),
            selectinload(Project.ai_text),
        )
        .where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.flush()

    # Reload with relationships
    result2 = await db.execute(
        select(Project)
        .options(
            selectinload(Project.model),
            selectinload(Project.calc_params),
            selectinload(Project.calc_result),
            selectinload(Project.ai_text),
        )
        .where(Project.id == project.id)
    )
    return result2.scalar_one()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.delete(project)
