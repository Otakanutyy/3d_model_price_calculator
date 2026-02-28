"""AI text generation endpoints."""

import uuid
import logging

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
from app.models.ai_text import AiText
from app.schemas.project import AiTextResponse
from app.schemas.ai import AiGenerateRequest, AiGenerateResponse
from app.services.ai_service import generate_ai_texts
from app.services.calculation import CalcInput, calculate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects/{project_id}", tags=["ai"])


async def _get_project_full(
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
            selectinload(Project.ai_text),
        )
        .where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/ai-generate", response_model=AiGenerateResponse)
async def ai_generate(
    project_id: uuid.UUID,
    body: AiGenerateRequest | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI description & commercial text, persist to AiText."""
    project = await _get_project_full(project_id, user, db)

    # Ensure we have calculation data
    if project.model is None or project.model.status != "done":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model must be uploaded and processed first",
        )

    # Ensure params exist
    if project.calc_params is None:
        params = CalcParams(project_id=project.id)
        db.add(params)
        await db.flush()
        await db.refresh(params)
    else:
        params = project.calc_params

    # Run calculation if no result yet
    if project.calc_result is None:
        calc_input = CalcInput(
            volume=project.model.volume or 0,
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
        calc_out = calculate(calc_input)
        calc_result_obj = CalcResult(project_id=project.id)
        db.add(calc_result_obj)
        await db.flush()
        await db.refresh(calc_result_obj)
        for field, value in calc_out.model_dump().items():
            setattr(calc_result_obj, field, value)
        await db.flush()
        await db.refresh(calc_result_obj)
        weight = calc_out.weight
        material_cost = calc_out.material_cost
        price_per_unit = calc_out.price_per_unit
        total_price = calc_out.total_price
    else:
        weight = project.calc_result.weight
        material_cost = project.calc_result.material_cost
        price_per_unit = project.calc_result.price_per_unit
        total_price = project.calc_result.total_price

    language = (body.language if body and body.language else params.language) or "en"

    try:
        texts = await generate_ai_texts(
            project_name=project.name,
            client=project.client,
            technology=params.technology,
            volume=project.model.volume,
            dims=(project.model.dim_x, project.model.dim_y, project.model.dim_z),
            weight=weight,
            material_cost=material_cost,
            price_per_unit=price_per_unit,
            total_price=total_price,
            quantity=params.quantity,
            language=language,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    # Upsert AiText
    if project.ai_text is None:
        ai_text = AiText(
            project_id=project.id,
            description=texts.get("description", ""),
            commercial_text=texts.get("commercial_text", ""),
            description_en=texts.get("description_en", ""),
            description_ru=texts.get("description_ru", ""),
            commercial_text_en=texts.get("commercial_text_en", ""),
            commercial_text_ru=texts.get("commercial_text_ru", ""),
        )
        db.add(ai_text)
    else:
        project.ai_text.description = texts.get("description", "")
        project.ai_text.commercial_text = texts.get("commercial_text", "")
        project.ai_text.description_en = texts.get("description_en", "")
        project.ai_text.description_ru = texts.get("description_ru", "")
        project.ai_text.commercial_text_en = texts.get("commercial_text_en", "")
        project.ai_text.commercial_text_ru = texts.get("commercial_text_ru", "")

    await db.flush()

    return AiGenerateResponse(
        description=texts.get("description", ""),
        commercial_text=texts.get("commercial_text", ""),
        description_en=texts.get("description_en", ""),
        description_ru=texts.get("description_ru", ""),
        commercial_text_en=texts.get("commercial_text_en", ""),
        commercial_text_ru=texts.get("commercial_text_ru", ""),
    )


@router.get("/ai-text", response_model=AiTextResponse)
async def get_ai_text(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved AI-generated text."""
    project = await _get_project_full(project_id, user, db)

    if project.ai_text is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI text generated yet. Call POST /ai-generate first.",
        )

    return project.ai_text
