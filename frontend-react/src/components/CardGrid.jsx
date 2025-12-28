import { Link } from "react-router-dom";

export function CardGrid() {
  const cartoes = [
    {
      title: "Relatório Situacional",
      desc: "Crie ou atualize o relatório da sua UBS.",
      cta: "Acessar",
      to: "/diagnostico",
    },
    {
      title: "Indicadores",
      desc: "Visualize e envie indicadores epidemiológicos.",
      cta: "Ver indicadores",
      to: "#",
    },
    {
      title: "Equipe",
      desc: "Consulte profissionais cadastrados (área do gestor).",
      cta: "Ver equipe",
      to: "#",
    },
    {
      title: "Suporte",
      desc: "Precisa de ajuda? Fale conosco.",
      cta: "Entrar em contato",
      to: "#",
    },
  ];

  return (
    <section className="card-grid">
      {cartoes.map((cartao) => (
        <article className="card" key={cartao.title}>
          <h3>{cartao.title}</h3>
          <p>{cartao.desc}</p>
          {cartao.to ? (
            <Link className="btn btn-primary" to={cartao.to}>
              {cartao.cta}
            </Link>
          ) : (
            <button className="btn btn-primary" type="button">
              {cartao.cta}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
