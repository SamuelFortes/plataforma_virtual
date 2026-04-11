import asyncio
import sys

# FIX obrigatório para Windows + psycopg3 async
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine

try:
    from app.database import engine, Base, AsyncSessionLocal
except ImportError as e:
    print(f"ERROR: Falha ao importar app.database: {e}")
    sys.exit(1)

# Importa os modelos para registrar no metadata
import app.models.auth_models  # noqa: F401
import app.models.diagnostico_models  # noqa: F401
import app.models.agendamento_models  # noqa: F401
import app.models.gestao_equipes_models  # noqa: F401
import app.models.cronograma_models  # noqa: F401
import app.models.materiais_models  # noqa: F401
import app.models.suporte_feedback_models  # noqa: F401
from app.models.diagnostico_models import Service


async def init_db(async_engine: AsyncEngine) -> None:
    print("INFO: Iniciando criação de tabelas e população inicial...")
    try:
        # Cria todas as tabelas
        async with async_engine.begin() as conexao:
            print("INFO: Tentando executar Base.metadata.create_all...")
            await conexao.run_sync(Base.metadata.create_all)
            print("✔ Tabelas verificadas/criadas com sucesso.")

        # Popula o catálogo de serviços se estiver vazio
        async with AsyncSessionLocal() as sessao:
            print("INFO: Verificando se serviços padrão já existem...")
            resultado = await sessao.execute(select(Service))
            if resultado.scalars().first() is None:
                servicos_padrao = [
                    "Programa Saúde da Família",
                    "Atendimento médico",
                    "Atendimento de enfermagem",
                    "Atendimento odontológico",
                    "Atendimento de urgência / acolhimento",
                    "Procedimentos (curativos, inalação, etc.)",
                    "Sala de vacina",
                    "Saúde da criança",
                    "Saúde da mulher",
                    "Saúde do homem",
                    "Saúde do idoso",
                    "Planejamento familiar",
                    "Pré-natal",
                    "Puericultura",
                    "Atendimento a condições crônicas (hipertensão, diabetes, etc.)",
                    "Programa Saúde na Escola (PSE)",
                    "Saúde mental",
                    "Atendimento multiprofissional (NASF ou equivalente)",
                    "Testes rápidos de IST",
                    "Vigilância epidemiológica",
                    "Vigilância em saúde ambiental",
                    "Visitas domiciliares",
                    "Atividades coletivas e preventivas",
                    "Grupos operativos (gestantes, tabagismo, etc.)",
                ]

                for nome in servicos_padrao:
                    sessao.add(Service(name=nome))

                await sessao.commit()
                print("✔ Serviços padrão inseridos com sucesso.")
            else:
                print("ℹ Serviços já existentes. Nada a inserir.")
    except Exception as e:
        print(f"FATAL: Erro durante a inicialização do banco: {type(e).__name__}: {e}")
        # Se for erro de conexão, vamos imprimir mais detalhes se possível
        if "OperationalError" in str(type(e)):
            print("HINT: Verifique se sua DATABASE_URL está correta e se o banco está acessível.")
        raise e


if __name__ == "__main__":
    try:
        asyncio.run(init_db(engine))
    except KeyboardInterrupt:
        pass
    except Exception:
        sys.exit(1)
