"""Seed de indicadores para complementar a UBS do relatorio de setembro/2024.

Uso:
    python scripts/creates/seed_relatorio_setembro24_indicadores.py

Objetivo:
- Inserir um conjunto de indicadores plausiveis para testes de formulario/PDF.
- Permite limpar os indicadores antigos da UBS alvo antes de inserir.
"""

from __future__ import annotations

import os
import sys
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.models.diagnostico_models import Indicator, UBS


TARGET_UBS_NAME = os.getenv("SEED_UBS_NAME", "ESF 41 - Adalto Parentes Sampaio")
TARGET_PERIOD = os.getenv("SEED_UBS_PERIOD", "SETEMBRO/2024")
CLEAN_PREVIOUS = os.getenv("SEED_CLEAN_PREVIOUS", "1") == "1"


def _get_sync_database_url() -> str:
    load_dotenv()
    url = os.getenv("DATABASE_URL")
    if not url:
        return "sqlite:///./dev.db"

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    url = url.replace("+asyncpg", "+psycopg")
    url = url.replace("sqlite+aiosqlite", "sqlite")
    return url


def _find_ubs(session: Session) -> UBS:
    ubs = session.execute(
        select(UBS).where(
            UBS.nome_ubs == TARGET_UBS_NAME,
            UBS.periodo_referencia == TARGET_PERIOD,
            UBS.is_deleted.is_(False),
        )
    ).scalar_one_or_none()
    if not ubs:
        raise RuntimeError(
            f"UBS nao encontrada para nome='{TARGET_UBS_NAME}' e periodo='{TARGET_PERIOD}'. "
            "Rode primeiro o seed principal/quick."
        )
    return ubs


def _rows() -> list[dict]:
    # Valores de apoio para ambiente de testes, ajustaveis conforme base oficial.
    return [
        {
            "nome": "Mais acesso a APS - Proporcao de atendimentos programados",
            "valor": Decimal("74.0"),
            "meta": Decimal("90.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
        {
            "nome": "Cuidado da pessoa com diabetes - Cobertura de monitoramento",
            "valor": Decimal("66.0"),
            "meta": Decimal("80.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
        {
            "nome": "Cuidado da pessoa com hipertensao - Cobertura de afericoes",
            "valor": Decimal("71.0"),
            "meta": Decimal("85.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
        {
            "nome": "Cuidado da gestante e puerperio - Consultas adequadas",
            "valor": Decimal("62.0"),
            "meta": Decimal("90.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
        {
            "nome": "Cuidado da mulher - Citopatologico e mamografia",
            "valor": Decimal("58.0"),
            "meta": Decimal("80.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
        {
            "nome": "Acoes interprofissionais eMulti - Proporcao de acoes coletivas",
            "valor": Decimal("41.0"),
            "meta": Decimal("60.0"),
            "tipo": "PERCENTUAL",
            "obs": "Fonte simulada para homologacao de formulario/PDF.",
        },
    ]


def main() -> None:
    engine = create_engine(_get_sync_database_url(), future=True)

    with Session(engine) as session:
        ubs = _find_ubs(session)

        if CLEAN_PREVIOUS:
            session.execute(delete(Indicator).where(Indicator.ubs_id == ubs.id))

        for row in _rows():
            session.add(
                Indicator(
                    ubs_id=ubs.id,
                    nome_indicador=row["nome"],
                    valor=row["valor"],
                    meta=row["meta"],
                    tipo_valor=row["tipo"],
                    periodo_referencia=TARGET_PERIOD,
                    observacoes=row["obs"],
                )
            )

        session.commit()
        print(
            f"OK: {len(_rows())} indicadores aplicados na UBS ID={ubs.id} "
            f"(clean_previous={CLEAN_PREVIOUS})."
        )


if __name__ == "__main__":
    main()
