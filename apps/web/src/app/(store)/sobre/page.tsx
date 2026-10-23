export const metadata = { title: "Nosso propósito" };
export default function About() {
  return (
    <>
      <section className="page-intro about-intro">
        <p className="eyebrow dark">CADA HOMEM UM GUERREIRO</p>
        <h1>
          Fé que se vive.
          <br />
          <em>Legado que se constrói.</em>
        </h1>
        <p>
          Uma identidade para quem encontra no propósito a força para seguir.
        </p>
      </section>
      <section className="purpose">
        <div className="purpose-mark">
          <img
            src="/static/design/logos/simbolo-ciano.svg"
            alt="Símbolo original Guerreiros"
            width="300"
            height="360"
          />
        </div>
        <div className="purpose-copy">
          <p className="eyebrow">A FORÇA COMEÇA POR DENTRO</p>
          <h2>
            Presente
            <br />
            <em>na caminhada.</em>
          </h2>
          <p>
            A coleção foi pensada para unir leitura, expressão e os essenciais
            do dia a dia. Esta apresentação é uma proposta de linguagem da marca
            e será refinada com a história oficial da empresa.
          </p>
          <a className="button cyan" href="/loja/">
            Explore a coleção ↗
          </a>
        </div>
      </section>
    </>
  );
}
