"use client";
import { useState } from "react";
import Link from "next/link";
import type { TurmaOverview } from "@guerreiros/contracts";
import {
  TURMA_REQUEST_LABEL,
  TURMA_ENROLLMENT_LABEL,
} from "@guerreiros/contracts";
import { StatusChip, when } from "./turmas";
import { TurmaStudio } from "./turmas-studio";
import { useSession } from "./session";

export function MyTurmas({ initial }: { initial: TurmaOverview }) {
  const { value } = useSession();
  const [tab, setTab] = useState<"minhas" | "lider">(
    initial.isLeader ? "lider" : "minhas",
  );
  const isAdmin = value?.user?.role === "ADMIN" && !!value?.user?.canManage;
  return (
    <section className="section my-turmas">
      <div className="section-heading">
        <div>
          <p className="eyebrow dark">ÁREA DO GUERREIRO</p>
          <h1 className="my-turmas-title">
            Minhas <em>turmas.</em>
          </h1>
        </div>
        <p>
          Acompanhe as solicitações enviadas, as matrículas confirmadas e, se
          for líder, conduza o conteúdo da sua turma.
        </p>
        {initial.isLeader ? (
          <div className="my-turmas-tabs" role="tablist" aria-label="Áreas">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "lider"}
              className={tab === "lider" ? "active" : ""}
              onClick={() => setTab("lider")}
            >
              Área do líder
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "minhas"}
              className={tab === "minhas" ? "active" : ""}
              onClick={() => setTab("minhas")}
            >
              Minhas turmas
            </button>
          </div>
        ) : null}
      </div>
      {tab === "minhas" || !initial.isLeader ? (
        <>
          <div className="my-turmas-grid">
            <section className="my-turmas-block">
              <h2>Matrículas</h2>
              {initial.enrollments.length ? (
                initial.enrollments.map((enrollment) => (
                  <article className="my-turma-card" key={enrollment.id}>
                    <header>
                      <span className="turma-book">
                        LIVRO {String(enrollment.bookLevel).padStart(2, "0")}
                      </span>
                      <StatusChip status={enrollment.status} />
                    </header>
                    <h3>{enrollment.turmaTitle}</h3>
                    <p>
                      {enrollment.status === "CONFIRMED"
                        ? "Matrícula confirmada em " +
                          when(enrollment.confirmedAt)
                        : TURMA_ENROLLMENT_LABEL[enrollment.status]}
                      {enrollment.paymentRef
                        ? " · Referência " + enrollment.paymentRef
                        : ""}
                    </p>
                    {enrollment.status === "CONFIRMED" ? (
                      <Link
                        className="button cyan"
                        href={"/turma/" + enrollment.turmaSlug + "/ambiente/"}
                      >
                        Entrar no ambiente <span>↗</span>
                      </Link>
                    ) : (
                      <Link
                        className="button dark-button"
                        href={"/turma/" + enrollment.turmaSlug + "/"}
                      >
                        Finalizar matrícula <span>↗</span>
                      </Link>
                    )}
                  </article>
                ))
              ) : (
                <div className="my-turma-empty">
                  <p>
                    Você ainda não tem matrículas. Comece manifestando interesse
                    pela turma do seu livro.
                  </p>
                  <Link className="text-link" href="/turmas/">
                    Ver as turmas <span>↗</span>
                  </Link>
                </div>
              )}
            </section>
            <section className="my-turmas-block">
              <h2>Solicitações de interesse</h2>
              {initial.requests.length ? (
                <div className="my-turma-list">
                  {initial.requests.map((request) => (
                    <article key={request.id}>
                      <header>
                        <strong>
                          Guerreiro {request.bookLevel}
                          {request.turmaTitle ? " · " + request.turmaTitle : ""}
                        </strong>
                        <StatusChip status={request.status} />
                      </header>
                      <p>
                        {TURMA_REQUEST_LABEL[request.status]}
                        {request.decisionNote
                          ? " · " + request.decisionNote
                          : request.status === "PENDING"
                            ? " · enviada em " + when(request.createdAt)
                            : ""}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="my-turma-empty">
                  <p>
                    Nenhuma solicitação enviada. As turmas abertas recebem
                    solicitação antes da compra.
                  </p>
                  <Link className="text-link" href="/turmas/">
                    Conhecer as turmas <span>↗</span>
                  </Link>
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <TurmaStudio isAdmin={isAdmin} />
      )}
    </section>
  );
}
