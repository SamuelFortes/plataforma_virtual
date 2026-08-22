"""Testes do quebra-linhas das caixas de texto do relatório em PDF.

Contexto: as caixas eram uma tabela de uma única célula. Tabelas do ReportLab só
quebram entre linhas, então um texto mais alto que a página levantava LayoutError
e a exportação inteira devolvia 500. Estes testes protegem a invariante que
corrigiu isso: nenhuma linha da tabela pode ser grande o bastante para não caber
numa página.
"""

from app.services.reporting.simple_situational_report_pdf import (
    _BOXED_CHUNK,
    _boxed,
    _fmt_date_br,
    _split_for_box,
)
from reportlab.lib.styles import ParagraphStyle


ESTILO = ParagraphStyle(name="teste", fontName="Helvetica", fontSize=9, leading=12)


def test_texto_curto_fica_em_um_pedaco():
    assert _split_for_box("Texto curto.") == ["Texto curto."]


def test_texto_vazio_vira_placeholder():
    assert _split_for_box("") == ["-"]
    assert _split_for_box(None) == ["-"]
    assert _split_for_box("   ") == ["-"]


def test_paragrafos_viram_pedacos_separados():
    assert _split_for_box("Primeiro.\nSegundo.\n\nTerceiro.") == [
        "Primeiro.",
        "Segundo.",
        "Terceiro.",
    ]


def test_paragrafo_longo_e_fatiado_dentro_do_limite():
    frase = "Esta e uma frase de tamanho razoavel sobre o territorio da UBS. "
    texto = frase * 200  # ~12.800 caracteres, o tamanho real do campo problemas
    pedacos = _split_for_box(texto)

    assert len(pedacos) > 1, "texto longo deve ser quebrado em varias linhas"
    for pedaco in pedacos:
        assert len(pedaco) <= _BOXED_CHUNK * 2, "pedaco grande o bastante para estourar a pagina"


def test_fatiamento_preserva_o_conteudo():
    texto = "Alfa bravo charlie. " * 300
    juntado = " ".join(_split_for_box(texto))
    # A quebra normaliza espaços, então comparamos as palavras.
    assert juntado.split() == texto.split()


def test_nao_corta_palavra_no_meio():
    texto = "palavra " * 500
    for pedaco in _split_for_box(texto):
        assert not pedaco.startswith(" ")
        for palavra in pedaco.split():
            assert palavra == "palavra"


def test_boxed_gera_tabela_divisivel_para_texto_longo():
    tabela = _boxed("Frase de teste. " * 400, ESTILO)

    # splitByRow permite ao ReportLab continuar a tabela na página seguinte.
    assert tabela.splitByRow
    assert len(tabela._cellvalues) > 1, "a caixa precisa de mais de uma linha para quebrar"


def test_boxed_com_texto_curto_continua_com_uma_linha():
    tabela = _boxed("Uma observacao breve.", ESTILO)
    assert len(tabela._cellvalues) == 1


def test_prazo_sai_no_formato_brasileiro():
    assert _fmt_date_br("2026-08-30") == "30/08/2026"


def test_prazo_desconhecido_passa_intacto():
    assert _fmt_date_br("30/08/2026") == "30/08/2026"
    assert _fmt_date_br(None) == ""
    assert _fmt_date_br("a definir") == "a definir"
