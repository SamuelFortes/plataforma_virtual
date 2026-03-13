from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from app.database import get_db, engine, Base
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import sys
import os
import asyncio
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

KEEP_ALIVE_INTERVAL = int(os.getenv("KEEP_ALIVE_INTERVAL", "840"))  # 14 min


async def _keep_alive_loop():
    """Faz self-ping a cada 14 minutos para evitar que o Render free tier adormeça o serviço."""
    import httpx

    app_url = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
    if not app_url:
        logger.info("RENDER_EXTERNAL_URL não definida, keep-alive desativado")
        return

    ping_url = f"{app_url}/ping"
    logger.info("Keep-alive ativo: ping em %s a cada %ds", ping_url, KEEP_ALIVE_INTERVAL)

    async with httpx.AsyncClient(timeout=10) as client:
        while True:
            await asyncio.sleep(KEEP_ALIVE_INTERVAL)
            try:
                resp = await client.get(ping_url)
                logger.debug("Keep-alive ping: %s", resp.status_code)
            except Exception as exc:
                logger.warning("Keep-alive falhou: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    #Startup
    logger.info("Inicializando aplicação")
    logger.info("DATABASE_URL driver: %s", os.getenv("DATABASE_URL", "NOT SET")[:30] + "...")
    logger.info("Python %s | Platform %s", sys.version, sys.platform)
    keep_alive_task = asyncio.create_task(_keep_alive_loop())
    logger.info("Startup completo — pronto para receber requisições")
    yield

    #Shutdown
    keep_alive_task.cancel()
    try:
        logger.info("Encerrando engine do banco de dados...")
        await engine.dispose()
        logger.info("Engine do banco de dados encerrada")
    except Exception as e:
        logger.error(f"Erro ao encerrar engine do banco de dados: {e}")

app = FastAPI(lifespan=lifespan) #Inicializa a aplicação do FastAPI
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Permite o front-end chamar a API do backend
# IMPORTANTE: o CORS precisa ser configurado ANTES das rotas.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://plataforma-virtual.onrender.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)

import traceback

_routers_to_load = [
    ("app.api.routes.auth_routes", ["auth_router", "cargos_router"]),
    ("app.api.routes.diagnostico_routes", ["diagnostico_router"]),
    ("app.api.routes.agendamento_routes", ["agendamento_router"]),
    ("app.api.routes.materiais_routes", ["materiais_router"]),
    ("app.api.routes.cronograma_routes", ["cronograma_router"]),
    ("app.api.routes.suporte_feedback_routes", ["suporte_feedback_router"]),
    ("app.api.routes.gestao_equipes_routes", ["gestao_equipes_router"]),
]

for module_path, router_names in _routers_to_load:
    try:
        module = __import__(module_path, fromlist=router_names)
        for name in router_names:
            router = getattr(module, name)
            app.include_router(router, prefix="/api")
            logger.info("Router '%s.%s' carregado com sucesso", module_path, name)
    except Exception as exc:
        logger.critical(
            "FALHA ao carregar router de '%s': %s\n%s",
            module_path, exc, traceback.format_exc(),
        )
        raise

# Monta o diretório de assets estáticos do frontend
assets_path = "frontend-react/dist/assets"
if os.path.exists(assets_path) and os.path.isdir(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
else:
    logger.warning(f"Diretório de assets não encontrado: {assets_path}. Modo desenvolvimento API ou build do frontend pendente.")

# Endpoint leve para keep-alive (sem banco, sem rate limit)
@app.get("/ping", response_class=PlainTextResponse)
async def ping():
    return "pong"

# Rota para verificar SAÚDE da API (verificar se o banco está conectado e a API rodando)
@app.get("/health") #Rate limite de 10 requisições por minuto
@limiter.limit("10/minute")
async def health_check(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1")) #Ping no banco
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

# Rota catch-all para servir o index.html do React para qualquer outra rota
@app.get("/{catchall:path}")
async def serve_react_app(catchall: str):
    index_path = "frontend-react/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "API rodando em modo desenvolvimento",
        "detail": "Frontend build não encontrado. Para acessar o frontend, inicie o servidor de desenvolvimento (npm run dev) ou faça o build (npm run build).",
        "docs": "/docs"
    }
