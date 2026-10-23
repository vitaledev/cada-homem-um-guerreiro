import Link from "next/link";
import { notFound } from "next/navigation";
import type { TurmaEnvironment } from "@guerreiros/contracts";
import { getTurmaEnvironment, authedApi } from "@/lib/server";
import { brl } from "@/lib/format";
import { StatusChip, when } from "@/components/turmas-shared";
import "@/app/turmas.css";

export const metadata = {
  title: "Ambiente da turma",
  robots: { index: false, follow: false },
};

async function viewerOverview() {
  return authedApi<{ isLeader: boolean }>("turmas/overview").catch(() => null);
}

export default async function AmbientePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let environment: TurmaEnvironment;
  try {
    environment = await getTurmaEnvironment(slug);
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 404) notFound();
    const overview = await viewerOverview();
    return (
      <section className="ambiente-locked">
        <p className="eyebrow dark">AMBIENTE EXCLUSIVO</p>
        <h1>
          {status === 403
            ? "Este ambiente ainda não está liberado para você."
            : "Não foi possível abrir o ambiente."}
        </h1>
        <p>
          {overview?.isLeader
            ? "Acesse pela área do líder em minhas turmas."
            : "Entre com a sua conta para verificar o estado da sua matrícula."}
        </p>
        <div className="ambiente-locked-actions">
          <Link className="button dark-button" href="/minhas-turmas/">
            Minhas turmas <span>↗</span>
          </Link>
          <Link className="text-link" href={"/turma/" + slug + "/"}>
            Ver a turma <span>↗</span>
          </Link>
        </div>
      </section>
    );
  }
  const { turma, config, modules, roster, role } = environment;
  const staff = role === "ADMIN" || role === "LEADER";
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <section className={"ambiente-shell accent-" + config.accent}>
      <header className="ambiente-hero">
        {config.heroImageUrl ? (
          <img
            className="ambiente-hero-image"
            src={config.heroImageUrl}
            alt={config.heroImageAlt || ""}
            width="1600"
            height="700"
          />
        ) : null}
        <div className="ambiente-hero-shade"></div>
        <div className="ambiente-hero-content">
          <p className="eyebrow">
            AMBIENTE DA TURMA / GUERREIRO {turma.bookLevel}
          </p>
          <h1>{config.welcomeTitle || turma.title}</h1>
          <p className="ambiente-hero-text">
            {config.welcomeText || turma.subtitle || turma.description}
          </p>
          <div className="ambiente-hero-meta">
            <StatusChip status={turma.status} />
            <span>
              {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
            </span>
            <span>
              {totalLessons} {totalLessons === 1 ? "encontro" : "encontros"}
            </span>
            {config.showSchedule ? <span>{when(turma.startDate)}</span> : null}
          </div>
          {staff ? (
            <div className="ambiente-staff-bar">
              <strong>
                {role === "ADMIN" ? "Gestor supremo" : "Líder da turma"}
              </strong>
              <Link href="/minhas-turmas/">Gerenciar conteúdo ↗</Link>
              {role === "ADMIN" ? (
                <Link href={"/admin/?aba=turmas&turma=" + turma.id}>
                  Configurar ambiente ↗
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <div className="ambiente-body">
        <main className="ambiente-modules">
          {modules.length ? (
            modules.map((module, index) => (
              <article className="ambiente-module" key={module.id}>
                <header>
                  <span className="ambiente-module-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>{module.title}</h2>
                    {module.summary ? <p>{module.summary}</p> : null}
                  </div>
                  {!module.lessons.length ? (
                    <span className="chip">Em breve</span>
                  ) : null}
                </header>
                {module.lessons.length ? (
                  <ol className="ambiente-lessons">
                    {module.lessons.map((lesson, i) => (
                      <li key={lesson.id}>
                        <details>
                          <summary>
                            <span className="ambiente-lesson-index">
                              {index + 1}.{i + 1}
                            </span>
                            <span>
                              <strong>{lesson.title}</strong>
                              {lesson.summary ? (
                                <small>{lesson.summary}</small>
                              ) : null}
                            </span>
                            {!staff && lesson.status !== "PUBLISHED" ? (
                              <span className="chip">Em breve</span>
                            ) : null}
                            {staff && lesson.status !== "PUBLISHED" ? (
                              <span className="chip wait">Rascunho</span>
                            ) : null}
                          </summary>
                          <div className="ambiente-lesson-body">
                            {lesson.content
                              .split(/\n\n+/)
                              .filter(Boolean)
                              .map((text, k) => (
                                <p key={k}>{text}</p>
                              ))}
                            {lesson.attachmentUrl ? (
                              <a
                                className="text-link"
                                href={lesson.attachmentUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {lesson.attachmentLabel || "Material da aula"}{" "}
                                <span>↗</span>
                              </a>
                            ) : null}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="ambiente-empty">
                    O conteúdo deste módulo está sendo preparado pela liderança.
                  </p>
                )}
              </article>
            ))
          ) : (
            <div className="ambiente-empty-state">
              <h2>Os encontros estão sendo preparados.</h2>
              <p>
                A liderança da turma ainda não publicou os módulos. Assim que o
                conteúdo for aprovado pela gestão, ele aparece aqui.
              </p>
            </div>
          )}
        </main>
        <aside className="ambiente-aside">
          <section className="ambiente-panel">
            <h2>A sua turma</h2>
            <ul>
              <li>
                <b>Livro</b> Guerreiro {turma.bookLevel}
              </li>
              {config.showSchedule ? (
                <li>
                  <b>Encontro</b> {when(turma.startDate)}
                </li>
              ) : null}
              <li>
                <b>Condução</b> {turma.leaderUsername || "Gestão Guerreiros"}
              </li>
              {turma.priceCents ? (
                <li>
                  <b>Investimento</b> {brl(turma.priceCents)}
                </li>
              ) : null}
            </ul>
            <Link className="text-link" href={"/turma/" + turma.slug + "/"}>
              Detalhes da turma <span>↗</span>
            </Link>
          </section>
          {roster.length ? (
            <section className="ambiente-panel">
              <h2>Guerreiros desta turma</h2>
              <ul className="ambiente-roster">
                {roster.map((person, i) => (
                  <li key={person.username + i}>
                    <span>{person.username}</span>
                    <small>
                      desde{" "}
                      {new Date(person.since).toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
