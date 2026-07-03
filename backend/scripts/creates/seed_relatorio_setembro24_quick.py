"""Seed rapido de dados essenciais do relatorio de setembro/2024.

Uso:
    python scripts/creates/seed_relatorio_setembro24_quick.py

Objetivo:
- Popular rapidamente UBS + metadados + cronogramas + territorio + necessidades.
- Nao mexe em profissionais/servicos/indicadores.
"""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.models.auth_models import Usuario
from app.models.diagnostico_models import TerritoryProfile, UBS, UBSNeeds


TARGET_UBS_NAME = "ESF 41 - Adalto Parentes Sampaio"
TARGET_PERIOD = "SETEMBRO/2024"


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


def _get_owner(session: Session) -> Usuario:
    preferred_email = os.getenv("SEED_OWNER_EMAIL", "").strip().lower()
    if preferred_email:
        owner = session.execute(select(Usuario).where(Usuario.email == preferred_email)).scalar_one_or_none()
        if owner:
            return owner

    owner = session.execute(select(Usuario).order_by(Usuario.id)).scalars().first()
    if owner:
        return owner

    raise RuntimeError("Nenhum usuario encontrado. Crie um usuario ou defina SEED_OWNER_EMAIL.")


def _upsert_ubs(session: Session, owner_id: int) -> UBS:
    ubs = session.execute(
        select(UBS).where(
            UBS.nome_ubs == TARGET_UBS_NAME,
            UBS.periodo_referencia == TARGET_PERIOD,
        )
    ).scalar_one_or_none()

    if not ubs:
        ubs = UBS(
            tenant_id=1,
            owner_user_id=owner_id,
            nome_ubs=TARGET_UBS_NAME,
            status="DRAFT",
        )
        session.add(ubs)

    # Reativa caso tenha sido removida por soft-delete.
    ubs.is_deleted = False

    ubs.nome_relatorio = "RELATORIO COMPLETO SETEMBRO-24 - ESF 41 ADALTO PARENTES SAMPAIO"
    ubs.cnes = ubs.cnes or "0000000"
    ubs.area_atuacao = "Baixa do Aragao (Alto Santa Maria e Dirceu Arcoverde), Parnaiba - PI"
    ubs.periodo_referencia = TARGET_PERIOD
    ubs.identificacao_equipe = "ESF 41"

    ubs.numero_habitantes_ativos = 4442
    ubs.numero_microareas = 8
    ubs.numero_familias_cadastradas = 900
    ubs.numero_domicilios = 1982
    ubs.domicilios_rurais = 15
    ubs.data_inauguracao = date(2017, 4, 1)
    ubs.data_ultima_reforma = date(2019, 1, 1)

    ubs.fluxo_agenda_acesso = (
        "Acolhimento e demanda espontanea diarios; entregas hiperdia, verificacao de PA/glicemia, "
        "preparo para consultas e marcacao de exames no horario de 07h as 13h."
    )

    ubs.descritivos_gerais = (
        "Territorio extenso e heterogeneo, com atuacao em pre-natal, saude da mulher, vacinacao, "
        "visitas domiciliares, PSE e atividades coletivas."
    )
    ubs.observacoes_gerais = (
        "Potencialidades: residentes multiprofissionais, rede de apoio local e instituicoes no territorio. "
        "Riscos: alagamentos, inseguranca em alguns pontos e vulnerabilidades ambientais."
    )

    ubs.cronograma_ubs_seg_manha = "Pre-natal, sorologias, testes rapidos e coleta do teste do pezinho."
    ubs.cronograma_ubs_ter_manha = "Saude da mulher (PCCU, planejamento familiar e testes rapidos)."
    ubs.cronograma_ubs_qua_manha = "Vacinacao e acompanhamento de condicoes cronicas."
    ubs.cronograma_ubs_qui_manha = "Visitas domiciliares e acoes coletivas/PSE."
    ubs.cronograma_ubs_sex_manha = "Saude da crianca e puericultura."

    ubs.cronograma_residentes_seg_manha = "[07:00-08:00] Acolhimento e triagem.\n[08:00-11:00] Pre-natal e grupo de gestantes."
    ubs.cronograma_residentes_ter_manha = "[07:00-11:00] Saude da mulher e atendimentos individuais."
    ubs.cronograma_residentes_qua_manha = "[07:00-11:00] Vacinacao e farmacia."
    ubs.cronograma_residentes_qui_manha = "[07:00-11:00] Acolhimento e visitas domiciliares."
    ubs.cronograma_residentes_sex_manha = "[07:00-11:00] Grupos (tabagismo, MoviMente-se) e PSE."

    ubs.cronograma_ubs_observacoes = "Atividades extras podem ser acrescidas mensalmente."
    ubs.cronograma_residentes_observacoes = "Cronograma sujeito a ajustes por agenda da UFDPar."

    session.flush()
    return ubs


def _upsert_territory_and_needs(session: Session, ubs_id: int) -> None:
    territory = session.execute(select(TerritoryProfile).where(TerritoryProfile.ubs_id == ubs_id)).scalar_one_or_none()
    if not territory:
        territory = TerritoryProfile(ubs_id=ubs_id, descricao_territorio="")
        session.add(territory)

    territory.descricao_territorio = (
        "Area de abrangencia com diversidade socioeconomica e desafios de acesso em periodo chuvoso."
    )
    territory.potencialidades_territorio = (
        "Rede comunitaria ativa, residentes multiprofissionais e instituicoes de ensino na regiao."
    )
    territory.riscos_vulnerabilidades = (
        "Aterro controlado no territorio, alagamentos, inseguranca e descarte irregular de residuos."
    )

    needs = session.execute(select(UBSNeeds).where(UBSNeeds.ubs_id == ubs_id)).scalar_one_or_none()
    if not needs:
        needs = UBSNeeds(ubs_id=ubs_id, problemas_identificados="")
        session.add(needs)

    needs.problemas_identificados = (
        "Limitacoes de estrutura e insumos, desabastecimento pontual, dificuldade para acesso rapido a exames/especialidades."
    )
    needs.necessidades_equipamentos_insumos = (
        "Autoclave, climatizacao, computadores, mobiliario e materiais de procedimentos/limpeza/escritorio."
    )
    needs.necessidades_especificas_acs = (
        "EPI, fardamento e melhores condicoes para visitas/cadastros territoriais."
    )
    needs.necessidades_infraestrutura_manutencao = (
        "Seguranca predial, reparos em janelas/eletrica/hidraulica e manutencao externa."
    )


def main() -> None:
    engine = create_engine(_get_sync_database_url(), future=True)
    with Session(engine) as session:
        owner = _get_owner(session)
        ubs = _upsert_ubs(session, owner.id)
        _upsert_territory_and_needs(session, ubs.id)
        session.commit()
        print(f"OK: seed rapido aplicado na UBS ID={ubs.id} ({TARGET_PERIOD}).")


if __name__ == "__main__":
    main()
