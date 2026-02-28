from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "3D Model Price Calculator"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/calculator"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@db:5432/calculator"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production-very-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File uploads
    UPLOAD_DIR: str = "/uploads"
    MAX_UPLOAD_SIZE_MB: int = 100

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
