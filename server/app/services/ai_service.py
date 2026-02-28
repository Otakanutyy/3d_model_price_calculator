"""OpenAI integration for generating product descriptions."""

import json
import logging
from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)


def _build_prompt(
    project_name: str,
    client: str | None,
    technology: str,
    volume: float | None,
    dims: tuple[float | None, float | None, float | None],
    weight: float,
    material_cost: float,
    price_per_unit: float,
    total_price: float,
    quantity: int,
) -> str:
    dim_str = "N/A"
    if all(d is not None for d in dims):
        dim_str = f"{dims[0]:.1f} × {dims[1]:.1f} × {dims[2]:.1f} mm"

    return f"""You are an expert technical writer for a 3D printing service.

Given the following 3D-printed part details, generate FOUR texts — two in English and two in Russian:

1. **description_en** — A concise 2-3 sentence technical description in English suitable for an invoice or order specification. Include dimensions, technology, and key characteristics.
2. **description_ru** — The same technical description in Russian (на русском языке).
3. **commercial_text_en** — A short marketing paragraph (3-5 sentences) in English suitable for a product catalog or client proposal. Highlight value proposition, quality, and precision.
4. **commercial_text_ru** — The same marketing paragraph in Russian (на русском языке).

Part details:
- Project name: {project_name}
- Client: {client or "N/A"}
- Technology: {technology}
- Dimensions: {dim_str}
- Volume: {f"{volume:.1f} cm³" if volume else "N/A"}
- Weight: {weight:.1f} g
- Material cost: ${material_cost:.2f}
- Price per unit: ${price_per_unit:.2f}
- Quantity: {quantity}
- Total price: ${total_price:.2f}

Respond in this exact JSON format (no markdown fences):
{{"description_en": "...", "description_ru": "...", "commercial_text_en": "...", "commercial_text_ru": "..."}}
"""


async def generate_ai_texts(
    project_name: str,
    client: str | None,
    technology: str,
    volume: float | None,
    dims: tuple[float | None, float | None, float | None],
    weight: float,
    material_cost: float,
    price_per_unit: float,
    total_price: float,
    quantity: int,
    language: str = "en",  # kept for signature compat, not used anymore
) -> dict[str, str]:
    """Call OpenAI API and return bilingual texts."""
    settings = get_settings()

    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured")

    client_ai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = _build_prompt(
        project_name=project_name,
        client=client,
        technology=technology,
        volume=volume,
        dims=dims,
        weight=weight,
        material_cost=material_cost,
        price_per_unit=price_per_unit,
        total_price=total_price,
        quantity=quantity,
    )

    response = await client_ai.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    result = json.loads(content)

    return {
        "description_en": result.get("description_en", ""),
        "description_ru": result.get("description_ru", ""),
        "commercial_text_en": result.get("commercial_text_en", ""),
        "commercial_text_ru": result.get("commercial_text_ru", ""),
        # Legacy fields — fill with English version
        "description": result.get("description_en", ""),
        "commercial_text": result.get("commercial_text_en", ""),
    }
