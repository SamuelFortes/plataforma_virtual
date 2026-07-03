"""Seed completo do relatorio situacional de setembro/2024 (ESF 41 Adalto Parentes Sampaio).

Objetivo:
- Inserir no banco os dados do relatorio em formato de formulario (UBS + blocos relacionados).
- Atualizar o registro caso ja exista para evitar duplicidades.

Uso:
    python scripts/creates/seed_relatorio_setembro24.py

Scripts complementares:
    python scripts/creates/seed_relatorio_setembro24_quick.py
    python scripts/creates/seed_relatorio_setembro24_indicadores.py

Observacoes:
- Campos sem correspondencia 1:1 no schema foram consolidados em campos textuais
  (principalmente descritivos_gerais, observacoes_gerais e necessidades).
- Indicadores numericos detalhados do PDF original nao estavam legiveis o suficiente
  na extracao de texto automatica; por isso este script prioriza as secoes textuais
  e estruturais do formulario.
"""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session

# Garante import de `app.*` ao executar via `python scripts/creates/...`
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.models.auth_models import Usuario
from app.models.diagnostico_models import (
    Indicator,
    ProfessionalGroup,
    Service,
    TerritoryProfile,
    UBS,
    UBSNeeds,
    UBSService,
)


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
        owner = session.execute(
            select(Usuario).where(Usuario.email == preferred_email)
        ).scalar_one_or_none()
        if owner:
            return owner

    owner = session.execute(select(Usuario).order_by(Usuario.id)).scalars().first()
    if owner:
        return owner

    raise RuntimeError(
        "Nenhum usuario encontrado. Crie um usuario antes de rodar o seed "
        "(ou informe SEED_OWNER_EMAIL com um email existente)."
    )


def _upsert_ubs(session: Session, owner_id: int) -> UBS:
    existing = session.execute(
        select(UBS).where(
            UBS.nome_ubs == "ESF 41 - Adalto Parentes Sampaio",
            UBS.periodo_referencia == "SETEMBRO/2024",
        )
    ).scalar_one_or_none()

    if existing:
        ubs = existing
    else:
        ubs = UBS(
            tenant_id=1,
            owner_user_id=owner_id,
            nome_ubs="ESF 41 - Adalto Parentes Sampaio",
            status="DRAFT",
        )
        session.add(ubs)

    # Reativa caso tenha sido removida por soft-delete.
    ubs.is_deleted = False

    # Dados gerais do formulario (mapeados do PDF)
    ubs.nome_relatorio = "RELATORIO COMPLETO SETEMBRO-24 - ESF 41 ADALTO PARENTES SAMPAIO"
    ubs.cnes = ubs.cnes or "0000000"
    ubs.area_atuacao = "Baixa do Aragao (Alto Santa Maria e Dirceu Arcoverde), Parnaiba - PI"
    ubs.numero_habitantes_ativos = 4442
    ubs.numero_microareas = 8
    ubs.numero_familias_cadastradas = 900
    ubs.numero_domicilios = 1982
    ubs.domicilios_rurais = 15
    ubs.data_inauguracao = date(2017, 4, 1)
    ubs.data_ultima_reforma = date(2019, 1, 1)

    ubs.periodo_referencia = "SETEMBRO/2024"
    ubs.identificacao_equipe = "ESF 41"
    ubs.responsavel_nome = "Equipe ESF 41"
    ubs.responsavel_cargo = "Atencao Basica"
    ubs.responsavel_contato = ""

    ubs.fluxo_agenda_acesso = (
        "Diariamente: acolhimento e/ou atendimento de demanda espontanea quando necessario; "
        "entregas hiperdia, verificacao de PA, glicemia, dispensacao de medicamentos e preparo de pacientes para consulta; "
        "marcacao de exames no horario de 07h as 13h."
    )

    ubs.descritivos_gerais = (
        "A UBS Adalto Parentes Sampaio (modulo 41) atende populacao adscrita com cadastros ativos no e-SUS APS e, "
        "com frequencia, moradores de regioes circunvizinhas sem UBS de referencia. O territorio e extenso e heterogeneo, "
        "com diferencas socioeconomicas marcadas, areas urbanas e pontos rurais, alem de desafios de acesso em periodo chuvoso. "
        "Ha atuacao em pre-natal, saude da mulher, saude da crianca, hiperdia, vacinacao, visitas domiciliares, PSE, "
        "atividades coletivas e praticas interprofissionais com residentes."
    )

    ubs.observacoes_gerais = (
        "Potencialidades: presenca de escolas, IFPI, igrejas, grupos comunitarios, residentes multiprofissionais e projetos de extensao. "
        "Riscos/vulnerabilidades: aterro controlado no territorio, alagamentos, inseguranca em alguns trechos, descarte inadequado de residuos, "
        "doencas relacionadas a condicoes ambientais e dificuldades de acesso/infraestrutura."
    )

    ubs.outros_servicos = (
        "Grupo MoviMente-se, PSE, acoes educativas mensais, atividades alusivas ao calendario do MS, "
        "atendimentos multiprofissionais e apoio comunitario."
    )

    # Cronograma UBS (principalmente turnos da manha, conforme PDF)
    ubs.cronograma_ubs_seg_manha = (
        "Pre-natal; sorologias; testes rapidos; coleta do teste do pezinho; medico: pre-natal; "
        "grupo MoviMente-se (igreja)."
    )
    ubs.cronograma_ubs_ter_manha = (
        "Saude da mulher (coletas PCCU, planejamento familiar e testes rapidos); medico: atendimento saude da mulher."
    )
    ubs.cronograma_ubs_qua_manha = (
        "Vacinacao (covid-19 adultos/adolescentes e gestantes); medico: hiperdia/idosos/saude do homem; "
        "grupo MoviMente-se (educador fisico/fisioterapia)."
    )
    ubs.cronograma_ubs_qui_manha = (
        "Avaliacao de crianca e grupos com TO; Bolsa Familia e visitas domiciliares; medico: visitas domiciliares/receitas."
    )
    ubs.cronograma_ubs_sex_manha = (
        "Avaliacao de crianca (TO), avaliacao de puerpera/puericultura RN, vacinas de rotina (adultos e criancas), "
        "medico: saude da crianca; psicologia (quinzenal)."
    )
    ubs.cronograma_ubs_seg_tarde = ""
    ubs.cronograma_ubs_ter_tarde = ""
    ubs.cronograma_ubs_qua_tarde = ""
    ubs.cronograma_ubs_qui_tarde = ""
    ubs.cronograma_ubs_sex_tarde = ""

    ubs.cronograma_ubs_observacoes = (
        "Equipe realiza demanda espontanea diariamente conforme necessidade. "
        "Atividades extras/PSE/educativas podem ser acrescidas mensalmente."
    )

    # Cronograma residentes (com horarios)
    ubs.cronograma_residentes_seg_manha = (
        "[07:00-08:00] Acolhimento e triagem (residentes).\n"
        "[08:00-11:00] Pre-natal, sorologias, testes rapidos, gestantes e vacinacao de rotina (enfermagem).\n"
        "[08:00-11:00] Sala de espera/grupo com gestantes (quinzenal)."
    )
    ubs.cronograma_residentes_ter_manha = (
        "[07:00-11:00] Saude da mulher (PCCU, planejamento familiar, testes rapidos).\n"
        "[07:00-11:00] Atendimento individual psicologia.\n"
        "[07:00-11:00] Atendimento individual fisioterapia."
    )
    ubs.cronograma_residentes_qua_manha = (
        "[07:00-11:00] Vacinacao de adultos e adolescentes.\n"
        "[07:00-11:00] Atendimento individual psicologia.\n"
        "[07:00-11:00] Organizacao/controle e demandas gerais da farmacia."
    )
    ubs.cronograma_residentes_qui_manha = (
        "[07:00-09:00] Acolhimento dos pacientes (residentes).\n"
        "[09:00-11:00] Visitas domiciliares (agendar com ACS).\n"
        "[07:00-11:00] Atendimento individual fisioterapia.\n"
        "[07:00-11:00] Organizacao/controle e demandas gerais da farmacia."
    )
    ubs.cronograma_residentes_sex_manha = (
        "[07:00-11:00] Grupo tabagistas (quinzenal).\n"
        "[07:00-11:00] Grupo MoviMente-se (quinzenal).\n"
        "[07:00-11:00] PSE (mensal ou conforme demanda)."
    )
    ubs.cronograma_residentes_seg_tarde = ""
    ubs.cronograma_residentes_ter_tarde = ""
    ubs.cronograma_residentes_qua_tarde = ""
    ubs.cronograma_residentes_qui_tarde = ""
    ubs.cronograma_residentes_sex_tarde = ""

    ubs.cronograma_residentes_observacoes = (
        "Equipe de residentes multiprofissionais da UFDPar presente de segunda a sexta, com ressalvas de dias na universidade."
    )

    session.flush()

    return ubs


def _upsert_territory(session: Session, ubs_id: int) -> None:
    territory = session.execute(
        select(TerritoryProfile).where(TerritoryProfile.ubs_id == ubs_id)
    ).scalar_one_or_none()
    if not territory:
        territory = TerritoryProfile(ubs_id=ubs_id, descricao_territorio="")
        session.add(territory)

    territory.descricao_territorio = (
        "Territorio extenso e diverso, com diferencas socioeconomicas relevantes entre microareas. "
        "Inclui bairros Alto Santa Maria (Baixa do Aragao) e Dirceu Arcoverde, com areas urbanas e pontos vulneraveis. "
        "Ha referenciais como HEDA, CAPS II, IFPI e escola municipal, alem de comercio e construcao civil na regiao."
    )
    territory.potencialidades_territorio = (
        "Igrejas e grupos da pastoral, residentes multiprofissionais, TO, escolas, IFPI, empresas locais e acoes coletivas regulares. "
        "Maior insercao de medico em tempo integral e participacao de estagios/projetos de ensino-extensao."
    )
    territory.riscos_vulnerabilidades = (
        "Aterro controlado no territorio, alagamentos no periodo chuvoso, inseguranca em alguns pontos, "
        "acumulo de residuos/entulhos, doencas relacionadas ao ambiente, dificuldades de acesso e barreiras de mobilidade."
    )


def _upsert_needs(session: Session, ubs_id: int) -> None:
    needs = session.execute(select(UBSNeeds).where(UBSNeeds.ubs_id == ubs_id)).scalar_one_or_none()
    if not needs:
        needs = UBSNeeds(ubs_id=ubs_id, problemas_identificados="")
        session.add(needs)

    needs.problemas_identificados = (
        "Dificuldade para cumprir metas da APS por limitacoes de estrutura, falta de servicos/equipamentos e inconsistencias de registros. "
        "Ausencia de dentista, restricoes de exames/especialidades, desabastecimento recorrente, sobrecarga da equipe, "
        "instabilidade de sistemas e desafios de vinculo da populacao em funcao de falhas de oferta assistencial."
    )

    needs.necessidades_equipamentos_insumos = (
        "Odontologo e estrutura odontologica; autoclave; ventiladores/ar-condicionado; mobiliario para salas e auditorio; "
        "equipamentos de curativo/procedimentos; computadores funcionantes; materiais de escritorio e limpeza; "
        "extintores; manutencao eletrica e de climatizacao; itens para PCCU e triagem."
    )

    needs.necessidades_especificas_acs = (
        "EPIs (chapeu, protetor solar, mascara, alcool), fardamento completo, balanca com rede/macacao para peso infantil domiciliar, "
        "livros-ata, materiais de escritorio e melhores condicoes para visitas e cadastros no territorio."
    )

    needs.necessidades_infraestrutura_manutencao = (
        "Melhorias de seguranca (muro/cerca/grades), reparos em janelas e privacidade, capina e limpeza externa, "
        "correcoes de infiltracao/vazamentos, acessibilidade e manutencao predial preventiva."
    )


def _replace_professionals(session: Session, ubs_id: int) -> None:
    session.execute(delete(ProfessionalGroup).where(ProfessionalGroup.ubs_id == ubs_id))

    groups = [
        ("Agente Comunitario de Saude (ACS)", 8, "nao_informado", "Equipe territorial"),
        ("Atendente social", 1, "nao_informado", "Apoio administrativo/acolhimento"),
        ("Tecnico de enfermagem", 2, "nao_informado", "Equipe assistencial"),
        ("Auxiliar de servicos gerais", 1, "nao_informado", "Apoio operacional"),
        ("Atendente de regulacao", 1, "nao_informado", "Posicao citada com vacancia/rotatividade"),
        ("Enfermeiro assistencialista e gerente", 1, "nao_informado", "Responsavel tecnico local"),
        ("Medico da familia", 1, "nao_informado", "Atuacao em horario integral"),
        ("Terapeuta ocupacional", 1, "nao_informado", "Suporte em grupos/avaliacoes"),
        ("Residente - Enfermagem (UFDPar)", 1, "residencia", "Equipe multiprofissional"),
        ("Residente - Fisioterapia (UFDPar)", 1, "residencia", "Equipe multiprofissional"),
        ("Residente - Psicologia (UFDPar)", 1, "residencia", "Equipe multiprofissional"),
        ("Residente - Farmacia (UFDPar)", 1, "residencia", "Equipe multiprofissional"),
    ]

    for cargo, qtd, vinculo, obs in groups:
        session.add(
            ProfessionalGroup(
                ubs_id=ubs_id,
                cargo_funcao=cargo,
                quantidade=qtd,
                tipo_vinculo=vinculo,
                observacoes=obs,
            )
        )


def _replace_services(session: Session, ubs_id: int) -> None:
    session.execute(delete(UBSService).where(UBSService.ubs_id == ubs_id))

    service_names = [
        "Programa Saude da Familia",
        "Atendimento medico",
        "Atendimento de enfermagem",
        "Atendimento odontologico",
        "Atendimento de urgencia / acolhimento",
        "Procedimentos (curativos, inalacao, etc.)",
        "Sala de vacina",
        "Saude da crianca",
        "Saude da mulher",
        "Saude do homem",
        "Saude do idoso",
        "Planejamento familiar",
        "Pre-natal",
        "Puericultura",
        "Atendimento a condicoes cronicas (hipertensao, diabetes, etc.)",
        "Programa Saude na Escola (PSE)",
        "Saude mental",
        "Atendimento multiprofissional (NASF ou equivalente)",
        "Testes rapidos de IST",
        "Vigilancia epidemiologica",
        "Visitas domiciliares",
        "Atividades coletivas e preventivas",
        "Grupos operativos (gestantes, tabagismo, etc.)",
    ]

    for name in service_names:
        service = session.execute(select(Service).where(Service.name == name)).scalar_one_or_none()
        if not service:
            service = Service(name=name)
            session.add(service)
            session.flush()

        session.add(UBSService(ubs_id=ubs_id, service_id=service.id))


def _replace_indicators(session: Session, ubs_id: int) -> None:
    session.execute(delete(Indicator).where(Indicator.ubs_id == ubs_id))

    # Indicadores numericos do PDF nao estavam legiveis na extracao automatica.
    # Mantemos uma anotacao minima para sinalizar a origem e o periodo.
    session.add(
        Indicator(
            ubs_id=ubs_id,
            nome_indicador="Observacao geral sobre indicadores (fonte e-SUS feedback)",
            valor=0,
            meta=0,
            tipo_valor="ABSOLUTO",
            periodo_referencia="SETEMBRO/2024",
            observacoes=(
                "Relatorio original cita melhora dos indicadores desde dez/2022 e alerta sobre possiveis subestimacoes e inconsistencias do sistema. "
                "Inserir valores numericos oficiais manualmente conforme planilha/fonte institucional."
            ),
        )
    )


def main() -> None:
    db_url = _get_sync_database_url()
    engine = create_engine(db_url, future=True)

    with Session(engine) as session:
        owner = _get_owner(session)
        ubs = _upsert_ubs(session, owner.id)

        _upsert_territory(session, ubs.id)
        _upsert_needs(session, ubs.id)
        _replace_professionals(session, ubs.id)
        _replace_services(session, ubs.id)
        _replace_indicators(session, ubs.id)

        session.commit()

        print(f"OK: relatorio de setembro/2024 semeado na UBS ID={ubs.id}.")
        print("Arquivo alvo: ESF 41 - Adalto Parentes Sampaio")
        print("Periodo: SETEMBRO/2024")


if __name__ == "__main__":
    main()
