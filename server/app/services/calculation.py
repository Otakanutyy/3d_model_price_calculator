"""Pure calculation engine — no DB dependency, Pydantic I/O."""

from pydantic import BaseModel


class CalcInput(BaseModel):
    # From model analysis
    volume: float  # cm³

    # From calc_params
    material_density: float  # g/cm³
    material_price: float  # per kg
    waste_factor: float  # multiplier (e.g. 1.1 for 10% waste)
    infill: float  # % (0-100)
    support_percent: float  # % (0-100)
    print_time_h: float
    post_process_time_h: float
    modeling_time_h: float
    quantity: int
    markup: float  # multiplier (e.g. 1.5 for 50% markup)
    reject_rate: float  # fraction (e.g. 0.05 for 5%)
    tax_rate: float  # fraction (e.g. 0.20 for 20%)
    depreciation_rate: float  # per hour
    energy_rate: float  # per hour
    hourly_rate: float  # labor cost per hour


class CalcOutput(BaseModel):
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


def calculate(inp: CalcInput) -> CalcOutput:
    """Run the full price calculation and return a breakdown."""

    # Effective volume = base volume * infill fraction + support volume
    infill_frac = inp.infill / 100.0
    support_frac = inp.support_percent / 100.0
    effective_volume = inp.volume * (infill_frac + support_frac)

    # Weight in grams, then kg
    weight_g = effective_volume * inp.material_density
    weight_kg = weight_g / 1000.0

    # Material cost
    material_cost = weight_kg * inp.material_price * inp.waste_factor

    # Energy cost
    energy_cost = inp.print_time_h * inp.energy_rate

    # Depreciation
    depreciation = inp.print_time_h * inp.depreciation_rate

    # Prep cost (modeling + post-processing labor)
    prep_cost = (inp.modeling_time_h + inp.post_process_time_h) * inp.hourly_rate

    # Base unit cost before reject
    base_unit_cost = material_cost + energy_cost + depreciation + prep_cost

    # Reject cost
    reject_cost = base_unit_cost * inp.reject_rate

    # Unit cost
    unit_cost = base_unit_cost + reject_cost

    # Profit
    profit = unit_cost * (inp.markup - 1.0)  # markup is multiplier, profit is the margin part

    # Tax
    tax = (unit_cost + profit) * inp.tax_rate

    # Price per unit
    price_per_unit = unit_cost + profit + tax

    # Total price
    total_price = price_per_unit * inp.quantity

    return CalcOutput(
        weight=round(weight_g, 2),
        material_cost=round(material_cost, 4),
        energy_cost=round(energy_cost, 4),
        depreciation=round(depreciation, 4),
        prep_cost=round(prep_cost, 4),
        reject_cost=round(reject_cost, 4),
        unit_cost=round(unit_cost, 4),
        profit=round(profit, 4),
        tax=round(tax, 4),
        price_per_unit=round(price_per_unit, 4),
        total_price=round(total_price, 4),
    )
