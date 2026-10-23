import Link from "next/link";
import { notFound } from "next/navigation";
import type { TurmaOverview } from "@guerreiros/contracts";
import { getTurma, authedApi } from "@/lib/server";
import { brl } from "@/lib/format";
import { StatusChip, TurmaActions } from "@/components/turmas";
import { when } from "@/components/turmas-shared";
import "@/app/turmas.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const turma = await getTurma(slug).catch(() => null);
  return { title: turma ? turma.title : "Turma não encontrada" };
}

export default async function TurmaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let turma;
  try {
    turma = await getTurma(slug);
  } catch (error) {
    if ((error as Error).message === "NOT_FOUND") notFound();
    throw error;
  }
  const overview = await authedApi<TurmaOverview>("turmas/overview").catch(
    () => null,
  );
  const path = "/turma/" + turma.slug + "/";
  const required = turma.items.filter((i) => i.required);
  const optional = turma.items.filter((i) => !i.required);
  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Início</Link> / <Link href="/turmas/">Turmas</Link> /{" "}
        Guerreiro {turma.bookLevel}
      </div>
      <section className="turma-detail">
        <div className="turma-detail-media">
          <img
            src={turma.imageUrl || "/static/design/logos/simbolo-escuro.svg"}
            alt={turma.imageAlt || turma.title}
            width="1000"
            height="1000"
          />
          <div className="turma-detail-strip">
            <span>
              <b>Livro</b> Guerreiro {turma.bookLevel}
            </span>
            <span>
              <b>Encontro</b> {when(turma.startDate)}
            </span>
            <span>
              <b>Condução</b> {turma.leaderUsername || "a anunciar pela gestão"}
            </span>
            <span>
              <b>Vagas</b>{" "}
              {turma.seatsTotal
                ? `${turma.seatsTaken} de ${turma.seatsTotal} ocupadas`
                : "sem limite definido"}
            </span>
          </div>
        </div>
        <div className="turma-detail-info">
          <p className="eyebrow dark">
            TURMA {String(turma.bookLevel).padStart(2, "0")} / ENCONTROS GUIADOS
          </p>
          <h1>{turma.title}</h1>
          <p className="detail-subtitle">{turma.subtitle}</p>
          <div className="turma-detail-price">
            <strong>
              {turma.priceCents ? brl(turma.priceCents) : "A definir"}
            </strong>
            <StatusChip status={turma.status} />
          </div>
          <div className="product-description">
            {turma.description.split(/\n\n+/).map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
          {required.length ? (
            <section className="turma-items">
              <h2>O que você precisa ter</h2>
              <ul>
                {required.map((item) => (
                  <li key={item.id}>
                    <span>
                      <strong>{item.name}</strong>
                      {item.description ? (
                        <small>{item.description}</small>
                      ) : null}
                    </span>
                    <b>{item.priceCents ? brl(item.priceCents) : "—"}</b>
                  </li>
                ))}
              </ul>
              {optional.length ? (
                <p className="turma-items-note">
                  Itens opcionais sugeridos pela gestão:{" "}
                  {optional.map((i) => i.name).join(", ")}.
                </p>
              ) : null}
            </section>
          ) : null}
          <TurmaActions turma={turma} overview={overview} nextPath={path} />
          <details>
            <summary>Como funciona a turma</summary>
            <p>
              O interesse é registrado antes da compra. A gestão analisa a
              demanda, confirma a turma, define os itens obrigatórios e libera a
              matrícula. Após a matrícula, o ambiente exclusivo com os encontros
              fica disponível na sua conta.
            </p>
          </details>
          <details>
            <summary>Pagamento</summary>
            <p>
              Nesta prévia, o pagamento é simulado para testar o fluxo completo.
              A integração de cobrança será configurada antes do lançamento.
            </p>
          </details>
        </div>
      </section>
      <section className="section turma-steps-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">PRÓXIMOS PASSOS</p>
            <h2>
              Acompanhe
              <br />
              <em>a sua jornada.</em>
            </h2>
          </div>
          <Link className="text-link" href="/minhas-turmas/">
            Minhas turmas <span>↗</span>
          </Link>
        </div>
        <ol className="turma-steps">
          <li>
            <span>01</span>
            <h3>Interesse registrado</h3>
            <p>Sua solicitação fica visível para o gestor responsável.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Análise da gestão</h3>
            <p>
              O gestor decide se a turma acontece e quais itens são exigidos.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>Matrícula</h3>
            <p>Com a vaga aprovada, você conclui a matrícula da turma.</p>
          </li>
          <li>
            <span>04</span>
            <h3>Ambiente exclusivo</h3>
            <p>Módulos, aulas e materiais disponíveis na sua conta.</p>
          </li>
        </ol>
      </section>
    </>
  );
}
