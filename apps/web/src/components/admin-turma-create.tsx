"use client";
import { useState } from "react";
import type {
  Turma,
  TurmaLeaderGrant,
  TurmaLevel,
} from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { BOOK_COVERS } from "@/lib/turma-cover";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const BOOK_TAGLINES: Record<TurmaLevel, string> = {
  1: "O chamado",
  2: "A formação",
  3: "A batalha",
  4: "O legado",
};

const defaultTitle = (level: TurmaLevel, date = "") => {
  const month = date ? Number(date.slice(5, 7)) - 1 : new Date().getMonth();
  return `Guerreiro ${level} · Turma de ${MONTHS[month] || MONTHS[new Date().getMonth()]}`;
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);

const toIso = (value: string) =>
  value ? new Date(value + "T12:00:00.000Z").toISOString() : null;

export function AdminTurmaCreate({
  turmas,
  leaders,
  onCreated,
}: {
  turmas: Turma[];
  leaders: TurmaLeaderGrant[];
  onCreated: (turma: Turma) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<TurmaLevel>(1);
  const [title, setTitle] = useState(defaultTitle(1));
  const [titleEdited, setTitleEdited] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [seats, setSeats] = useState("0");
  const [price, setPrice] = useState("");
  const [leaderUserId, setLeaderUserId] = useState("");
  const [status, setStatus] = useState<"OPEN" | "DRAFT">("OPEN");
  const [imageUrl, setImageUrl] = useState(BOOK_COVERS[1]);
  const [imageAlt, setImageAlt] = useState("");
  const [customImage, setCustomImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setLevel(1);
    setTitle(defaultTitle(1));
    setTitleEdited(false);
    setSubtitle("");
    setDescription("");
    setStartDate("");
    setSeats("0");
    setPrice("");
    setLeaderUserId("");
    setStatus("OPEN");
    setImageUrl(BOOK_COVERS[1]);
    setImageAlt("");
    setCustomImage(false);
    setError("");
  }
  function chooseBook(next: TurmaLevel) {
    setLevel(next);
    if (!titleEdited) setTitle(defaultTitle(next, startDate));
    if (!customImage) setImageUrl(BOOK_COVERS[next]);
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ url: string }>("media/upload", "POST", form);
      setImageUrl(result.url);
      setCustomImage(true);
      if (!imageAlt)
        setImageAlt(`Capa personalizada da turma Guerreiro ${level}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Informe o nome da turma.");
      return;
    }
    const cleanPrice = price.trim().replace(",", ".");
    if (cleanPrice && !/^\d{1,7}(\.\d{1,2})?$/.test(cleanPrice)) {
      setError("Investimento inválido. Use até duas casas decimais.");
      return;
    }
    const priceCents = cleanPrice ? Math.round(Number(cleanPrice) * 100) : 0;
    const seatsTotal = Number(seats);
    if (!Number.isInteger(seatsTotal) || seatsTotal < 0) {
      setError("Informe um número de vagas válido.");
      return;
    }
    const base = slugify(cleanTitle) || "turma";
    const taken = new Set(turmas.map((t) => t.slug));
    let slug = base;
    let suffix = 2;
    while (taken.has(slug)) slug = base + "-" + suffix++;
    setBusy(true);
    setError("");
    try {
      const created = await api<Turma>("turmas", "POST", {
        bookLevel: level,
        title: cleanTitle,
        slug,
        subtitle: subtitle.trim(),
        description: description.trim(),
        status,
        leaderUserId: leaderUserId ? Number(leaderUserId) : null,
        priceCents,
        seatsTotal,
        startDate: toIso(startDate),
        imageUrl,
        imageAlt: imageAlt.trim() || `Capa do livro Guerreiro ${level}`,
        items: [],
      });
      reset();
      setOpen(false);
      await onCreated(created);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <button
        className="turma-create-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">+</span>
        <span>
          <strong>Abrir nova turma</strong>
          <small>
            Escolha o livro e defina data, vagas e investimento em um só lugar.
          </small>
        </span>
      </button>
    );
  return (
    <section className="admin-panel turma-create">
      <header className="turma-create-head">
        <div>
          <p className="eyebrow dark">NOVO CURSO</p>
          <h2>Abrir nova turma</h2>
          <p className="admin-help">
            A capa do livro entra automaticamente e você pode personalizar. A
            turma abre com inscrições e pode ser editada a qualquer momento.
          </p>
        </div>
        <button
          className="admin-link"
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancelar
        </button>
      </header>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="turma-create-books" role="radiogroup" aria-label="Livro">
        {([1, 2, 3, 4] as TurmaLevel[]).map((book) => (
          <button
            key={book}
            type="button"
            role="radio"
            aria-checked={level === book}
            className={level === book ? "active" : ""}
            onClick={() => chooseBook(book)}
          >
            <img src={BOOK_COVERS[book]} alt="" width="180" height="135" />
            <span>
              <strong>Guerreiro {book}</strong>
              <small>{BOOK_TAGLINES[book]}</small>
            </span>
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="turma-create-body">
          <div className="turma-create-fields">
            <label className="wide">
              Nome da turma
              <input
                value={title}
                required
                maxLength={120}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleEdited(true);
                }}
              />
            </label>
            <label className="wide">
              Subtítulo
              <input
                value={subtitle}
                maxLength={160}
                placeholder="Uma frase curta sobre o encontro"
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </label>
            <label>
              Data do encontro
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!titleEdited)
                    setTitle(defaultTitle(level, e.target.value));
                }}
              />
            </label>
            <label>
              Vagas
              <input
                type="number"
                min="0"
                max="10000"
                step="1"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
              <small>Use 0 para não limitar as vagas.</small>
            </label>
            <label>
              Investimento (R$)
              <input
                value={price}
                inputMode="decimal"
                placeholder="0,00"
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label>
              Líder da turma
              <select
                value={leaderUserId}
                onChange={(e) => setLeaderUserId(e.target.value)}
              >
                <option value="">A definir pela gestão</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.userId}>
                    {leader.username}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Situação inicial
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "OPEN" | "DRAFT")}
              >
                <option value="OPEN">Abrir inscrições agora</option>
                <option value="DRAFT">Salvar como rascunho</option>
              </select>
            </label>
            <label className="wide">
              Descrição
              <textarea
                value={description}
                rows={4}
                maxLength={20000}
                placeholder="Como serão os encontros, o que o participante precisa saber…"
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
          <aside className="turma-create-cover">
            <p className="eyebrow dark">CAPA</p>
            <img
              src={imageUrl}
              alt={imageAlt || `Capa do livro Guerreiro ${level}`}
              width="260"
              height="195"
            />
            <label className="turma-create-upload">
              {uploading ? "Enviando…" : "Enviar capa personalizada"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading || busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <p className="admin-help">JPG, PNG ou WebP · até 5 MB.</p>
            {customImage ? (
              <button
                className="admin-link"
                type="button"
                onClick={() => {
                  setCustomImage(false);
                  setImageUrl(BOOK_COVERS[level]);
                }}
              >
                Usar a capa do livro
              </button>
            ) : null}
            <label>
              Descrição da imagem
              <input
                value={imageAlt}
                maxLength={180}
                placeholder={`Capa do livro Guerreiro ${level}`}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </label>
          </aside>
        </div>
        <div className="admin-actions turma-create-actions">
          <button className="button dark-button" type="submit" disabled={busy}>
            {busy
              ? "Salvando..."
              : status === "OPEN"
                ? "Abrir turma"
                : "Salvar rascunho"}{" "}
            <span>↗</span>
          </button>
          <button
            className="admin-secondary"
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Cancelar
          </button>
          <small className="admin-help">
            O endereço da turma é gerado a partir do nome e ajustado
            automaticamente para não repetir.
          </small>
        </div>
      </form>
    </section>
  );
}
