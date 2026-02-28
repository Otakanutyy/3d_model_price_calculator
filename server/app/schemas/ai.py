from pydantic import BaseModel


class AiGenerateRequest(BaseModel):
    """Optional overrides for AI generation."""
    language: str | None = None  # kept for compat, not used


class AiGenerateResponse(BaseModel):
    description: str | None = None
    commercial_text: str | None = None
    description_en: str | None = None
    description_ru: str | None = None
    commercial_text_en: str | None = None
    commercial_text_ru: str | None = None
