import Link from "next/link";
import { getTurmas } from "@/lib/server";
import { brl } from "@/lib/format";
import { StatusChip, when } from "@/components/turmas-shared";
import "@/app/turmas.css";

export const metadata = {
  title: "As turmas",
  description:
    "Encontros guiados do Cada Homem Um Guerreiro, baseados nos livros Guerreiro 1 ao 4.",
};

const BOOKS: Record<number, { name: string; tagline: string }> = {
  1: { name: "Guerreiro 1", tagline: "O chamado" },
  2: { name: "Guerreiro 2", tagline: "A formação" },
  3: { name: "Guerreiro 3", tagline: "A batalha" },
  4: { name: "Guerreiro 4", tagline: "O legado" },
};

const STEPS = [
  {
    n: "01",
    title: "Manifeste o interesse",
    text: "Antes de qualquer pagamento, você registra o interesse na turma do livro escolhido.",
  },
  {
    n: "02",
    title: "A gestão decide",
    text: "O gestor avalia o número de interessados, define os itens obrigatórios e decide se a turma acontece.",
  },
  {
    n: "03",
    title: "Turma confirmada",
    text: "Com a turma confirmada e a sua solicitação aprovada, a vaga fica garantida.",
  },
  {
    n: "04",
    title: "Ambiente liberado",
    text: "Após a matrícula, você entra no ambiente exclusivo com os encontros e materiais.",
  },
];

export default async function TurmasPage() {
  const turmas = await getTurmas();
  const levels = [1, 2, 3, 4].map((level) => ({
    level,
    turma:
      turmas.find(
        (t) =>
          t.bookLevel === level && ["OPEN", "CONFIRMED"].includes(t.status),
      ) || turmas.find((t) => t.bookLevel === level && t.status === "FINISHED"),
  }));
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow dark">GUERREIROS / AS TURMAS</p>
        <h1>
          Encontros que
          <br />
          <em>formam guerreiros.</em>
        </h1>
        <p>
          Cada livro da coleção ganha uma turma ao vivo, com um guerreiro
          responsável conduzindo a jornada. Você manifesta o interesse, a gestão
          decide e o ambiente abre quando a turma acontece.
        </p>
      </section>
      <div className="value-strip">
        <span>
          <b>01</b> INTERESSE ANTES DA COMPRA.
        </span>
        <span>
          <b>02</b> TURMA CONFIRMADA PELA GESTÃO.
        </span>
        <span>
          <b>03</b> AMBIENTE EXCLUSIVO DE ENCONTROS.
        </span>
      </div>
      <section className="section turma-levels-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">OS QUATRO LIVROS</p>
            <h2>
              Escolha o seu
              <br />
              <em>próximo encontro.</em>
            </h2>
          </div>
          <p>
            As turmas seguem a ordem dos livros. Se a turma do seu livro ainda
            não foi aberta, manifeste o interesse: a gestão acompanha a demanda
            para formar o próximo grupo.
          </p>
          <Link className="text-link" href="/minhas-turmas/">
            Minhas turmas <span>↗</span>
          </Link>
        </div>
        <div className="turma-levels">
          {levels.map(({ level, turma }) => (
            <article className="turma-level-card" key={level}>
              <div className="turma-level-head">
                <span className="turma-book">
                  LIVRO {String(level).padStart(2, "0")}
                </span>
                <StatusChip status={turma?.status || "DRAFT"} />
              </div>
              <h3>
                Guerreiro {level}
                <b>{BOOKS[level].tagline}</b>
              </h3>
              {turma ? (
                <>
                  <img
                    src={
                      turma.imageUrl ||
                      "/static/design/logos/simbolo-escuro.svg"
                    }
                    alt={turma.imageAlt || turma.title}
                    loading="lazy"
                    width="640"
                    height="420"
                  />
                  <p className="turma-level-title">{turma.title}</p>
                  <ul className="turma-level-facts">
                    <li>
                      <b>Encontro</b> {when(turma.startDate)}
                    </li>
                    <li>
                      <b>Condução</b>{" "}
                      {turma.leaderUsername
                        ? turma.leaderUsername
                        : "a anunciar pela gestão"}
                    </li>
                    <li>
                      <b>Vagas</b>{" "}
                      {turma.seatsTotal
                        ? `${turma.seatsTaken} de ${turma.seatsTotal} ocupadas`
                        : "sem limite definido"}
                    </li>
                    <li>
                      <b>Investimento</b>{" "}
                      {turma.priceCents ? brl(turma.priceCents) : "a definir"}
                    </li>
                  </ul>
                  <Link
                    className="button dark-button"
                    href={"/turma/" + turma.slug + "/"}
                  >
                    {turma.status === "FINISHED"
                      ? "Manifestar interesse no próximo"
                      : "Ver a turma"}{" "}
                    <span>↗</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="turma-level-empty">
                    <img
                      src="/static/design/logos/simbolo-escuro.svg"
                      alt=""
                      loading="lazy"
                      width="120"
                      height="150"
                    />
                    <p>
                      A turma do Guerreiro {level} ainda não foi aberta.
                      Manifeste o interesse e a gestão avalia a formação do
                      grupo.
                    </p>
                  </div>
                  <Link className="button dark-button" href="/minhas-turmas/">
                    Manifestar interesse <span>↗</span>
                  </Link>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="section turma-steps-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">COMO FUNCIONA</p>
            <h2>
              Do interesse
              <br />
              <em>ao ambiente.</em>
            </h2>
          </div>
          <p>
            Nenhuma turma é formada por acaso: cada grupo existe porque a gestão
            confirmou que ele vai acontecer.
          </p>
        </div>
        <ol className="turma-steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="closing">
        <p className="eyebrow dark">CADA HOMEM UM GUERREIRO</p>
        <h2>
          Sua turma
          <br />
          <em>começa aqui.</em>
        </h2>
        <a className="button dark-button" href="/minhas-turmas/">
          Acessar minhas turmas <span>↗</span>
        </a>
        <div className="closing-stamp" aria-hidden="true">
          FÉ
          <br />
          EM
          <br />
          MOVIMENTO ↗
        </div>
      </section>
    </>
  );
}
