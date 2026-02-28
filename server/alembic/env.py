import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add the server root to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.base import Base
# Import all models so they register with Base metadata
from app.models.user import User  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.model3d import Model  # noqa: F401
from app.models.calc_params import CalcParams  # noqa: F401
from app.models.calc_result import CalcResult  # noqa: F401
from app.models.ai_text import AiText  # noqa: F401

config = context.config

# Override sqlalchemy.url from env if available
database_url = os.getenv("DATABASE_URL_SYNC")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
