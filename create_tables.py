import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine

from database import engine, Base, AsyncSessionLocal

# Import models so metadata is aware of them
import models.auth_models  # noqa: F401
import models.diagnostico_models  # noqa: F401
from models.diagnostico_models import Service


async def init_db(async_engine: AsyncEngine) -> None:
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed services catalog if empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Service))
        if result.scalars().first() is None:
            default_services = [
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
            for name in default_services:
                session.add(Service(name=name))
            await session.commit()


if __name__ == "__main__":
    asyncio.run(init_db(engine))
