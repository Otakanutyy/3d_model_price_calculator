import uuid
from datetime import datetime
from pydantic import BaseModel


# --- Model3D ---
class ModelResponse(BaseModel):
    id: uuid.UUID
    filename: str
    original_name: str
    format: str
    status: str
    dim_x: float | None = None
    dim_y: float | None = None
    dim_z: float | None = None
    volume: float | None = None
    polygons: int | None = None
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- CalcParams ---
class CalcParamsResponse(BaseModel):
    id: uuid.UUID
    technology: str
    material_density: float
    material_price: float
    waste_factor: float
    infill: float
    support_percent: float
    print_time_h: float
    post_process_time_h: float
    modeling_time_h: float
    quantity: int
    is_batch: bool
    markup: float
    reject_rate: float
    tax_rate: float
    depreciation_rate: float
    energy_rate: float
    hourly_rate: float
    currency: str
    language: str

    model_config = {"from_attributes": True}


# --- CalcResult ---
class CalcResultResponse(BaseModel):
    id: uuid.UUID
    weight: float
    material_cost: float
    energy_cost: float
    depreciation: float
    prep_cost: float
    reject_cost: float
    unit_cost: float
    profit: float
    tax: float
    price_per_unit: float
    total_price: float
    calculated_at: datetime

    model_config = {"from_attributes": True}


# --- AiText ---
class AiTextResponse(BaseModel):
    id: uuid.UUID
    description: str | None = None
    commercial_text: str | None = None
    description_en: str | None = None
    description_ru: str | None = None
    commercial_text_en: str | None = None
    commercial_text_ru: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Project ---
class ProjectCreate(BaseModel):
    name: str
    date: datetime | None = None
    client: str | None = None
    contact: str | None = None
    notes: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    date: datetime | None = None
    client: str | None = None
    contact: str | None = None
    notes: str | None = None


class ProjectListItem(BaseModel):
    id: uuid.UUID
    name: str
    date: datetime | None
    client: str | None
    contact: str | None
    created_at: datetime
    updated_at: datetime
    has_model: bool = False
    model_status: str | None = None

    model_config = {"from_attributes": True}


class ProjectDetail(BaseModel):
    id: uuid.UUID
    name: str
    date: datetime | None
    client: str | None
    contact: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    model: ModelResponse | None = None
    calc_params: CalcParamsResponse | None = None
    calc_result: CalcResultResponse | None = None
    ai_text: AiTextResponse | None = None

    model_config = {"from_attributes": True}
