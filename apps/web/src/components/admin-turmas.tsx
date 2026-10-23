"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  Turma,
  TurmaEnrollment,
  TurmaEnvConfig,
  TurmaLeaderGrant,
  TurmaRequest,
} from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { brl } from "@/lib/format";
import { BOOK_COVERS, isAutoCover, turmaCover } from "@/lib/turma-cover";
import { StatusChip, when } from "./turmas";
import { TurmaContentEditor } from "./turmas-studio";

type SubTab = "solicitacoes" | "turmas" | "conteudo" | "matriculas" | "lideres";

const SUBTABS: Array<[SubTab, string]> = [
  ["solicitacoes", "Solicitações"],
  ["turmas", "Turmas"],
  ["conteudo", "Conteúdo"],
  ["matriculas", "Matrículas"],
  ["lideres", "Líderes"],
];

const dateValue = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toIso = (value: string) =>
  value ? new Date(value + "T12:00:00.000Z").toISOString() : null;
const priceText = (cents: number | null) =>
  cents === null || cents === 0
    ? ""
    : (cents / 100).toFixed(2).replace(".", ",");

export function AdminTurmas({
  allowed,
  initialTurmaId,
}: {
  allowed: boolean;
  initialTurmaId: number | null;
}) {
  const [sub, setSub] = useState<SubTab>(
    initialTurmaId ? "turmas" : "solicitacoes",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [requests, setRequests] = useState<TurmaRequest[]>([]);
  const [enrollments, setEnrollments] = useState<TurmaEnrollment[]>([]);
  const [leaders, setLeaders] = useState<TurmaLeaderGrant[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(initialTurmaId);
  const [requestStatus, setRequestStatus] = useState("PENDING");
  const [requestBook, setRequestBook] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const current = turmas.find((t) => t.id === currentId) || null;

  async function loadAll() {
    const [list, reqs, enroll, grants] = await Promise.all([
      api<Turma[]>("admin/turmas"),
      api<TurmaRequest[]>(
        "admin/turmas/requests?status=" +
          encodeURIComponent(requestStatus) +
          "&bookLevel=" +
          encodeURIComponent(requestBook),
      ),
      api<TurmaEnrollment[]>(
        "admin/turmas/enrollments?status=" +
          encodeURIComponent(enrollmentStatus),
      ),
      api<TurmaLeaderGrant[]>("admin/turmas/leaders"),
    ]);
    setTurmas(list);
    setRequests(reqs);
    setEnrollments(enroll);
    setLeaders(grants);
  }
  async function reload() {
    setError("");
    try {
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, requestStatus, requestBook, enrollmentStatus]);

  if (!allowed)
    return (
      <p className="admin-error" role="alert">
        A gestão das turmas é restrita ao gestor supremo da loja. Peça a um
        administrador para conceder o acesso ou use a área do líder em minhas
        turmas.
      </p>
    );

  async function decide(
    request: TurmaRequest,
    status: "APPROVED" | "REJECTED",
  ) {
    const form = document.getElementById(
      "decisao-" + request.id,
    ) as HTMLFormElement | null;
    const data = form ? new FormData(form) : new FormData();
    setError("");
    setNotice("");
    try {
      const turma = String(data.get("turmaId") || "");
      await api("admin/turmas/requests/" + request.id, "PATCH", {
        status,
        turmaId: turma ? Number(turma) : null,
        note: String(data.get("note") || ""),
      });
      setNotice(
        status === "APPROVED"
          ? "Solicitação aprovada. O interessado já pode concluir a matrícula."
          : "Solicitação recusada com nota para o interessado.",
      );
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <nav className="admin-subtabs" aria-label="Áreas das turmas">
        {SUBTABS.map(([key, name]) => (
          <button
            key={key}
            type="button"
            className={sub === key ? "active" : ""}
            onClick={() => {
              setSub(key);
              setError("");
              setNotice("");
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      ) : null}
      {sub === "solicitacoes" ? (
        <>
          <div className="admin-search">
            <label>
              Status da solicitação
              <select
                value={requestStatus}
                onChange={(e) => setRequestStatus(e.target.value)}
              >
                <option value="PENDING">Em análise</option>
                <option value="APPROVED">Aprovadas</option>
                <option value="REJECTED">Recusadas</option>
                <option value="CONVERTED">Matriculadas</option>
                <option value="">Todas</option>
              </select>
            </label>
            <label>
              Livro
              <select
                value={requestBook}
                onChange={(e) => setRequestBook(e.target.value)}
              >
                <option value="">Todos</option>
                {[1, 2, 3, 4].map((level) => (
                  <option key={level} value={level}>
                    Guerreiro {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="admin-count">
            {requests.length} solicitações · o interesse sempre antecede a
            compra
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Interessado</th>
                  <th>Livro</th>
                  <th>Contato</th>
                  <th>Mensagem</th>
                  <th>Turma</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.name}</strong>
                      <br />
                      <small>{request.username}</small>
                    </td>
                    <td>Guerreiro {request.bookLevel}</td>
                    <td>{request.contact}</td>
                    <td className="admin-turma-message">
                      {request.message || "—"}
                    </td>
                    <td>{request.turmaTitle || "—"}</td>
                    <td>
                      <StatusChip status={request.status} />
                      {request.decisionNote ? (
                        <small className="admin-turma-note">
                          {request.decisionNote}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      {request.status === "PENDING" ? (
                        <>
                          <form
                            id={"decisao-" + request.id}
                            className="admin-decision"
                          >
                            <label>
                              Turma de destino
                              <select
                                name="turmaId"
                                defaultValue={request.turmaId || ""}
                              >
                                <option value="">
                                  Automática (próxima turma do livro)
                                </option>
                                {turmas
                                  .filter(
                                    (t) =>
                                      t.bookLevel === request.bookLevel &&
                                      t.status !== "CANCELLED",
                                  )
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title}
                                    </option>
                                  ))}
                              </select>
                            </label>
                            <label>
                              Nota (obrigatória ao recusar)
                              <input
                                name="note"
                                maxLength={500}
                                placeholder="Ex.: turma confirmada para a próxima turma…"
                              />
                            </label>
                            <div className="admin-actions">
                              <button
                                type="button"
                                className="admin-link"
                                onClick={() => decide(request, "APPROVED")}
                              >
                                Aprovar
                              </button>
                              <button
                                type="button"
                                className="admin-link danger"
                                onClick={() => decide(request, "REJECTED")}
                              >
                                Recusar
                              </button>
                            </div>
                          </form>
                        </>
                      ) : (
                        <span className="admin-help">
                          {request.decidedBy
                            ? "Decidida por " + request.decidedBy
                            : "Sem decisão pendente"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!requests.length ? (
              <p className="empty-state">Nenhuma solicitação neste filtro.</p>
            ) : null}
          </div>
        </>
      ) : null}
      {sub === "turmas" ? (
        current ? (
          <AdminTurmaEditor
            key={current.id}
            turma={current}
            leaders={leaders}
            onError={setError}
            onSaved={async (message) => {
              setNotice(message);
              await reload();
            }}
            onBack={() => {
              setCurrentId(null);
              setNotice("");
            }}
            onDeleted={async () => {
              setCurrentId(null);
              setNotice("Turma excluída.");
              await reload();
            }}
          />
        ) : (
          <>
            <div className="admin-actions admin-heading-actions">
              <button
                className="button dark-button"
                onClick={async () => {
                  setError("");
                  setNotice("");
                  try {
                    const created = await api<Turma>("turmas", "POST", {
                      bookLevel: 1,
                      title: "Nova turma",
                      slug: "nova-turma-" + Date.now().toString(36),
                      subtitle: "",
                      description: "",
                      status: "DRAFT",
                      leaderUserId: null,
                      priceCents: 0,
                      seatsTotal: 0,
                      startDate: null,
                      imageUrl: BOOK_COVERS[1],
                      imageAlt: "",
                      items: [],
                    });
                    await reload();
                    setCurrentId(created.id);
                    setNotice(
                      "Turma criada como rascunho. Ajuste os dados e mude o status para abrir as inscrições.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                + Nova turma <span>↗</span>
              </button>
            </div>
            <p className="admin-count">
              {turmas.length} turmas · preço, vagas, itens, líder e ambiente
              ficam sob a gestão
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Turma</th>
                    <th>Livro</th>
                    <th>Status</th>
                    <th>Preço</th>
                    <th>Vagas</th>
                    <th>Interesse</th>
                    <th>Líder</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {turmas.map((turma) => (
                    <tr key={turma.id}>
                      <td>
                        <button
                          className="admin-product"
                          onClick={() => {
                            setCurrentId(turma.id);
                            setNotice("");
                          }}
                        >
                          <img
                            src={turmaCover(turma.bookLevel, turma.imageUrl)}
                            alt=""
                            width="48"
                            height="58"
                          />
                          <span>
                            <strong>{turma.title}</strong>
                            <small>/{turma.slug}/</small>
                          </span>
                        </button>
                      </td>
                      <td>Guerreiro {turma.bookLevel}</td>
                      <td>
                        <StatusChip status={turma.status} />
                      </td>
                      <td>{turma.priceCents ? brl(turma.priceCents) : "—"}</td>
                      <td>
                        {turma.seatsTotal
                          ? turma.seatsTaken + " / " + turma.seatsTotal
                          : "livre"}
                      </td>
                      <td>{turma.interestCount}</td>
                      <td>{turma.leaderUsername || "—"}</td>
                      <td>
                        <button
                          className="admin-link"
                          onClick={() => {
                            setCurrentId(turma.id);
                            setNotice("");
                          }}
                        >
                          Editar
                        </button>
                        <Link
                          className="admin-link"
                          href={"/turma/" + turma.slug + "/"}
                        >
                          Ver ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!turmas.length ? (
                <p className="empty-state">Ainda não há turmas cadastradas.</p>
              ) : null}
            </div>
          </>
        )
      ) : null}
      {sub === "conteudo" ? (
        <section className="admin-panel">
          <h2>Conteúdo do ambiente</h2>
          <p className="admin-help">
            A liderança cria os módulos e aulas como rascunho; aqui a gestão
            revisa e publica o conteúdo que aparece no ambiente exclusivo.
          </p>
          <div className="admin-search">
            <label>
              Turma
              <select
                value={currentId ?? ""}
                onChange={(e) =>
                  setCurrentId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} · Guerreiro {t.bookLevel}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {current ? (
            <TurmaContentEditor
              turmaId={current.id}
              canPublish
              onError={setError}
            />
          ) : (
            <p className="admin-help">
              Selecione uma turma para ver o conteúdo.
            </p>
          )}
        </section>
      ) : null}
      {sub === "matriculas" ? (
        <>
          <div className="admin-search">
            <label>
              Status da matrícula
              <select
                value={enrollmentStatus}
                onChange={(e) => setEnrollmentStatus(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="RESERVED">Aguardando pagamento</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
            </label>
          </div>
          <p className="admin-count">
            {enrollments.length} matrículas · confirme manualmente apenas
            pagamentos fora do fluxo simulado
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Turma</th>
                  <th>Status</th>
                  <th>Referência</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.username}</td>
                    <td>{enrollment.turmaTitle}</td>
                    <td>
                      <StatusChip status={enrollment.status} />
                    </td>
                    <td>{enrollment.paymentRef || "—"}</td>
                    <td>
                      {when(enrollment.confirmedAt || enrollment.createdAt)}
                    </td>
                    <td>
                      {enrollment.status !== "CONFIRMED" ? (
                        <button
                          className="admin-link"
                          onClick={async () => {
                            setError("");
                            try {
                              await api(
                                "admin/turmas/enrollments/" + enrollment.id,
                                "PATCH",
                                { status: "CONFIRMED" },
                              );
                              setNotice("Matrícula confirmada.");
                              await loadAll();
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Confirmar
                        </button>
                      ) : null}
                      {enrollment.status !== "CANCELLED" ? (
                        <button
                          className="admin-link danger"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Cancelar a matrícula deste participante?",
                              )
                            )
                              return;
                            setError("");
                            try {
                              await api(
                                "admin/turmas/enrollments/" + enrollment.id,
                                "PATCH",
                                { status: "CANCELLED" },
                              );
                              setNotice("Matrícula cancelada.");
                              await loadAll();
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!enrollments.length ? (
              <p className="empty-state">Nenhuma matrícula neste filtro.</p>
            ) : null}
          </div>
        </>
      ) : null}
      {sub === "lideres" ? (
        <>
          <section className="admin-panel">
            <h2>Conceder privilégio de líder</h2>
            <p className="admin-help">
              O líder criado pelo gestor pode montar as turmas do seu livro e
              produzir o conteúdo; a publicação e a política continuam com a
              gestão.
            </p>
            <form
              className="admin-category-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                setError("");
                try {
                  await api("admin/turmas/leaders", "POST", {
                    username: String(data.get("username")),
                  });
                  setNotice("Privilégio de líder concedido.");
                  form.reset();
                  await loadAll();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <label>
                Usuário
                <input
                  name="username"
                  required
                  maxLength={150}
                  placeholder="nome do participante"
                />
              </label>
              <button className="button dark-button">Conceder liderança</button>
            </form>
          </section>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Concedido por</th>
                  <th>Desde</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((grant) => (
                  <tr key={grant.id}>
                    <td>{grant.username}</td>
                    <td>{grant.grantedBy || "—"}</td>
                    <td>{when(grant.createdAt)}</td>
                    <td>
                      <button
                        className="admin-link danger"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Remover o privilégio de líder de " +
                                grant.username +
                                "?",
                            )
                          )
                            return;
                          setError("");
                          try {
                            await api(
                              "admin/turmas/leaders/" + grant.id,
                              "DELETE",
                            );
                            setNotice("Privilégio de líder removido.");
                            await loadAll();
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leaders.length ? (
              <p className="empty-state">Nenhum líder concedido até agora.</p>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}

function AdminTurmaEditor({
  turma,
  leaders,
  onError,
  onSaved,
  onBack,
  onDeleted,
}: {
  turma: Turma;
  leaders: TurmaLeaderGrant[];
  onError: (m: string) => void;
  onSaved: (m: string) => Promise<void>;
  onBack: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    bookLevel: turma.bookLevel,
    title: turma.title,
    slug: turma.slug,
    subtitle: turma.subtitle,
    description: turma.description,
    imageUrl: turmaCover(turma.bookLevel, turma.imageUrl),
    imageAlt: turma.imageAlt,
    startDate: dateValue(turma.startDate),
    status: turma.status,
    leaderUserId: turma.leaderUserId,
  });
  const [price, setPrice] = useState(priceText(turma.priceCents));
  const [seats, setSeats] = useState(turma.seatsTotal);
  const [items, setItems] = useState(
    turma.items.map((item) => ({
      ...item,
      priceText: priceText(item.priceCents),
    })),
  );
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<TurmaEnvConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    heroImageUrl: "",
    heroImageAlt: "",
    welcomeTitle: "",
    welcomeText: "",
    accent: "cyan" as "cyan" | "deep",
    showRoster: true,
    showSchedule: true,
  });
  const [configBusy, setConfigBusy] = useState(false);

  useEffect(() => {
    api<{ config: TurmaEnvConfig }>("turmas/" + turma.id + "/staff")
      .then((view) => {
        const c = view.config;
        setConfig(c);
        setConfigForm({
          heroImageUrl: c.heroImageUrl,
          heroImageAlt: c.heroImageAlt,
          welcomeTitle: c.welcomeTitle,
          welcomeText: c.welcomeText,
          accent: c.accent,
          showRoster: c.showRoster,
          showSchedule: c.showSchedule,
        });
      })
      .catch(() => setConfig(null));
  }, [turma.id]);

  function parsePrice(value: string, label: string) {
    const clean = value.trim().replace(",", ".");
    if (!clean) return 0;
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean))
      throw new Error(label + " inválido. Use até duas casas decimais.");
    return Math.round(Number(clean) * 100);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      await api("turmas/" + turma.id, "PATCH", {
        bookLevel: form.bookLevel,
        title: form.title,
        slug: form.slug,
        subtitle: form.subtitle,
        description: form.description,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        startDate: toIso(form.startDate),
        status: form.status,
        leaderUserId: form.leaderUserId,
        priceCents: parsePrice(price, "Preço"),
        seatsTotal: seats,
        items: items.map((item) => ({
          ...(item.id ? { id: item.id } : {}),
          name: item.name,
          description: item.description,
          priceCents: item.priceText.trim()
            ? parsePrice(item.priceText, "Preço do item")
            : null,
          required: item.required,
          order: item.order,
        })),
      });
      await onSaved(
        "Turma salva. Status, preço, vagas, itens e líder já valem para as próximas matrículas.",
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigBusy(true);
    onError("");
    try {
      const saved = await api<TurmaEnvConfig>(
        "admin/turmas/" + turma.id + "/config",
        "PUT",
        {
          ...configForm,
          welcomeTitle: configForm.welcomeTitle.trim(),
        },
      );
      setConfig(saved);
      await onSaved("Ambiente exclusivo atualizado.");
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setConfigBusy(false);
    }
  }
  return (
    <>
      <div className="admin-actions admin-heading-actions">
        <button className="admin-secondary" type="button" onClick={onBack}>
          ← Voltar à lista de turmas
        </button>
        <Link
          className="admin-link"
          href={"/turma/" + turma.slug + "/ambiente/"}
        >
          Abrir o ambiente ↗
        </Link>
        <button
          className="admin-link danger"
          onClick={async () => {
            if (
              !confirm(
                "Excluir a turma " +
                  turma.title +
                  "? Esta ação remove matrículas e conteúdo.",
              )
            )
              return;
            setBusy(true);
            onError("");
            try {
              await api("admin/turmas/" + turma.id, "DELETE");
              await onDeleted();
            } catch (e) {
              onError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Excluir turma
        </button>
      </div>
      <form className="admin-editor" onSubmit={save}>
        <section className="admin-panel">
          <h2>Identificação do encontro</h2>
          <div className="admin-fields">
            <label>
              Livro base
              <select
                value={form.bookLevel}
                onChange={(e) => {
                  const bookLevel = Number(e.target.value) as 1 | 2 | 3 | 4;
                  setForm({
                    ...form,
                    bookLevel,
                    imageUrl: isAutoCover(form.imageUrl)
                      ? BOOK_COVERS[bookLevel]
                      : form.imageUrl,
                  });
                }}
              >
                {[1, 2, 3, 4].map((level) => (
                  <option key={level} value={level}>
                    Guerreiro {level}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome da turma
              <input
                value={form.title}
                required
                maxLength={120}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Endereço
              <input
                value={form.slug}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={180}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
            <label>
              Data do encontro
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </label>
            <label className="wide">
              Subtítulo
              <input
                value={form.subtitle}
                maxLength={160}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </label>
            <label className="wide">
              Descrição
              <textarea
                value={form.description}
                rows={5}
                maxLength={20000}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label>
              Imagem (endereço local)
              <input
                value={form.imageUrl}
                maxLength={300}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </label>
            <label>
              Descrição da imagem
              <input
                value={form.imageAlt}
                maxLength={180}
                onChange={(e) => setForm({ ...form, imageAlt: e.target.value })}
              />
            </label>
          </div>
        </section>
        <section className="admin-panel">
          <h2>Política da turma</h2>
          <div className="admin-fields">
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Turma["status"],
                  })
                }
              >
                <option value="DRAFT">Rascunho</option>
                <option value="OPEN">Inscrições abertas</option>
                <option value="CONFIRMED">Turma confirmada</option>
                <option value="FINISHED">Encerrada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </label>
            <label>
              Preço da matrícula (R$)
              <input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label>
              Vagas (0 = sem limite)
              <input
                type="number"
                min="0"
                max="10000"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
              />
            </label>
            <label>
              Líder da turma
              <select
                value={form.leaderUserId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    leaderUserId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">Sem líder definido</option>
                {leaders
                  .filter((grant) => grant.userId !== form.leaderUserId)
                  .map((grant) => (
                    <option key={grant.userId} value={grant.userId}>
                      {grant.username}
                    </option>
                  ))}
                {form.leaderUserId && turma.leaderUsername ? (
                  <option value={form.leaderUserId}>
                    {turma.leaderUsername} (atual)
                  </option>
                ) : null}
              </select>
            </label>
          </div>
          <p className="admin-help">
            Só a gestão define status, preço, vagas, itens e líder. O
            interessado só consegue matricular-se com solicitação aprovada e
            turma confirmada.
          </p>
        </section>
        <section className="admin-panel">
          <h2>Itens obrigatórios</h2>
          <p className="admin-help">
            Lista exibida na página da turma antes da matrícula (livro, caderno,
            vestuário etc.).
          </p>
          {items.map((item, index) => (
            <div className="admin-inline admin-item-row" key={index}>
              <label>
                Item
                <input
                  value={item.name}
                  required
                  maxLength={120}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === index ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Descrição
                <input
                  value={item.description}
                  maxLength={400}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === index ? { ...x, description: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Preço (R$)
                <input
                  inputMode="decimal"
                  value={item.priceText}
                  placeholder="0,00"
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === index ? { ...x, priceText: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Ordem
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={item.order}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === index
                          ? { ...x, order: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              <label className="admin-checks-inline">
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === index ? { ...x, required: e.target.checked } : x,
                      ),
                    )
                  }
                />
                Obrigatório
              </label>
              <button
                type="button"
                className="admin-link danger"
                onClick={() => setItems(items.filter((_, j) => j !== index))}
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-secondary"
            onClick={() =>
              setItems([
                ...items,
                {
                  id: 0,
                  turmaId: turma.id,
                  name: "",
                  description: "",
                  priceCents: null,
                  required: true,
                  order: items.length,
                  priceText: "",
                },
              ])
            }
          >
            + Adicionar item
          </button>
        </section>
        <div className="admin-actions">
          <button className="button dark-button" disabled={busy} type="submit">
            {busy ? "Salvando…" : "Salvar turma ↗"}
          </button>
        </div>
      </form>
      <form className="admin-editor" onSubmit={saveConfig}>
        <section className="admin-panel">
          <h2>Ambiente exclusivo</h2>
          <p className="admin-help">
            {config
              ? "Visual do ambiente que os matriculados veem após o pagamento."
              : "Este ambiente ainda não foi configurado; os campos abaixo criam a primeira versão."}
          </p>
          <div className="admin-fields">
            <label>
              Título de boas-vindas
              <input
                value={configForm.welcomeTitle}
                maxLength={120}
                placeholder="Título do ambiente"
                onChange={(e) =>
                  setConfigForm({ ...configForm, welcomeTitle: e.target.value })
                }
              />
            </label>
            <label>
              Imagem do topo (endereço local)
              <input
                value={configForm.heroImageUrl}
                maxLength={300}
                placeholder="/static/design/…"
                onChange={(e) =>
                  setConfigForm({ ...configForm, heroImageUrl: e.target.value })
                }
              />
            </label>
            <label>
              Descrição da imagem
              <input
                value={configForm.heroImageAlt}
                maxLength={180}
                onChange={(e) =>
                  setConfigForm({ ...configForm, heroImageAlt: e.target.value })
                }
              />
            </label>
            <label>
              Cor de destaque
              <select
                value={configForm.accent}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    accent: e.target.value as "cyan" | "deep",
                  })
                }
              >
                <option value="cyan">Ciano Guerreiro</option>
                <option value="deep">Profundo</option>
              </select>
            </label>
            <label className="wide">
              Texto de boas-vindas
              <textarea
                value={configForm.welcomeText}
                rows={4}
                maxLength={4000}
                onChange={(e) =>
                  setConfigForm({ ...configForm, welcomeText: e.target.value })
                }
              />
            </label>
          </div>
          <div className="admin-checks">
            <label>
              <input
                type="checkbox"
                checked={configForm.showRoster}
                onChange={(e) =>
                  setConfigForm({ ...configForm, showRoster: e.target.checked })
                }
              />
              Mostrar a lista de guerreiros da turma
            </label>
            <label>
              <input
                type="checkbox"
                checked={configForm.showSchedule}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    showSchedule: e.target.checked,
                  })
                }
              />
              Mostrar a data do encontro
            </label>
          </div>
          <div className="admin-actions">
            <button
              className="button dark-button"
              disabled={configBusy}
              type="submit"
            >
              {configBusy ? "Salvando…" : "Salvar ambiente ↗"}
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
