"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  Product,
  Category,
  Catalog,
  Session,
  ProductInput,
} from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { brl } from "@/lib/format";
import { useSession } from "./session";
import { AdminTurmas } from "./admin-turmas";
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const decimal = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");
function cents(value: string) {
  const clean = value.trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean))
    throw new Error("Informe o preço com até duas casas decimais.");
  const [whole, fraction = ""] = clean.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function AdminApp() {
  const { value, refresh, set } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("products");
  const [turmaParam, setTurmaParam] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [categoryEdit, setCategoryEdit] = useState<Category | null>(null);
  const [audit, setAudit] = useState<
    Array<{
      id: number;
      username: string;
      action: string;
      object: string;
      detail: string;
      createdAt: string;
    }>
  >([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  async function load(q = "") {
    const [data, cats] = await Promise.all([
      api<Catalog>("admin/products?limit=100&q=" + encodeURIComponent(q)),
      api<Category[]>("admin/categories"),
    ]);
    setProducts(data.items);
    setCategories(cats);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("aba") === "turmas") setTab("turmas");
    const turma = Number(params.get("turma"));
    if (turma) setTurmaParam(turma);
  }, []);
  useEffect(() => {
    if (value?.user) load().catch((e) => setError(e.message));
  }, [value?.user?.id]);
  if (!value?.user)
    return (
      <main className="admin-login">
        <Link href="/">
          <img
            src="/static/design/logos/logo-original.svg"
            width="290"
            height="65"
            alt="Cada Homem Um Guerreiro"
          />
        </Link>
        <div className="admin-login-card">
          <p className="eyebrow dark">ÁREA DE GESTÃO</p>
          <h1>
            Sua loja,
            <br />
            sob seu controle.
          </h1>
          <p>Entre com sua conta para gerenciar a coleção.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              const data = new FormData(e.currentTarget);
              try {
                set(
                  await api<Session>("auth/login", "POST", {
                    username: String(data.get("username")),
                    password: String(data.get("password")),
                  }),
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Usuário
              <input
                name="username"
                autoComplete="username"
                required
                maxLength={150}
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
              />
            </label>
            {error ? (
              <p className="admin-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="button dark-button" disabled={busy || !value}>
              {busy
                ? "Entrando…"
                : !value
                  ? "Conectando…"
                  : "Entrar na gestão ↗"}
            </button>
          </form>
          <Link href="/">← Voltar para a loja</Link>
        </div>
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/">
          <img
            src="/static/design/logos/logo-original.svg"
            alt="Guerreiros"
            width="210"
            height="48"
          />
        </Link>
        <p className="eyebrow">GESTÃO DA COLEÇÃO</p>
        <nav aria-label="Administração">
          {[
            ["products", "Produtos"],
            ["categories", "Categorias"],
            ["turmas", "Turmas"],
            ["audit", "Histórico"],
          ].map(([key, name]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={async () => {
                setTab(key);
                setEditing(undefined);
                setError("");
                if (key === "audit")
                  try {
                    setAudit(await api("admin/audit"));
                  } catch (e) {
                    setError((e as Error).message);
                  }
              }}
            >
              {name} <span>↗</span>
            </button>
          ))}
        </nav>
        <div className="admin-user">
          <span>{value.user.username}</span>
          <small>
            {value.user.role === "ADMIN"
              ? "Administrador"
              : "Editor de catálogo"}
          </small>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                set(await api<Session>("auth/logout", "POST"));
                setProducts([]);
                setEditing(undefined);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Encerrar sessão
          </button>
          <Link href="/">Ver a loja ↗</Link>
        </div>
      </aside>
      <main className="admin-main" id="conteudo">
        <header className="admin-heading">
          <div>
            <p className="eyebrow dark">GUERREIROS / GESTÃO</p>
            <h1>
              {editing !== undefined
                ? editing
                  ? "Editar produto"
                  : "Novo produto"
                : tab === "products"
                  ? "Sua coleção."
                  : tab === "categories"
                    ? "Categorias."
                    : tab === "turmas"
                      ? "As turmas."
                      : "Histórico."}
            </h1>
          </div>
          {tab === "products" && editing === undefined ? (
            <button
              className="button dark-button"
              onClick={() => {
                setEditing(null);
                setNotice("");
              }}
            >
              + Novo produto
            </button>
          ) : null}
        </header>
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
        {tab === "products" ? (
          editing !== undefined ? (
            <ProductEditor
              key={editing?.id || "new"}
              product={editing}
              categories={categories}
              onCancel={() => setEditing(undefined)}
              onSave={async (payload) => {
                const saved = await api<Product>(
                  "admin/products" + (editing ? "/" + editing.id : ""),
                  editing ? "PATCH" : "POST",
                  payload,
                );
                await load(query);
                setEditing(saved);
                setNotice(
                  "Produto salvo. As alterações já estão disponíveis na loja.",
                );
              }}
            />
          ) : (
            <>
              <form
                className="admin-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  load(query).catch((e) => setError(e.message));
                }}
              >
                <label>
                  Buscar por produto ou SKU
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome, descrição ou SKU"
                    maxLength={100}
                  />
                </label>
                <button className="button dark-button">Buscar</button>
              </form>
              <p className="admin-count">
                {products.length} produtos na seleção · preços e publicação sob
                seu controle
              </p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <button
                            className="admin-product"
                            onClick={() => {
                              setEditing(p);
                              setNotice("");
                            }}
                          >
                            <img
                              src={p.imageUrl}
                              alt=""
                              width="48"
                              height="58"
                            />
                            <span>
                              <strong>{p.title}</strong>
                              <small>{p.sku}</small>
                            </span>
                          </button>
                        </td>
                        <td>{p.category.name}</td>
                        <td>{brl(p.priceCents)}</td>
                        <td>
                          <span
                            className={
                              "admin-badge " + (p.active ? "published" : "")
                            }
                          >
                            {p.active ? "Publicado" : "Rascunho"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-link"
                            onClick={() => setEditing(p)}
                          >
                            Editar
                          </button>
                          <button
                            className="admin-link danger"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Excluir " +
                                    p.title +
                                    "? Esta operação remove o cadastro.",
                                )
                              )
                                return;
                              try {
                                await api("admin/products/" + p.id, "DELETE");
                                await load(query);
                                setNotice("Produto excluído.");
                              } catch (e) {
                                setError((e as Error).message);
                              }
                            }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!products.length ? (
                  <p className="empty-state">
                    Nenhum produto encontrado. Adicione um produto ou ajuste a
                    busca.
                  </p>
                ) : null}
              </div>
            </>
          )
        ) : null}
        {tab === "categories" ? (
          <>
            <section className="admin-panel">
              <h2>{categoryEdit ? "Editar categoria" : "Nova categoria"}</h2>
              <form
                key={categoryEdit?.id || "new-category"}
                className="admin-category-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  try {
                    await api(
                      "admin/categories" +
                        (categoryEdit ? "/" + categoryEdit.id : ""),
                      categoryEdit ? "PATCH" : "POST",
                      {
                        name: String(data.get("name")),
                        slug: String(data.get("slug")),
                        order: Number(data.get("order")),
                      },
                    );
                    setCategoryEdit(null);
                    await load(query);
                    setNotice("Categoria salva.");
                    form.reset();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label>
                  Nome
                  <input
                    name="name"
                    defaultValue={categoryEdit?.name || ""}
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Endereço
                  <input
                    name="slug"
                    defaultValue={categoryEdit?.slug || ""}
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  />
                </label>
                <label>
                  Ordem
                  <input
                    name="order"
                    type="number"
                    min="0"
                    max="999"
                    defaultValue={categoryEdit?.order || 0}
                    required
                  />
                </label>
                <button className="button dark-button">Salvar categoria</button>
                {categoryEdit ? (
                  <button
                    type="button"
                    className="admin-link"
                    onClick={() => setCategoryEdit(null)}
                  >
                    Cancelar
                  </button>
                ) : null}
              </form>
            </section>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Endereço</th>
                    <th>Ordem</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.slug}</td>
                      <td>{c.order}</td>
                      <td>
                        <button
                          className="admin-link"
                          onClick={() => setCategoryEdit(c)}
                        >
                          Editar
                        </button>
                        <button
                          className="admin-link danger"
                          onClick={async () => {
                            if (!confirm("Excluir a categoria " + c.name + "?"))
                              return;
                            try {
                              await api("admin/categories/" + c.id, "DELETE");
                              await load(query);
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        {tab === "turmas" ? (
          <AdminTurmas
            allowed={value.user.role === "ADMIN" && !!value.user.canManage}
            initialTurmaId={turmaParam}
          />
        ) : null}
        {tab === "audit" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString("pt-BR")}</td>
                    <td>{a.username}</td>
                    <td>{a.action}</td>
                    <td>{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!audit.length ? (
              <p className="empty-state">
                Ainda não há alterações registradas.
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
function ProductEditor({
  product,
  categories,
  onSave,
  onCancel,
}: {
  product: Product | null;
  categories: Category[];
  onSave: (p: ProductInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [p, setP] = useState({
    title: product?.title || "",
    slug: product?.slug || "",
    sku: product?.sku || "",
    categoryId: product?.categoryId || categories[0]?.id || 0,
    subtitle: product?.subtitle || "",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "/static/design/logos/simbolo-escuro.svg",
    imageAlt: product?.imageAlt || "",
    stock: product?.stock || 0,
    active: product?.active || false,
    featured: product?.featured || false,
    conceptual: product?.conceptual ?? true,
  });
  const [price, setPrice] = useState(decimal(product?.priceCents || 0));
  const [compare, setCompare] = useState(
    decimal(product?.comparePriceCents ?? null),
  );
  const [variants, setVariants] = useState(
    (product?.variants || []).map((v) => ({
      ...v,
      priceText: decimal(v.priceCents),
    })),
  );
  const [gallery, setGallery] = useState(product?.gallery || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File | undefined, additional = false) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ url: string }>("media/upload", "POST", form);
      if (additional)
        setGallery((g) => [
          ...g,
          {
            id: 0,
            url: result.url,
            alt: p.title || "Imagem adicional do produto",
            order: g.length,
          },
        ]);
      else setP({ ...p, imageUrl: result.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="admin-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSave({
            ...p,
            priceCents: cents(price),
            comparePriceCents: compare.trim() ? cents(compare) : null,
            variants: variants.map((v) => ({
              ...(v.id ? { id: v.id } : {}),
              name: v.name,
              sku: v.sku,
              stock: v.stock,
              priceCents: v.priceText.trim() ? cents(v.priceText) : null,
            })),
            gallery: gallery.map((g) => ({
              ...g,
              ...(!g.id ? { id: undefined } : {}),
            })),
          });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="admin-panel">
        <h2>Identificação</h2>
        <div className="admin-fields">
          <label className="wide">
            Nome do produto
            <input
              value={p.title}
              onChange={(e) =>
                setP({
                  ...p,
                  title: e.target.value,
                  slug:
                    !product && p.slug === slugify(p.title)
                      ? slugify(e.target.value)
                      : p.slug,
                })
              }
              required
              maxLength={160}
            />
          </label>
          <label>
            Endereço do produto
            <input
              value={p.slug}
              onChange={(e) => setP({ ...p, slug: e.target.value })}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              maxLength={180}
            />
          </label>
          <label>
            SKU
            <input
              value={p.sku}
              onChange={(e) => setP({ ...p, sku: e.target.value })}
              required
              maxLength={64}
            />
          </label>
          <label>
            Categoria
            <select
              value={p.categoryId}
              onChange={(e) =>
                setP({ ...p, categoryId: Number(e.target.value) })
              }
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subtítulo
            <input
              value={p.subtitle}
              onChange={(e) => setP({ ...p, subtitle: e.target.value })}
              maxLength={160}
            />
          </label>
          <label className="wide">
            Descrição
            <textarea
              value={p.description}
              onChange={(e) => setP({ ...p, description: e.target.value })}
              required
              rows={6}
              maxLength={20000}
            />
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>Preço e disponibilidade</h2>
        <div className="admin-fields">
          <label>
            Preço (R$)
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label>
            Preço anterior (opcional)
            <input
              inputMode="decimal"
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            />
          </label>
          <label>
            Estoque sem variação
            <input
              type="number"
              min="0"
              max="1000000"
              value={p.stock}
              onChange={(e) => setP({ ...p, stock: Number(e.target.value) })}
              required
            />
          </label>
        </div>
        <p className="admin-help">
          Quando houver variações, o estoque de cada variação é usado na sacola.
        </p>
        <div className="admin-checks">
          {[
            ["active", "Publicado"],
            ["featured", "Destaque na home"],
            ["conceptual", "Produto conceitual"],
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={p[key as "active" | "featured" | "conceptual"]}
                onChange={(e) => setP({ ...p, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <h2>Imagem principal</h2>
        <div className="admin-image-editor">
          <img
            src={p.imageUrl}
            alt={p.imageAlt || "Prévia do produto"}
            width="180"
            height="200"
          />
          <div>
            <label>
              Enviar imagem
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <p className="admin-help">
              JPG, PNG ou WebP · até 5 MB e 20 megapixels.
            </p>
            <label>
              Descrição da imagem
              <input
                value={p.imageAlt}
                onChange={(e) => setP({ ...p, imageAlt: e.target.value })}
                maxLength={180}
              />
            </label>
          </div>
        </div>
      </section>
      <section className="admin-panel">
        <h2>Variações</h2>
        {variants.map((v, i) => (
          <div className="admin-inline" key={i}>
            <label>
              Nome / tamanho / cor
              <input
                value={v.name}
                onChange={(e) =>
                  setVariants(
                    variants.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
                required
              />
            </label>
            <label>
              SKU
              <input
                value={v.sku}
                onChange={(e) =>
                  setVariants(
                    variants.map((x, j) =>
                      j === i ? { ...x, sku: e.target.value } : x,
                    ),
                  )
                }
                required
              />
            </label>
            <label>
              Estoque
              <input
                type="number"
                min="0"
                value={v.stock}
                onChange={(e) =>
                  setVariants(
                    variants.map((x, j) =>
                      j === i ? { ...x, stock: Number(e.target.value) } : x,
                    ),
                  )
                }
                required
              />
            </label>
            <label>
              Preço específico
              <input
                inputMode="decimal"
                value={v.priceText}
                onChange={(e) =>
                  setVariants(
                    variants.map((x, j) =>
                      j === i ? { ...x, priceText: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="admin-link danger"
              onClick={() => setVariants(variants.filter((_, j) => j !== i))}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className="admin-secondary"
          onClick={() =>
            setVariants([
              ...variants,
              {
                id: 0,
                name: "",
                sku: p.sku + "-" + (variants.length + 1),
                stock: 0,
                priceCents: null,
                priceText: "",
              },
            ])
          }
        >
          + Adicionar variação
        </button>
      </section>
      <section className="admin-panel">
        <h2>Galeria</h2>
        {gallery.map((g, i) => (
          <div className="admin-gallery-row" key={i}>
            <img src={g.url} alt={g.alt} width="75" height="75" />
            <label>
              Descrição
              <input
                value={g.alt}
                required
                onChange={(e) =>
                  setGallery(
                    gallery.map((x, j) =>
                      j === i ? { ...x, alt: e.target.value } : x,
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
                value={g.order}
                onChange={(e) =>
                  setGallery(
                    gallery.map((x, j) =>
                      j === i ? { ...x, order: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="admin-link danger"
              onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
            >
              Remover
            </button>
          </div>
        ))}
        <label>
          Adicionar imagem à galeria
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0], true)}
          />
        </label>
      </section>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="admin-actions">
        <button className="button dark-button" disabled={busy} type="submit">
          {busy ? "Salvando…" : "Salvar produto ↗"}
        </button>
        <button className="admin-secondary" type="button" onClick={onCancel}>
          Voltar à coleção
        </button>
        {product ? (
          <Link className="admin-link" href={"/produto/" + product.slug + "/"}>
            Ver no site ↗
          </Link>
        ) : null}
      </div>
    </form>
  );
}
