import { useState } from "react";

// Página de marcação de consultas (somente frontend por enquanto)
export function AgendamentoConsultas() {
  const [formulario, setFormulario] = useState({
    paciente: "",
    data: "",
    hora: "",
    tipo: "Consulta médica",
    observacoes: "",
  });
  const [agendamentos, setAgendamentos] = useState([]);

  const aoAlterar = (e) => {
    setFormulario((anterior) => ({ ...anterior, [e.target.name]: e.target.value }));
  };

  const aoEnviar = (e) => {
    e.preventDefault();
    if (!formulario.paciente || !formulario.data || !formulario.hora) return;

    const novoAgendamento = {
      id: Date.now(),
      ...formulario,
    };
    setAgendamentos((anterior) => [novoAgendamento, ...anterior]);
    setFormulario({ paciente: "", data: "", hora: "", tipo: "Consulta médica", observacoes: "" });
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Gestão de consultas</p>
          <h1>Marcação de consultas</h1>
          <p className="muted">
            Registre consultas agendadas de forma simples. Nesta versão inicial, os dados ficam apenas na tela
            (sem salvar no servidor).
          </p>
        </div>
      </section>

      <section className="diagnostico-card" style={{ marginTop: 24 }}>
        <form className="form" onSubmit={aoEnviar}>
          <div className="field-grid field-grid-3">
            <label className="form-field">
              <span className="field-label">Nome do paciente*</span>
              <input
                className="field-input"
                name="paciente"
                value={formulario.paciente}
                onChange={aoAlterar}
                placeholder="Ex: Maria da Silva"
                required
              />
            </label>
            <label className="form-field">
              <span className="field-label">Data*</span>
              <input
                className="field-input"
                type="date"
                name="data"
                value={formulario.data}
                onChange={aoAlterar}
                required
              />
            </label>
            <label className="form-field">
              <span className="field-label">Horário*</span>
              <input
                className="field-input"
                type="time"
                name="hora"
                value={formulario.hora}
                onChange={aoAlterar}
                required
              />
            </label>
          </div>

          <div className="field-grid field-grid-2" style={{ marginTop: 16 }}>
            <label className="form-field">
              <span className="field-label">Tipo de atendimento</span>
              <select
                className="field-input"
                name="tipo"
                value={formulario.tipo}
                onChange={aoAlterar}
              >
                <option>Consulta médica</option>
                <option>Consulta de enfermagem</option>
                <option>Visita domiciliar</option>
                <option>Retorno</option>
              </select>
            </label>
          </div>

          <div className="form-field full-width" style={{ marginTop: 16 }}>
            <label className="field-label">Observações (opcional)</label>
            <textarea
              className="field-input textarea"
              name="observacoes"
              value={formulario.observacoes}
              onChange={aoAlterar}
              rows={3}
              placeholder="Informações adicionais sobre o motivo da consulta, necessidades específicas, etc."
            />
          </div>

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <button className="btn btn-primary" type="submit">
              Salvar agendamento (local)
            </button>
          </div>
        </form>
      </section>

      {agendamentos.length > 0 && (
        <section className="card-grid" style={{ marginTop: 32 }}>
          {agendamentos.map((agendamento) => (
            <article className="card" key={agendamento.id}>
              <h3>{agendamento.paciente}</h3>
              <p>
                {agendamento.data} às {agendamento.hora}
              </p>
              <p className="muted">{agendamento.tipo}</p>
              {agendamento.observacoes && <p>{agendamento.observacoes}</p>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
