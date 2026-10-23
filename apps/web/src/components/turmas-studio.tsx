"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  LessonInput,
  ModuleInput,
  Turma,
  TurmaEnrollment,
  TurmaLesson,
  TurmaModule,
  TurmaRequest,
} from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { BOOK_COVERS, isAutoCover, turmaCover } from "@/lib/turma-cover";
import { StatusChip, when } from "./turmas";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const dateValue = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toIso = (value: string) =>
  value ? new Date(value + "T12:00:00.000Z").toISOString() : null;

type StaffView = {
  enrollments: TurmaEnrollment[];
  requests: TurmaRequest[];
  modules: TurmaModule[];
};

export function TurmaStudio({ isAdmin }: { isAdmin: boolean }) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const current = turmas.find((t) => t.id === currentId) || null;
  async function load(select?: number | null) {
    const list = await api<Turma[]>("turmas/manageable");
    setTurmas(list);
    setCurrentId(select === undefined ? (list[0]?.id ?? null) : select);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  return (
    <div className="studio">
      {error ? (
        <p className="turma-note bad" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="turma-note ok" role="status">
          {notice}
        </p>
      ) : null}
      <div className="studio-layout">
        <aside className="studio-side">
          <h2>Suas turmas</h2>
          <ul>
            {turmas.map((turma) => (
              <li key={turma.id}>
                <button
                  className={turma.id === currentId ? "active" : ""}
                  onClick={() => {
                    setCurrentId(turma.id);
                    setNotice("");
                  }}
                >
                  <span>
                    <strong>{turma.title}</strong>
                    <small>Guerreiro {turma.bookLevel}</small>
                  </span>
                  <StatusChip status={turma.status} />
                </button>
              </li>
            ))}
          </ul>
          <button
            className="button dark-button"
            onClick={() => {
              setCurrentId(null);
              setNotice("");
            }}
          >
            + Nova turma
          </button>
          {isAdmin ? (
            <Link className="studio-link" href="/admin/?aba=turmas">
              Abrir a gestão completa ↗
            </Link>
          ) : null}
        </aside>
        <main className="studio-main">
          <TurmaForm
            key={current?.id || "new"}
            turma={current}
            isAdmin={isAdmin}
            onError={setError}
            onSaved={async (message) => {
              setNotice(message);
              await load(current?.id ?? undefined);
            }}
          />
          {current ? (
            <>
              <section className="studio-panel">
                <h2>Participantes e solicitações</h2>
                <StudioPeople turmaId={current.id} onError={setError} />
              </section>
              <section className="studio-panel">
                <h2>Conteúdo do ambiente</h2>
                <p className="studio-help">
                  O conteúdo é criado como rascunho e publicado pela gestão
                  depois da revisão.
                </p>
                <TurmaContentEditor
                  turmaId={current.id}
                  canPublish={isAdmin}
                  onError={setError}
                />
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function TurmaForm({
  turma,
  isAdmin,
  onError,
  onSaved,
}: {
  turma: Turma | null;
  isAdmin: boolean;
  onError: (m: string) => void;
  onSaved: (m: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    bookLevel: turma?.bookLevel || 1,
    title: turma?.title || "",
    slug: turma?.slug || "",
    subtitle: turma?.subtitle || "",
    description: turma?.description || "",
    imageUrl: turmaCover(turma?.bookLevel || 1, turma?.imageUrl || ""),
    imageAlt: turma?.imageAlt || "",
    startDate: dateValue(turma?.startDate || null),
    status: turma?.status || "DRAFT",
    priceCents: turma?.priceCents || 0,
    seatsTotal: turma?.seatsTotal || 0,
    leaderUserId: turma?.leaderUserId ?? null,
  });
  const [price, setPrice] = useState(
    turma?.priceCents
      ? (turma.priceCents / 100).toFixed(2).replace(".", ",")
      : "",
  );
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      const payload = {
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
        priceCents: price.trim()
          ? Math.round(Number(price.replace(",", ".")) * 100)
          : 0,
        seatsTotal: form.seatsTotal,
        items:
          turma?.items.map((item) => ({
            ...(item.id ? { id: item.id } : {}),
            name: item.name,
            description: item.description,
            priceCents: item.priceCents,
            required: item.required,
            order: item.order,
          })) || [],
      };
      await api<Turma>(
        "turmas" + (turma ? "/" + turma.id : ""),
        turma ? "PATCH" : "POST",
        payload,
      );
      await onSaved(
        turma
          ? "Turma salva. Mudanças de preço, vagas e itens são aplicadas pela gestão."
          : "Turma criada como rascunho. A gestão abre a turma quando confirmar o encontro.",
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="studio-panel" onSubmit={save}>
      <h2>{turma ? "Dados da turma" : "Nova turma"}</h2>
      <div className="studio-fields">
        <label>
          Livro base
          <select
            value={form.bookLevel}
            onChange={(e) => {
              const bookLevel = Number(e.target.value) as Turma["bookLevel"];
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
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
                slug:
                  !turma && form.slug === slugify(form.title)
                    ? slugify(e.target.value)
                    : form.slug,
              })
            }
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
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
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
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        {isAdmin ? (
          <>
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
                value={form.seatsTotal}
                onChange={(e) =>
                  setForm({ ...form, seatsTotal: Number(e.target.value) })
                }
              />
            </label>
          </>
        ) : (
          <p className="studio-help">
            Preço, vagas, status e itens obrigatórios são definidos pela gestão
            após a análise do interesse.
          </p>
        )}
      </div>
      <div className="studio-actions">
        <button className="button dark-button" disabled={busy} type="submit">
          {busy ? "Salvando…" : turma ? "Salvar turma ↗" : "Criar turma ↗"}
        </button>
        {turma ? (
          <Link className="text-link" href={"/turma/" + turma.slug + "/"}>
            Ver página da turma <span>↗</span>
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function StudioPeople({
  turmaId,
  onError,
}: {
  turmaId: number;
  onError: (m: string) => void;
}) {
  const [view, setView] = useState<StaffView | null>(null);
  useEffect(() => {
    api<StaffView>("turmas/" + turmaId + "/staff")
      .then(setView)
      .catch((e) => onError(e.message));
  }, [turmaId]);
  if (!view)
    return <p className="studio-help">Carregando participantes da turma…</p>;
  return (
    <>
      <h3 className="studio-subtitle">
        Matrículas ({view.enrollments.length})
      </h3>
      <div className="studio-table-wrap">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Status</th>
              <th>Referência</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {view.enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>{enrollment.username}</td>
                <td>
                  <StatusChip status={enrollment.status} />
                </td>
                <td>{enrollment.paymentRef || "—"}</td>
                <td>{when(enrollment.confirmedAt || enrollment.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!view.enrollments.length ? (
          <p className="studio-help">Nenhuma matrícula ainda.</p>
        ) : null}
      </div>
      <h3 className="studio-subtitle">Solicitações ({view.requests.length})</h3>
      <div className="studio-table-wrap">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Interessado</th>
              <th>Contato</th>
              <th>Mensagem</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {view.requests.map((request) => (
              <tr key={request.id}>
                <td>{request.name}</td>
                <td>{request.contact}</td>
                <td>{request.message || "—"}</td>
                <td>
                  <StatusChip status={request.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!view.requests.length ? (
          <p className="studio-help">Nenhuma solicitação para esta turma.</p>
        ) : null}
      </div>
    </>
  );
}

export function TurmaContentEditor({
  turmaId,
  canPublish,
  onError,
}: {
  turmaId: number;
  canPublish: boolean;
  onError: (m: string) => void;
}) {
  const [modules, setModules] = useState<TurmaModule[]>([]);
  const [busy, setBusy] = useState(false);
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [lessonTarget, setLessonTarget] = useState<number | null>(null);
  async function load() {
    const view = await api<StaffView>("turmas/" + turmaId + "/staff");
    setModules(view.modules);
  }
  useEffect(() => {
    load().catch((e) => onError(e.message));
  }, [turmaId]);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    onError("");
    try {
      await action();
      await load();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const [moduleForm, setModuleForm] = useState<ModuleInput>({
    title: "",
    summary: "",
    order: modules.length,
    status: "DRAFT",
  });
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonInput>({
    title: "",
    summary: "",
    content: "",
    attachmentUrl: "",
    attachmentLabel: "",
    order: 0,
    status: "DRAFT",
  });
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  return (
    <div className="content-editor">
      <form
        className="content-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(() =>
            api(
              "turmas/" +
                turmaId +
                "/modules" +
                (editingModule ? "/" + editingModule : ""),
              editingModule ? "PATCH" : "POST",
              moduleForm,
            ),
          ).then(() => {
            setEditingModule(null);
            setModuleForm({
              title: "",
              summary: "",
              order: modules.length,
              status: "DRAFT",
            });
          });
        }}
      >
        <h3 className="studio-subtitle">
          {editingModule ? "Editar módulo" : "Novo módulo"}
        </h3>
        <div className="content-fields">
          <label>
            Título
            <input
              value={moduleForm.title}
              required
              maxLength={120}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, title: e.target.value })
              }
            />
          </label>
          <label>
            Resumo
            <input
              value={moduleForm.summary}
              maxLength={300}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, summary: e.target.value })
              }
            />
          </label>
          <label>
            Ordem
            <input
              type="number"
              min="0"
              max="999"
              value={moduleForm.order}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, order: Number(e.target.value) })
              }
            />
          </label>
          <button className="button dark-button" disabled={busy}>
            {busy
              ? "Salvando…"
              : editingModule
                ? "Salvar módulo"
                : "Adicionar módulo"}
          </button>
          {editingModule ? (
            <button
              type="button"
              className="studio-link"
              onClick={() => setEditingModule(null)}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
      <ol className="content-modules">
        {modules.map((module, index) => (
          <li key={module.id}>
            <header>
              <span className="content-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{module.title}</strong>
                <small>{module.summary || "Sem resumo"}</small>
              </div>
              <StatusChip status={module.status} />
              {canPublish && module.status === "DRAFT" ? (
                <button
                  className="studio-link"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api(
                        "turmas/" + turmaId + "/modules/" + module.id,
                        "PATCH",
                        {
                          title: module.title,
                          summary: module.summary,
                          order: module.order,
                          status: "PUBLISHED",
                        },
                      ),
                    )
                  }
                >
                  Publicar
                </button>
              ) : null}
              <button
                className="studio-link"
                onClick={() => {
                  setEditingModule(
                    editingModule === module.id ? null : module.id,
                  );
                  setModuleForm({
                    title: module.title,
                    summary: module.summary,
                    order: module.order,
                    status: module.status,
                  });
                }}
              >
                Editar
              </button>
              <button
                className="studio-link danger"
                disabled={busy}
                onClick={() => {
                  if (!confirm("Excluir o módulo " + module.title + "?"))
                    return;
                  run(() =>
                    api(
                      "turmas/" + turmaId + "/modules/" + module.id,
                      "DELETE",
                    ),
                  );
                }}
              >
                Excluir
              </button>
              <button
                className="studio-link"
                onClick={() =>
                  setOpenModule(openModule === module.id ? null : module.id)
                }
                aria-expanded={openModule === module.id}
              >
                {openModule === module.id ? "Fechar" : "Aulas"}
              </button>
            </header>
            {openModule === module.id ? (
              <div className="content-lessons">
                <ol>
                  {module.lessons.map((lesson, i) => (
                    <li key={lesson.id}>
                      <span className="content-index">
                        {index + 1}.{i + 1}
                      </span>
                      <div>
                        <strong>{lesson.title}</strong>
                        <small>{lesson.summary || "Sem resumo"}</small>
                      </div>
                      <StatusChip status={lesson.status} />
                      {canPublish && lesson.status === "DRAFT" ? (
                        <button
                          className="studio-link"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              api(
                                "turmas/" +
                                  turmaId +
                                  "/modules/" +
                                  module.id +
                                  "/lessons/" +
                                  lesson.id,
                                "PATCH",
                                {
                                  title: lesson.title,
                                  summary: lesson.summary,
                                  content: lesson.content,
                                  attachmentUrl: lesson.attachmentUrl,
                                  attachmentLabel: lesson.attachmentLabel,
                                  order: lesson.order,
                                  status: "PUBLISHED",
                                },
                              ),
                            )
                          }
                        >
                          Publicar
                        </button>
                      ) : null}
                      <button
                        className="studio-link"
                        onClick={() => {
                          setEditingLesson(lesson.id);
                          setLessonTarget(module.id);
                          setLessonForm({
                            title: lesson.title,
                            summary: lesson.summary,
                            content: lesson.content,
                            attachmentUrl: lesson.attachmentUrl,
                            attachmentLabel: lesson.attachmentLabel,
                            order: lesson.order,
                            status: lesson.status,
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="studio-link danger"
                        disabled={busy}
                        onClick={() => {
                          if (!confirm("Excluir a aula " + lesson.title + "?"))
                            return;
                          run(() =>
                            api(
                              "turmas/" +
                                turmaId +
                                "/modules/" +
                                module.id +
                                "/lessons/" +
                                lesson.id,
                              "DELETE",
                            ),
                          );
                        }}
                      >
                        Excluir
                      </button>
                    </li>
                  ))}
                </ol>
                <form
                  className="content-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() =>
                      api(
                        "turmas/" +
                          turmaId +
                          "/modules/" +
                          module.id +
                          "/lessons" +
                          (editingLesson && lessonTarget === module.id
                            ? "/" + editingLesson
                            : ""),
                        editingLesson && lessonTarget === module.id
                          ? "PATCH"
                          : "POST",
                        lessonForm,
                      ),
                    ).then(() => {
                      setEditingLesson(null);
                      setLessonTarget(null);
                      setLessonForm({
                        title: "",
                        summary: "",
                        content: "",
                        attachmentUrl: "",
                        attachmentLabel: "",
                        order: module.lessons.length,
                        status: "DRAFT",
                      });
                    });
                  }}
                >
                  <h4 className="studio-subtitle">
                    {editingLesson && lessonTarget === module.id
                      ? "Editar aula"
                      : "Nova aula"}
                  </h4>
                  <div className="content-fields">
                    <label>
                      Título da aula
                      <input
                        value={lessonForm.title}
                        required
                        maxLength={120}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            title: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Resumo
                      <input
                        value={lessonForm.summary}
                        maxLength={300}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            summary: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="wide">
                      Conteúdo{" "}
                      <small>(parágrafos em branco separam blocos)</small>
                      <textarea
                        value={lessonForm.content}
                        rows={6}
                        maxLength={20000}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            content: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Material (endereço)
                      <input
                        value={lessonForm.attachmentUrl}
                        maxLength={300}
                        placeholder="/media/produtos/… ou https://…"
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            attachmentUrl: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Rótulo do material
                      <input
                        value={lessonForm.attachmentLabel}
                        maxLength={120}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            attachmentLabel: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Ordem
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={lessonForm.order}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            order: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <button className="button dark-button" disabled={busy}>
                      {busy
                        ? "Salvando…"
                        : editingLesson && lessonTarget === module.id
                          ? "Salvar aula"
                          : "Adicionar aula"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {!modules.length ? (
        <p className="studio-help">
          Ainda não há módulos. Comece pelo módulo de abertura da turma.
        </p>
      ) : null}
    </div>
  );
}
