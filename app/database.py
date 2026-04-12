from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine.url import make_url
import os
import sys
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

def _build_database_url_from_parts() -> str | None:
    """Monta a URL a partir de componentes individuais (Mais seguro contra caracteres especiais)"""
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    name = os.getenv("DB_NAME")

    if not all([user, password, host, port, name]):
        return None

    # Codifica a senha para evitar que caracteres como '@' quebrem a URL
    safe_password = urllib.parse.quote_plus(password)
    
    # Supabase Pooler (6543) exige prepare_threshold=0
    query = ""
    if str(port) == "6543":
        query = "?prepare_threshold=0"

    return f"postgresql+psycopg://{user}:{safe_password}@{host}:{port}/{name}{query}"

def _normalize_database_url(url: str) -> str:
    """Normaliza uma URL completa vinda de string"""
    if not url:
        return url
        
    try:
        # Se a URL tem múltiplos '@', codifica a senha manualmente
        if url.count("@") > 1 and "://" in url:
            scheme, rest = url.split("://", 1)
            auth, host_part = rest.rsplit("@", 1)
            if ":" in auth:
                user, pwd = auth.split(":", 1)
                safe_pwd = urllib.parse.quote_plus(urllib.parse.unquote(pwd))
                url = f"{scheme}://{user}:{safe_pwd}@{host_part}"

        parsed = make_url(url)
        new_driver = "postgresql+psycopg"
        
        if parsed.drivername.startswith("sqlite"):
            return url
            
        updated = parsed.set(drivername=new_driver)
        
        if updated.port == 6543:
            q = dict(updated.query)
            q.setdefault("prepare_threshold", "0")
            updated = updated.update_query_dict(q)
            
        return str(updated)
    except:
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        return url

# --- Lógica de Inicialização ---

# 1. Tenta montar pelas partes (recomendado para produção no Render)
DATABASE_URL = _build_database_url_from_parts()

# 2. Se não houver partes, tenta a URL completa
if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    if DATABASE_URL:
        DATABASE_URL = _normalize_database_url(DATABASE_URL)

# 3. Fallback para SQLite local
if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./dev.db"

# Log de segurança para conferência no Render
try:
    _p = make_url(DATABASE_URL)
    print(f"INFO: DB_CONNECT -> User: {_p.username} | Host: {_p.host}:{_p.port} | Driver: {_p.drivername}", flush=True)
except:
    pass

engine_kwargs = {
    "echo": False,
    "future": True,
}

if "sqlite" not in DATABASE_URL:
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
