from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any, Optional

import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

PRIMARY = colors.HexColor("#0F172A")
ACCENT = colors.HexColor("#0F766E")
ACCENT2 = colors.HexColor("#0E7490")
MUTED = colors.HexColor("#334155")
LIGHT = colors.HexColor("#F8FAFC")
TABLE_HEADER = colors.HexColor("#E2E8F0")
TABLE_GRID = colors.HexColor("#94A3B8")
SECTION_BG = colors.HexColor("#ECFEFF")
PRIORITY_BG = colors.HexColor("#FEF3C7")
SUCCESS_BG = colors.HexColor("#DCFCE7")
WARNING_BG = colors.HexColor("#FEF9C3")


def _escape_xml(text: str) -> str:
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#039;")
    )


def _fmt(value: Any) -> str:
    if value is None:
        return "-"
    try:
        return f"{float(value):.2f}".rstrip("0").rstrip(".")
    except Exception:
        return str(value)


def _fmt_percent(value: Any) -> str:
    formatted = _fmt(value)
    return "-" if formatted == "-" else f"{formatted}%"


def _indicator_type_label(tipo_valor: Optional[str]) -> str:
    if tipo_valor == "ABSOLUTO":
        return "Absoluto"
    if tipo_valor == "POR_1000":
        return "Por 1000 hab."
    return "Porcentagem"


def _format_indicator_value(value: Any, tipo_valor: Optional[str]) -> str:
    if value is None:
        return "-"
    if tipo_valor == "ABSOLUTO":
        return _fmt(value)
    if tipo_valor == "POR_1000":
        return f"{_fmt(value)} / 1000 hab."
    return _fmt_percent(value)


def _safe_filename(value: str, default: str = "relatorio_situacional") -> str:
    if not value:
        return default
    allowed = []
    for ch in value:
        if ch.isalnum() or ch in ("-", "_", ".", " "):
            allowed.append(ch)
        else:
            allowed.append("_")
    name = "".join(allowed).strip().replace("  ", " ").replace(" ", "_")
    return name or default


def _chunk(items: list[str], size: int) -> list[list[str]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def _weekly_schedule_from_ubs(ubs, prefix: str) -> dict[str, dict[str, str]]:
    dias = ["seg", "ter", "qua", "qui", "sex"]
    resultado: dict[str, dict[str, str]] = {}
    for dia in dias:
        resultado[dia] = {
            "manha": getattr(ubs, f"{prefix}_{dia}_manha", None) or "-",
            "tarde": getattr(ubs, f"{prefix}_{dia}_tarde", None) or "-",
        }
    return resultado


def _weekly_observacoes_from_ubs(ubs, prefix: str) -> str:
    return (getattr(ubs, f"{prefix}_observacoes", None) or "").strip()


def _bulleted_html(text: str) -> str:
    items = [line.strip() for line in str(text or "").split("\n") if line.strip()]
    if not items:
        return "-"
    return "<br/>".join([f"&bull; {_escape_xml(_wrap_hard_tokens(item))}" for item in items])


def _wrap_hard_tokens(text: str, chunk: int = 24) -> str:
    parts = re.split(r"(\s+)", str(text or ""))
    wrapped = []
    for part in parts:
        if not part or part.isspace() or len(part) <= chunk:
            wrapped.append(part)
            continue
        wrapped.append("-".join([part[i:i + chunk] for i in range(0, len(part), chunk)]))
    return "".join(wrapped)


def _has_weekly_content(schedule: dict[str, dict[str, str]]) -> bool:
    for dia in schedule.values():
        if (dia.get("manha") or "-") != "-":
            return True
        if (dia.get("tarde") or "-") != "-":
            return True
    return False


def _calendar_day_blocks(manha: str, tarde: str, style_table: ParagraphStyle) -> Table:
    data = [
        [Paragraph(f"<b>Manhã</b><br/>{_bulleted_html(manha)}", style_table)],
        [Paragraph(f"<b>Tarde</b><br/>{_bulleted_html(tarde)}", style_table)],
    ]
    table = Table(data, colWidths=[3.0 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#E0F2FE")),
                ("BACKGROUND", (0, 1), (0, 1), colors.HexColor("#DCFCE7")),
                ("BOX", (0, 0), (-1, -1), 0.35, TABLE_GRID),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, TABLE_GRID),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _calendar_like_weekly_table(schedule: dict[str, dict[str, str]], style_table: ParagraphStyle, style_table_header: ParagraphStyle) -> Table:
    headers = ["SEG", "TER", "QUA", "QUI", "SEX"]
    days = ["seg", "ter", "qua", "qui", "sex"]
    header_row = [Paragraph(_escape_xml(h), style_table_header) for h in headers]
    body_row = [
        _calendar_day_blocks(schedule[d]["manha"], schedule[d]["tarde"], style_table)
        for d in days
    ]
    table = Table([header_row, body_row], colWidths=[3.15 * cm, 3.15 * cm, 3.15 * cm, 3.15 * cm, 3.15 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, 0), PRIMARY),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.3, TABLE_GRID),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _zebra_style(row_count: int) -> TableStyle:
    style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, 0), PRIMARY),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.25, TABLE_GRID),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )
    for row in range(1, row_count):
        if row % 2 == 0:
            style.add("BACKGROUND", (0, row), (-1, row), LIGHT)
    return style


def _boxed(text: str, style: ParagraphStyle) -> Table:
    table = Table([[Paragraph(_escape_xml(text or "-"), style)]], colWidths=[16.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.25, TABLE_GRID),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _section_header(text: str, style: ParagraphStyle) -> Table:
    table = Table([[Paragraph(text, style)]], colWidths=[16.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SECTION_BG),
                ("BOX", (0, 0), (-1, -1), 1, ACCENT2),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def _fmt_date(value: Any) -> str:
    if not value:
        return "-"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    if hasattr(value, "strftime"):
        return value.strftime("%d/%m/%Y")
    return str(value)


def generate_situational_report_pdf_simple(
    diagnosis,
    municipality: str = "",
    reference_period: str = "",
    extra_data: Optional[dict] = None,
) -> tuple[bytes, str]:
    ubs = diagnosis.ubs
    services = [s.name for s in (diagnosis.services.services or [])]
    extra = extra_data or {}

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        name="Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=PRIMARY,
        leading=22,
        spaceAfter=6,
    )
    style_kicker = ParagraphStyle(
        name="Kicker",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=MUTED,
        leading=12,
    )
    style_h2 = ParagraphStyle(
        name="SectionTitle",
        parent=styles["Heading2"],
        textColor=PRIMARY,
        fontSize=12,
        leading=14,
        spaceBefore=12,
        spaceAfter=6,
    )
    style_h3 = ParagraphStyle(
        name="SubSectionTitle",
        parent=styles["Heading3"],
        textColor=ACCENT,
        fontSize=11,
        spaceBefore=8,
        spaceAfter=4,
    )
    style_body = ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        wordWrap="CJK",
    )
    style_table = ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontSize=8.7,
        leading=11,
        wordWrap="CJK",
    )
    style_table_header = ParagraphStyle(
        name="TableHeader",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=PRIMARY,
    )
    style_small = ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontSize=8,
        leading=10,
        textColor=MUTED,
    )
    style_cover_org = ParagraphStyle(
        name="CoverOrg",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        alignment=1,
        textColor=PRIMARY,
    )
    style_cover_title = ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        alignment=1,
        textColor=PRIMARY,
    )
    style_cover_meta = ParagraphStyle(
        name="CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=MUTED,
    )

    story = []
    section_num = [0]

    def next_section(title: str):
        section_num[0] += 1
        return f"{section_num[0]}. {title}"

    # ==================== CAPA ====================
    equipe_label = (ubs.identificacao_equipe or "UBS").strip()
    unidade_label = (ubs.nome_ubs or "UNIDADE BÁSICA DE SAÚDE").strip()
    periodo_atualizacao = (reference_period or getattr(ubs, "periodo_referencia", None) or datetime.now().strftime("%m/%Y")).upper()
    cover_title = f"RELATÓRIO SITUACIONAL DA {equipe_label} - {unidade_label}"
    municipio_label = (municipality or "Município").strip()

    org_data = [
        [Paragraph("ESTADO", style_cover_org)],
        [Paragraph(f"PREFEITURA MUNICIPAL DE {_escape_xml(municipio_label.upper())}", style_cover_org)],
        [Paragraph("SECRETARIA DE SAÚDE - ATENÇÃO BÁSICA", style_cover_org)],
    ]
    org_table = Table(org_data, colWidths=[16.5 * cm])
    org_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E2E8F0")),
                ("BOX", (0, 0), (-1, -1), 0.6, ACCENT2),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(org_table)
    story.append(Spacer(1, 8))

    header_table = Table([[Paragraph(_escape_xml(cover_title), style_cover_title)]], colWidths=[16.5 * cm])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFEFF")),
                ("BOX", (0, 0), (-1, -1), 0.6, ACCENT2),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Atualizado em: {_escape_xml(periodo_atualizacao)}", style_cover_meta))
    story.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", style_cover_meta))
    story.append(Spacer(1, 12))

    def _cell(value: Any, style: ParagraphStyle = style_table) -> Paragraph:
        return Paragraph(_escape_xml(str(value if value is not None else "-")), style)

    summary_data = [
        [_cell("UBS", style_table_header), _cell(ubs.nome_ubs or "-"), _cell("CNES", style_table_header), _cell(ubs.cnes or "-")],
        [_cell("Equipe", style_table_header), _cell(ubs.identificacao_equipe or "-"), _cell("Área", style_table_header), _cell(ubs.area_atuacao or "-")],
    ]
    summary_table = Table(summary_data, colWidths=[1.3 * cm, 5.7 * cm, 1.3 * cm, 8.2 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("TEXTCOLOR", (0, 0), (-1, -1), PRIMARY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(summary_table)

    # ==================== 1. IDENTIFICAÇÃO ====================
    story.append(_section_header(next_section("Identificação e Caracterização da UBS"), style_h2))
    story.append(Spacer(1, 4))
    table_data = [
        [_cell("Campo", style_table_header), _cell("Valor", style_table_header)],
        [_cell("Nome do relatório"), _cell(ubs.nome_relatorio or "-")],
        [_cell("Período de referência"), _cell(ubs.periodo_referencia or "-")],
        [_cell("Responsável"), _cell(getattr(ubs, "responsavel_nome", "-") or "-")],
        [_cell("Cargo do responsável"), _cell(getattr(ubs, "responsavel_cargo", "-") or "-")],
        [_cell("Contato"), _cell(getattr(ubs, "responsavel_contato", "-") or "-")],
        [_cell("Habitantes ativos"), _cell(_fmt(ubs.numero_habitantes_ativos))],
        [_cell("Microáreas"), _cell(_fmt(ubs.numero_microareas))],
        [_cell("Famílias cadastradas"), _cell(_fmt(ubs.numero_familias_cadastradas))],
        [_cell("Domicílios"), _cell(_fmt(ubs.numero_domicilios))],
        [_cell("Domicílios rurais"), _cell(_fmt(ubs.domicilios_rurais))],
        [_cell("Data de inauguração"), _cell(_fmt_date(ubs.data_inauguracao))],
        [_cell("Data da última reforma"), _cell(_fmt_date(ubs.data_ultima_reforma))],
        [_cell("Modelo de atenção"), _cell(getattr(ubs, "gestao_modelo_atencao", "-") or "-")],
    ]
    info_table = Table(table_data, colWidths=[5.1 * cm, 11.4 * cm])
    info_table.setStyle(_zebra_style(len(table_data)))
    story.append(info_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Descritivos gerais", style_h3))
    story.append(_boxed(ubs.descritivos_gerais or "-", style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Fluxo, agenda e acesso", style_h3))
    story.append(_boxed(getattr(ubs, "fluxo_agenda_acesso", "-") or "-", style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Observações gerais", style_h3))
    story.append(_boxed(ubs.observacoes_gerais or "-", style_body))

    # ==================== 2. CRONOGRAMAS ====================
    story.append(_section_header(next_section("Cronogramas da UBS e dos Residentes"), style_h2))
    story.append(Spacer(1, 4))

    cronograma_ubs = _weekly_schedule_from_ubs(ubs, "cronograma_ubs")
    cronograma_residentes = _weekly_schedule_from_ubs(ubs, "cronograma_residentes")
    obs_ubs = _weekly_observacoes_from_ubs(ubs, "cronograma_ubs")
    obs_residentes = _weekly_observacoes_from_ubs(ubs, "cronograma_residentes")

    if _has_weekly_content(cronograma_ubs):
        story.append(Paragraph("Cronograma da UBS", style_h3))
        story.append(_calendar_like_weekly_table(cronograma_ubs, style_table, style_table_header))
        if obs_ubs:
            story.append(Spacer(1, 3))
            story.append(Paragraph("Observações do cronograma da UBS", style_small))
            story.append(_boxed(obs_ubs, style_body))
        story.append(Spacer(1, 8))

    if _has_weekly_content(cronograma_residentes):
        story.append(Paragraph("Cronograma dos Residentes da UFDPar", style_h3))
        story.append(_calendar_like_weekly_table(cronograma_residentes, style_table, style_table_header))
        if obs_residentes:
            story.append(Spacer(1, 3))
            story.append(Paragraph("Observações do cronograma dos residentes", style_small))
            story.append(_boxed(obs_residentes, style_body))
        story.append(Spacer(1, 8))

    if not _has_weekly_content(cronograma_ubs) and not _has_weekly_content(cronograma_residentes):
        story.append(Paragraph("Nenhum cronograma registrado.", style_body))

    # ==================== 3. SERVIÇOS ====================
    story.append(_section_header(next_section("Serviços Ofertados pela UBS"), style_h2))
    story.append(Spacer(1, 4))
    if services:
        rows = _chunk(services, 2)
        services_data = [[_cell(row[0]), _cell(row[1]) if len(row) > 1 else _cell("")] for row in rows]
        services_table = Table(services_data, colWidths=[7.95 * cm, 7.95 * cm])
        services_table.setStyle(
            TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (-1, -1), PRIMARY),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(services_table)
    else:
        story.append(Paragraph("Nenhum serviço registrado.", style_body))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Outros serviços: {_escape_xml(ubs.outros_servicos or '-')}", style_body))

    # ==================== 4. PERFIL DO TERRITÓRIO ====================
    story.append(_section_header(next_section("Perfil da UBS e do Território"), style_h2))
    story.append(Spacer(1, 4))
    territory = diagnosis.territory_profile
    story.append(Paragraph("Perfil da UBS", style_h3))
    story.append(_boxed(getattr(territory, "descricao_territorio", "-"), style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Nossas potencialidades", style_h3))
    story.append(_boxed(getattr(territory, "potencialidades_territorio", "-"), style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Nossos riscos e vulnerabilidades", style_h3))
    story.append(_boxed(getattr(territory, "riscos_vulnerabilidades", "-"), style_body))

    # ==================== 5. NECESSIDADES ====================
    story.append(_section_header(next_section("Problemas e Solicitações / Necessidades"), style_h2))
    story.append(Spacer(1, 4))
    needs = diagnosis.needs
    story.append(Paragraph("Problemas", style_h3))
    story.append(_boxed(getattr(needs, "problemas_identificados", "-"), style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Solicitações / Necessidades para a UBS", style_h3))
    story.append(_boxed(getattr(needs, "necessidades_equipamentos_insumos", "-"), style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Solicitações / Necessidades para os ACS", style_h3))
    story.append(_boxed(getattr(needs, "necessidades_especificas_acs", "-"), style_body))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Infraestrutura e manutenção", style_h3))
    story.append(_boxed(getattr(needs, "necessidades_infraestrutura_manutencao", "-"), style_body))

    # ==================== 6. INDICADORES ====================
    story.append(_section_header(next_section("Indicadores Epidemiológicos"), style_h2))
    story.append(Spacer(1, 4))
    indicators = diagnosis.indicators_latest or []
    if indicators:
        ind_data = [[
            Paragraph("Indicador", style_table_header),
            Paragraph("Tipo", style_table_header),
            Paragraph("Valor", style_table_header),
            Paragraph("Meta", style_table_header),
            Paragraph("Período", style_table_header),
        ]]
        for i in indicators:
            ind_data.append([
                Paragraph(_escape_xml(str(i.nome_indicador)), style_table),
                Paragraph(_escape_xml(_indicator_type_label(getattr(i, "tipo_valor", None))), style_table),
                Paragraph(_escape_xml(_format_indicator_value(i.valor, getattr(i, "tipo_valor", None))), style_table),
                Paragraph(_escape_xml(_format_indicator_value(i.meta, getattr(i, "tipo_valor", None))), style_table),
                Paragraph(_escape_xml(str(i.periodo_referencia)), style_table),
            ])
        ind_table = Table(ind_data, colWidths=[6.8 * cm, 2.2 * cm, 1.9 * cm, 1.9 * cm, 3.7 * cm])
        ind_table.setStyle(_zebra_style(len(ind_data)))
        ind_table.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(ind_table)
    else:
        story.append(Paragraph("Nenhum indicador registrado.", style_body))

    # ==================== 7. RECURSOS HUMANOS ====================
    story.append(_section_header(next_section("Nossos Profissionais"), style_h2))
    story.append(Spacer(1, 4))
    groups = diagnosis.professional_groups or []
    if groups:
        g_data = [[
            _cell("Cargo/Função", style_table_header),
            _cell("Qtd.", style_table_header),
            _cell("Vínculo", style_table_header),
            _cell("Observações", style_table_header),
        ]]
        for g in groups:
            g_data.append([
                _cell(g.cargo_funcao),
                _cell(g.quantidade),
                _cell(g.tipo_vinculo or "-"),
                _cell(g.observacoes or "-"),
            ])
        g_table = Table(g_data, colWidths=[4.9 * cm, 1.4 * cm, 3.4 * cm, 6.8 * cm])
        g_table.setStyle(_zebra_style(len(g_data)))
        g_table.setStyle(TableStyle([
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(g_table)
    else:
        story.append(Paragraph("Nenhum profissional registrado.", style_body))

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2.0 * cm,
        rightMargin=2.0 * cm,
        topMargin=2.0 * cm,
        bottomMargin=2.0 * cm,
        title="Relatório Situacional UBS",
        author="Plataforma Digital",
    )
    doc.build(story)
    pdf_bytes = buffer.getvalue()

    filename_base = (ubs.nome_relatorio or ubs.nome_ubs or "relatorio_situacional").strip()
    return pdf_bytes, _safe_filename(filename_base)
