import { Link } from "react-router-dom";

export function CardGrid() {
  const cards = [
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
      {cards.map((card) => (
        <article className="card" key={card.title}>
          <h3>{card.title}</h3>
          <p>{card.desc}</p>
          {card.to ? (
            <Link className="btn btn-primary" to={card.to}>
              {card.cta}
            </Link>
          ) : (
            <button className="btn btn-primary" type="button">
              {card.cta}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
