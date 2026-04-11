from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

Base = declarative_base()


def _normalize_database_url(url: str) -> str:
    if not url:
        return url
        
    # No psycopg3 (seu caso), o driver deve ser explicitamente +psycopg
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    
    # Se estiver usando a porta 6543 (Pooler do Supabase em modo de transação),
    # precisamos desativar prepared statements para o SQLAlchemy/psycopg.
    if ":6543" in url:
        if "prepare_threshold=0" not in url:
            separator = "&" if "?" in url else "?"
            url += f"{separator}prepare_threshold=0"
        
        if "connect_timeout" not in url:
            url += "&connect_timeout=20"
        
    return url


def _build_database_url_from_parts() -> str | None:
    database_user = os.getenv("DB_USER")
    database_password = os.getenv("DB_PASSWORD")
    database_host = os.getenv("DB_HOST")
    database_port = os.getenv("DB_PORT")
    database_name = os.getenv("DB_NAME")

    if not all([database_user, database_password, database_host, database_port, database_name]):
        return None

    return (
        f"postgresql+psycopg://{database_user}:{database_password}"
        f"@{database_host}:{database_port}/{database_name}"
    )


if not DATABASE_URL:
    DATABASE_URL = _build_database_url_from_parts()

if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./dev.db"

DATABASE_URL = _normalize_database_url(DATABASE_URL)

# Log seguro para debug (sem senha)
try:
    if "@" in DATABASE_URL:
        prefix, rest = DATABASE_URL.split("://", 1)
        user_pass, host_db = rest.split("@", 1)
        user = user_pass.split(":")[0]
        print(f"INFO: Database Attempt -> Driver: {prefix} | User: {user} | Target: {host_db}", flush=True)
    else:
        print(f"INFO: Database Attempt -> {DATABASE_URL}", flush=True)
except Exception:
    print("INFO: Database Attempt -> (URL format error in log)", flush=True)

#Criando a engine
engine_kwargs = {
    "echo": False,
    "future": True,
}

if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 2,
        "max_overflow": 3,
        "pool_recycle": 1800,
        "pool_timeout": 30,
    })

engine = None
AsyncSessionLocal = None

if os.getenv("SKIP_ASYNC_ENGINE") != "1":
    engine = create_async_engine(DATABASE_URL, **engine_kwargs)
    AsyncSessionLocal = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


async def get_db():
    if AsyncSessionLocal is None:
        raise RuntimeError("Async engine not initialized")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
