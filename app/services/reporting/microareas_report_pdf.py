from io import BytesIO
from datetime import datetime
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _safe_filename(value: str, default: str = "relatorio_microareas") -> str:
    base = value.strip() if value else default
    base = re.sub(r"[^a-zA-Z0-9_-]+", "_", base).strip("_")
    return base or default


def _format_localidades(localidades):
    locais_formatados = []
    for item in localidades or []:
        if isinstance(item, dict):
            nome = (item.get("nome") or "").strip()
            if nome:
                locais_formatados.append(nome)
        elif item:
            locais_formatados.append(str(item))
    return ", ".join(locais_formatados) if locais_formatados else "-"


def _build_priority_score(microarea):
    populacao = microarea.populacao or 0
    familias = microarea.familias or 0
    return populacao + (familias * 5)


def generate_microareas_report_pdf(ubs, microareas, agentes_por_microarea, emitted_by=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    style_title = styles["Title"]
    style_subtitle = styles["Normal"]
    style_subtitle.fontSize = 10
    style_subtitle.leading = 12

    elements = []
    elements.append(Paragraph("Plano de Cobertura - Microareas", style_title))
    elements.append(Spacer(1, 0.2 * cm))

    nome_ubs = getattr(ubs, "nome_ubs", "-")
    data_emissao = datetime.now().strftime("%d/%m/%Y %H:%M")
    elements.append(Paragraph(f"UBS: {nome_ubs}", style_subtitle))
    elements.append(Paragraph(f"Emissao: {data_emissao}", style_subtitle))
    if emitted_by:
        elements.append(Paragraph(f"Emitido por: {emitted_by}", style_subtitle))
    elements.append(Spacer(1, 0.4 * cm))

    total_microareas = len(microareas)
    cobertas = sum(1 for m in microareas if (m.status or "").upper() == "COBERTA")
    descobertas = total_microareas - cobertas
    cobertura_pct = round((cobertas / total_microareas) * 100, 1) if total_microareas else 0
    total_agentes = sum(len(agentes_por_microarea.get(m.id, [])) for m in microareas)
    microareas_descobertas = [m for m in microareas if (m.status or "").upper() != "COBERTA"]
    microareas_cobertas = [m for m in microareas if (m.status or "").upper() == "COBERTA"]

    elements.append(Paragraph("Resumo executivo", styles["Heading3"]))

    resumo_data = [
        [
            "Total",
            "Cobertas",
            "Descobertas",
            "Cobertura (%)",
            "ACS vinculados",
        ],
        [
            str(total_microareas),
            str(cobertas),
            str(descobertas),
            f"{cobertura_pct}%",
            str(total_agentes),
        ],
    ]

    resumo_table = Table(resumo_data, colWidths=[3.2 * cm, 3.2 * cm, 3.2 * cm, 3.2 * cm, 3.2 * cm])
    resumo_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5F5")),
            ]
        )
    )

    elements.append(resumo_table)
    elements.append(Spacer(1, 0.4 * cm))

    prioridade = sorted(
        microareas_descobertas,
        key=_build_priority_score,
        reverse=True,
    )

    elements.append(Paragraph("Prioridades de cobertura (microareas descobertas)", styles["Heading3"]))
    prioridade_table_data = [["Microarea", "Familias", "Populacao", "Localidades"]]
    for microarea in prioridade:
        prioridade_table_data.append(
            [
                microarea.nome,
                str(microarea.familias or 0),
                str(microarea.populacao or 0),
                _format_localidades(getattr(microarea, "localidades", None)),
            ]
        )
    if len(prioridade_table_data) == 1:
        prioridade_table_data.append(["-", "-", "-", "-"])

    prioridade_table = Table(
        prioridade_table_data,
        colWidths=[5.2 * cm, 2.4 * cm, 2.4 * cm, 6.1 * cm],
        repeatRows=1,
    )
    prioridade_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5F5")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    elements.append(prioridade_table)
    elements.append(Spacer(1, 0.4 * cm))

    elements.append(Paragraph("Sugestao de realocacao de ACS", styles["Heading3"]))
    doadores = [
        m
        for m in microareas_cobertas
        if len(agentes_por_microarea.get(m.id, [])) > 1
    ]
    realocacoes = []
    for destino in prioridade:
        if not doadores:
            break
        doador = doadores[0]
        realocacoes.append(f"Mover 1 ACS de {doador.nome} para {destino.nome}.")
        if len(agentes_por_microarea.get(doador.id, [])) <= 2:
            doadores.pop(0)

    if not realocacoes:
        elements.append(Paragraph("Nao ha sugestoes automaticas com base nos dados atuais.", styles["BodyText"]))
    else:
        sugestoes_table = Table(
            [[Paragraph(sugestao, styles["BodyText"])] for sugestao in realocacoes],
            colWidths=[16.5 * cm],
        )
        sugestoes_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5F5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(sugestoes_table)

    elements.append(Spacer(1, 0.4 * cm))
    elements.append(Paragraph("Checklist por microarea descoberta", styles["Heading3"]))
    checklist_data = [["Microarea", "Checklist de acao"]]
    for microarea in prioridade:
        checklist = "Definir localidades e descricao | Vincular ACS | Atualizar status"
        checklist_data.append([microarea.nome, checklist])
    if len(checklist_data) == 1:
        checklist_data.append(["-", "-"])

    checklist_table = Table(
        checklist_data,
        colWidths=[6 * cm, 10.5 * cm],
        repeatRows=1,
    )
    checklist_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5F5")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    elements.append(checklist_table)
    elements.append(Spacer(1, 0.4 * cm))

    elements.append(Paragraph("Detalhamento completo", styles["Heading3"]))
    table_data = [["Microarea", "Status", "Familias", "Populacao", "Agentes"]]

    for microarea in microareas:
        agentes = agentes_por_microarea.get(microarea.id, [])
        agentes_texto = ", ".join(agentes) if agentes else "-"
        locais_texto = _format_localidades(getattr(microarea, "localidades", None))
        descricao = (getattr(microarea, "descricao", "") or "").strip() or "-"
        observacoes = (getattr(microarea, "observacoes", "") or "").strip()
        detalhes = f"<b>{microarea.nome}</b><br/>Localidades: {locais_texto}<br/>Descricao: {descricao}"
        if observacoes:
            detalhes += f"<br/>Observacoes: {observacoes}"
        table_data.append(
            [
                Paragraph(detalhes, styles["BodyText"]),
                microarea.status,
                str(microarea.familias or 0),
                str(microarea.populacao or 0),
                Paragraph(agentes_texto, styles["BodyText"]),
            ]
        )

    table = Table(
        table_data,
        colWidths=[8 * cm, 2.2 * cm, 2.1 * cm, 2.4 * cm, 4.3 * cm],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (2, 1), (3, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5F5")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)

    pdf_bytes = buffer.getvalue()
    filename_base = _safe_filename(f"microareas_{nome_ubs}")
    return pdf_bytes, filename_base
