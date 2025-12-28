import { api } from "../api";
import { Link } from "react-router-dom";

// Menu de funcionalidades após login.
// Por enquanto, sempre mostramos a visão completa de gestor
// para qualquer usuário autenticado (mais simples para testar a UI).
export function Dashboard() {
  const usuarioAtual = api.getCurrentUser();
  const rotuloPapel = "Gestor da UBS";

  // Distribuição simples de funcionalidades com base no dashboard_ideal.md
  const itensComuns = [
    {
      title: "Novo relatório situacional",
      desc: "Preencher o formulário de diagnóstico para criar um relatório situacional do zero.",
      to: "/diagnostico",
      allowedFor: ["profissional"],
    },
    {
      title: "Gerenciar relatórios situacionais",
      desc: "Ver e gerir rascunhos e relatórios situacionais já criados.",
      to: "/relatorios",
      allowedFor: ["profissional"],
    },
    {
      title: "Marcação de Consultas",
      desc: "Registrar e acompanhar agendamentos de consultas na UBS.",
      to: "#",
      allowedFor: ["profissional"],
    },
    {
      title: "Materiais Educativos",
      desc: "Acesso a orientações e documentos sobre diagnóstico situacional.",
      to: "#",
      allowedFor: ["usuario", "profissional"],
    },
    {
      title: "Suporte e Feedback",
      desc: "Envie sugestões, dúvidas ou reporte problemas.",
      to: "#",
      allowedFor: ["usuario", "profissional"],
    },
  ];

  const extrasGestor = [
    {
      title: "Gestão de Equipes e Microáreas",
      desc: "Visão de equipes da ESF, microáreas e território (futuro).",
      to: "#",
      allowedFor: ["profissional"],
    },
    {
      title: "Relatórios e Priorizações",
      desc: "Relatórios, priorização de problemas (GUT) e planos de intervenção.",
      to: "#",
      allowedFor: ["profissional"],
    },
  ];

  // Exibe todos os itens (visão de gestor), independentemente do papel salvo.
  const itens = [...itensComuns, ...extrasGestor];

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Bem-vindo à plataforma UBS</p>
          <h1>Menu principal</h1>
          <p className="muted">
            Você está autenticado como <strong>{rotuloPapel}</strong>. Nesta versão de testes, todas as
            funcionalidades do gestor estão visíveis para qualquer usuário autenticado.
          </p>
        </div>
      </section>

      <section className="card-grid">
        {itens.map((cartao) => (
          <article className="card" key={cartao.title}>
            <h3>{cartao.title}</h3>
            <p>{cartao.desc}</p>
            {cartao.to === "#" ? (
              <button className="btn btn-primary" type="button" disabled>
                Em desenvolvimento
              </button>
            ) : (
              <Link className="btn btn-primary" to={cartao.to}>
                Acessar
              </Link>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
