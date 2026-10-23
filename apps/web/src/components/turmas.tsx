"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Turma, TurmaOverview } from "@guerreiros/contracts";
import { TURMA_ENROLLMENT_LABEL } from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { brl } from "@/lib/format";
import { useSession } from "./session";

export { StatusChip, when } from "./turmas-shared";

export function InterestForm({
  turma,
  nextPath,
  attachToTurma = true,
  onSent,
}: {
  turma: Pick<Turma, "id" | "bookLevel" | "title">;
  nextPath: string;
  attachToTurma?: boolean;
  onSent?: () => void;
}) {
  const { value } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="turma-note ok" role="status">
        <strong>Solicitação enviada.</strong>
        <p>
          O gestor vai analisar o interesse e confirmar se a turma do Guerreiro{" "}
          {turma.bookLevel} vai acontecer. Acompanhe em{" "}
          <Link href="/minhas-turmas/">minhas turmas</Link>.
        </p>
      </div>
    );
  if (!value?.user)
    return (
      <div className="turma-note">
        <strong>Entre com a sua conta.</strong>
        <p>
          A solicitação de interesse é registrada no seu nome para que o gestor
          consiga avaliar quem compõe a turma.
        </p>
        <Link
          className="button dark-button"
          href={"/entrar/?next=" + encodeURIComponent(nextPath)}
        >
          Entrar ou criar conta <span>↗</span>
        </Link>
      </div>
    );
  return (
    <form
      className="interest-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          await api("turmas/interest", "POST", {
            bookLevel: turma.bookLevel,
            turmaId: attachToTurma ? turma.id : null,
            name: String(data.get("name")),
            contact: String(data.get("contact")),
            message: String(data.get("message") || ""),
          });
          setSent(true);
          onSent?.();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Seu nome
        <input
          name="name"
          defaultValue={value.user.username}
          required
          maxLength={120}
        />
      </label>
      <label>
        WhatsApp ou e-mail
        <input
          name="contact"
          required
          minLength={5}
          maxLength={160}
          placeholder="(00) 00000-0000"
        />
      </label>
      <label>
        Por que quer participar? <small>(opcional)</small>
        <textarea name="message" rows={3} maxLength={2000} />
      </label>
      {error ? (
        <p className="turma-note bad" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button dark-button" disabled={busy} type="submit">
        {busy ? "Enviando…" : "Manifestar interesse"} <span>↗</span>
      </button>
    </form>
  );
}

export function TurmaActions({
  turma,
  overview,
  nextPath,
}: {
  turma: Turma;
  overview: TurmaOverview | null;
  nextPath: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const enrollment = overview?.enrollments.find((e) => e.turmaId === turma.id);
  const request =
    overview?.requests.find((r) => r.turmaId === turma.id) ||
    overview?.requests.find(
      (r) => r.turmaId === null && r.bookLevel === turma.bookLevel,
    );
  async function step(action: "enroll" | "checkout") {
    setBusy(action);
    setError("");
    try {
      await api("turmas/" + turma.id + "/" + action, "POST", {});
      if (action === "checkout")
        router.push("/turma/" + turma.slug + "/ambiente/");
      else {
        router.refresh();
        setBusy("");
      }
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }
  return (
    <div className="turma-actions">
      {error ? (
        <p className="turma-note bad" role="alert">
          {error}
        </p>
      ) : null}
      {enrollment?.status === "CONFIRMED" ? (
        <div className="turma-note ok">
          <strong>Você já faz parte desta turma.</strong>
          <p>O ambiente com os encontros está liberado para você.</p>
          <Link
            className="button cyan"
            href={"/turma/" + turma.slug + "/ambiente/"}
          >
            Entrar no ambiente <span>↗</span>
          </Link>
        </div>
      ) : null}
      {enrollment?.status === "RESERVED" ? (
        <div className="turma-note">
          <strong>{TURMA_ENROLLMENT_LABEL.RESERVED}.</strong>
          <p>
            Vaga reservada no valor de {brl(turma.priceCents)}. Confirme o
            pagamento simulado para liberar o ambiente.
          </p>
          <button
            className="button cyan"
            disabled={!!busy}
            onClick={() => step("checkout")}
          >
            {busy === "checkout"
              ? "Confirmando…"
              : "Confirmar pagamento simulado"}
            <span>↗</span>
          </button>
        </div>
      ) : null}
      {!enrollment && request?.status === "APPROVED" ? (
        turma.status === "CONFIRMED" ? (
          <div className="turma-note ok">
            <strong>Solicitação aprovada.</strong>
            <p>
              Sua vaga está garantida. Conclua a matrícula por{" "}
              {brl(turma.priceCents)} para entrar no ambiente.
            </p>
            <button
              className="button cyan"
              disabled={!!busy}
              onClick={() => step("enroll")}
            >
              {busy === "enroll" ? "Reservando…" : "Reservar minha vaga"}
              <span>↗</span>
            </button>
          </div>
        ) : (
          <div className="turma-note">
            <strong>Solicitação aprovada.</strong>
            <p>
              A compra abre assim que a gestão confirmar que a turma vai
              acontecer. Você receberá o acesso ao ambiente após o pagamento.
            </p>
          </div>
        )
      ) : null}
      {!enrollment && request?.status === "PENDING" ? (
        <div className="turma-note">
          <strong>Solicitação em análise.</strong>
          <p>
            O gestor está avaliando se esta turma será formada. Acompanhe em{" "}
            <Link href="/minhas-turmas/">minhas turmas</Link>.
          </p>
        </div>
      ) : null}
      {!enrollment && request?.status === "REJECTED" ? (
        <div className="turma-note bad">
          <strong>Não foi possível aprovar esta solicitação.</strong>
          <p>
            {request.decisionNote || "Aguarde a abertura de uma nova turma."}
          </p>
        </div>
      ) : null}
      {!enrollment && !request ? (
        turma.status === "OPEN" ||
        turma.status === "CONFIRMED" ||
        turma.status === "FINISHED" ? (
          <InterestForm
            turma={turma}
            nextPath={nextPath}
            attachToTurma={turma.status !== "FINISHED"}
          />
        ) : (
          <div className="turma-note">
            <strong>Inscrições encerradas.</strong>
            <p>Manifeste o interesse pelo próximo encontro em minhas turmas.</p>
          </div>
        )
      ) : null}
    </div>
  );
}
