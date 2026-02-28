from pydantic import BaseModel


class CalcParamsUpdate(BaseModel):
    technology: str | None = None
    material_density: float | None = None
    material_price: float | None = None
    waste_factor: float | None = None
    infill: float | None = None
    support_percent: float | None = None
    print_time_h: float | None = None
    post_process_time_h: float | None = None
    modeling_time_h: float | None = None
    quantity: int | None = None
    is_batch: bool | None = None
    markup: float | None = None
    reject_rate: float | None = None
    tax_rate: float | None = None
    depreciation_rate: float | None = None
    energy_rate: float | None = None
    hourly_rate: float | None = None
    currency: str | None = None
    language: str | None = None
