from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import url as sa_url
from dotenv import load_dotenv

# Carrega variáveis do .env (mesma convenção do app)
load_dotenv()

# Alembic Config
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importa metadata do projeto e a DATABASE_URL já normalizada
os.environ.setdefault("SKIP_ASYNC_ENGINE", "1")
from app.database import Base, DATABASE_URL  # noqa: E402
import app.models.auth_models  # noqa: F401,E402
import app.models.diagnostico_models  # noqa: F401,E402

target_metadata = Base.metadata


def get_database_url() -> str:
    """Retorna a URL do banco ajustada para o Alembic (síncrono)"""
    url = DATABASE_URL

    # Se a URL for SQLite assíncrono, converte para síncrono
    if url.startswith("sqlite+aiosqlite"):
        return url.replace("sqlite+aiosqlite", "sqlite", 1)

    # Alembic usa o motor síncrono do psycopg3 (postgresql+psycopg)
    # Nossa DATABASE_URL já está nesse formato ou similar.
    return url


def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Obtém a URL normalizada
    db_url = get_database_url()
    
    # Configuração customizada para lidar com o Supabase Pooler no Alembic
    connect_args = {}
    parsed_url = sa_url.make_url(db_url)
    if parsed_url.port == 6543:
        connect_args["prepare_threshold"] = None

    connectable = engine_from_config(
        {"sqlalchemy.url": db_url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
        connect_args=connect_args
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
