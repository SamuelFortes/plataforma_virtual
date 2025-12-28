import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Tela intermediária para gestão de relatórios situacionais (rascunhos e finalizados)
// Nesta versão, usamos dados apenas em memória, apenas para navegação e visão geral.
export function RelatoriosSituacionais() {
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [relatorios, setRelatorios] = useState([
    {
      id: 1,
      nomeUbs: "ESF 18 – Adalto Pereira Saraçayo",
      atualizadoEm: "2024-11-10",
      status: "rascunho",
    },
    {
      id: 2,
      nomeUbs: "UBS Centro",
      atualizadoEm: "2024-11-05",
      status: "finalizado",
    },
  ]);

  const relatoriosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return relatorios;
    return relatorios.filter((relatorio) => relatorio.status === filtroStatus);
  }, [filtroStatus, relatorios]);

  const rotuloStatus = (status) => {
    if (status === "rascunho") return "Rascunho";
    if (status === "finalizado") return "Finalizado";
    return status;
  };

  const lidarComExclusao = (id) => {
    const confirmarExclusao = window.confirm(
      "Tem certeza que deseja excluir este relatório? Essa ação não poderá ser desfeita."
    );
    if (!confirmarExclusao) return;
    setRelatorios((anterior) => anterior.filter((relatorio) => relatorio.id !== id));
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Relatórios situacionais</p>
          <h1>Gerenciar diagnósticos da UBS</h1>
          <p className="muted">
            Use esta tela como um painel intermediário para visualizar diagnósticos em rascunho ou já
            finalizados. Nesta versão, os dados são apenas exemplos locais.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/diagnostico">
            Novo relatório
          </Link>
        </div>
      </section>

      <section className="diagnostico-card" style={{ marginTop: 24 }}>
        <div className="form-section-header" style={{ marginBottom: 16 }}>
          <h2>Relatórios cadastrados</h2>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <label className="field-label" style={{ marginRight: 8 }}>
              Filtrar por status:
            </label>
            <select
              className="field-input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="todos">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {relatoriosFiltrados.length === 0 ? (
          <p className="muted">Nenhum relatório encontrado para o filtro selecionado.</p>
        ) : (
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>UBS</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Última atualização</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatoriosFiltrados.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{r.nomeUbs}</td>
                  <td style={{ padding: "8px" }}>{r.atualizadoEm}</td>
                  <td style={{ padding: "8px" }}>
                    <span className="pill-badge">{rotuloStatus(r.status)}</span>
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      {r.status === "finalizado" ? (
                        <button className="btn btn-secondary" type="button" disabled>
                          Visualização (em breve)
                        </button>
                      ) : (
                        <Link className="btn btn-primary" to="/diagnostico">
                          Continuar preenchendo
                        </Link>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => lidarComExclusao(r.id)}
                        title="Excluir relatório"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
