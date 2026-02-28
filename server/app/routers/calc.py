"""Calc params + calculation result endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.calc_params import CalcParams
from app.models.calc_result import CalcResult
from app.schemas.project import CalcParamsResponse, CalcResultResponse
from app.schemas.calc_params import CalcParamsUpdate
from app.services.calculation import CalcInput, calculate

router = APIRouter(prefix="/api/projects/{project_id}", tags=["calculation"])


# ---- helpers ----

async def _get_project_for_user(
    project_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Project:
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.model),
            selectinload(Project.calc_params),
            selectinload(Project.calc_result),
        )
        .where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


# ---- Calc Params ----

@router.get("/params", response_model=CalcParamsResponse)
async def get_params(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current calc params (auto-creates with defaults if missing)."""
    project = await _get_project_for_user(project_id, user, db)

    if project.calc_params is None:
        # Create default params
        params = CalcParams(project_id=project.id)
        db.add(params)
        await db.flush()
        await db.refresh(params)
        return params

    return project.calc_params


@router.patch("/params", response_model=CalcParamsResponse)
async def update_params(
    project_id: uuid.UUID,
    data: CalcParamsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update calc params (creates with defaults + overrides if missing)."""
    project = await _get_project_for_user(project_id, user, db)

    if project.calc_params is None:
        params = CalcParams(project_id=project.id)
        db.add(params)
        await db.flush()
        await db.refresh(params)
    else:
        params = project.calc_params

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(params, field, value)

    await db.flush()
    await db.refresh(params)
    return params


# ---- Calculation ----

@router.get("/calculation", response_model=CalcResultResponse)
async def run_calculation(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run the calculation engine and persist the result."""
    project = await _get_project_for_user(project_id, user, db)

    # Need a processed model with volume
    if project.model is None or project.model.status != "done":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model must be uploaded and processed before calculation",
        )
    if project.model.volume is None or project.model.volume <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model volume is not available",
        )

    # Ensure params exist (auto-create defaults)
    if project.calc_params is None:
        params = CalcParams(project_id=project.id)
        db.add(params)
        await db.flush()
        await db.refresh(params)
    else:
        params = project.calc_params

    # Build calc input
    calc_input = CalcInput(
        volume=project.model.volume,
        material_density=params.material_density,
        material_price=params.material_price,
        waste_factor=params.waste_factor,
        infill=params.infill,
        support_percent=params.support_percent,
        print_time_h=params.print_time_h,
        post_process_time_h=params.post_process_time_h,
        modeling_time_h=params.modeling_time_h,
        quantity=params.quantity,
        markup=params.markup,
        reject_rate=params.reject_rate,
        tax_rate=params.tax_rate,
        depreciation_rate=params.depreciation_rate,
        energy_rate=params.energy_rate,
        hourly_rate=params.hourly_rate,
    )

    result = calculate(calc_input)

    # Upsert CalcResult
    if project.calc_result is None:
        calc_result = CalcResult(project_id=project.id)
        db.add(calc_result)
        await db.flush()
        await db.refresh(calc_result)
    else:
        calc_result = project.calc_result

    for field, value in result.model_dump().items():
        setattr(calc_result, field, value)

    await db.flush()
    await db.refresh(calc_result)
    return calc_result
