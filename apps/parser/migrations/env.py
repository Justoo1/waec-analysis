from __future__ import annotations

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Alembic Config object — gives access to values in alembic.ini
config = context.config

# Override sqlalchemy.url with environment variable at runtime
database_url = os.environ.get("DATABASE_URL")
if database_url:
    # Ensure we use the sync psycopg2 driver for Alembic migrations
    # (asyncpg is used by FastAPI at runtime, but Alembic needs sync)
    database_url = database_url.replace(
        "postgresql://", "postgresql+psycopg2://"
    ).replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Replace with your SQLAlchemy Base.metadata once models are defined:
# from app.db.models import Base
# target_metadata = Base.metadata
target_metadata = None


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
