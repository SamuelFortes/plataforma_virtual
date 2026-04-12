from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine.url import make_url
import os
import sys
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

# .strip() remove espaços em branco acidentais
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

Base = declarative_base()


def _normalize_database_url(url: str) -> str:
    if not url:
        return url
        
    try:
        # Se a URL contiver múltiplos '@', codificamos a senha
        if url.count("@") > 1 and "://" in url:
            prefix, rest = url.split("://", 1)
            if "@" in rest:
                # Divide no último '@', que separa auth do host
                auth, host_part = rest.rsplit("@", 1)
                if ":" in auth:
                    user, password = auth.split(":", 1)
                    # Decodifica se já estiver codificado e recodifica (evita erro de duplo @)
                    clean_pass = urllib.parse.quote_plus(urllib.parse.unquote(password))
                    url = f"{prefix}://{user}:{clean_pass}@{host_part}"

        parsed_url = make_url(url)
        
        # Garante o driver correto para psycopg3 (assíncrono)
        new_driver = "postgresql+psycopg"
        if parsed_url.drivername.startswith("sqlite"):
            return url
            
        updated_url = parsed_url.set(drivername=new_driver)
        
        # Se for porta 6543 (Pooler do Supabase), aplica as proteções necessárias
        if updated_url.port == 6543:
            query = dict(updated_url.query)
            # Desativa prepared statements (essencial para modo de transação)
            query.setdefault("prepare_threshold", "0")
            updated_url = updated_url.update_query_dict(query)
            
        return str(updated_url)
    except Exception as e:
        # Fallback de segurança
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        return url


def _build_database_url_from_parts() -> str | None:
    database_user = os.getenv("DB_USER")
    database_password = os.getenv("DB_PASSWORD")
    database_host = os.getenv("DB_HOST")
    database_port = os.getenv("DB_PORT")
    database_name = os.getenv("DB_NAME")

    if not all([database_user, database_password, database_host, database_port, database_name]):
        return None

    safe_password = urllib.parse.quote_plus(database_password)

    return (
        f"postgresql+psycopg://{database_user}:{safe_password}"
        f"@{database_host}:{database_port}/{database_name}"
    )


if not DATABASE_URL:
    DATABASE_URL = _build_database_url_from_parts()

if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./dev.db"

DATABASE_URL = _normalize_database_url(DATABASE_URL)

# Engine Configuration
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
