import Link from "next/link";
import { getCatalog, getCategories } from "@/lib/server";
import { ProductGrid } from "@/components/product-card";
export const metadata = { title: "A coleção" };
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 100) : "";
  const categoria = typeof raw.categoria === "string" ? raw.categoria : "";
  const ordem = typeof raw.ordem === "string" ? raw.ordem : "novidades";
  const pagina = typeof raw.pagina === "string" ? raw.pagina : "1";
  const query = new URLSearchParams({ q, categoria, ordem, pagina });
  const [data, categories] = await Promise.all([
    getCatalog(query.toString()),
    getCategories(),
  ]);
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow dark">GUERREIROS / A COLEÇÃO</p>
        <h1>
          Equipe a sua
          <br />
          <em>jornada.</em>
        </h1>
        <p>Escolhas que acompanham a vida com propósito.</p>
      </section>
      <section className="section catalog-section">
        <form id="busca" className="catalog-filters" method="get">
          <label>
            Buscar na coleção
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="O que acompanha a sua jornada?"
              maxLength={100}
            />
          </label>
          <label>
            Categoria
            <select name="categoria" defaultValue={categoria}>
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordenar por
            <select name="ordem" defaultValue={ordem}>
              <option value="novidades">Mais recentes</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
              <option value="nome">Nome</option>
            </select>
          </label>
          <button className="button dark-button" type="submit">
            Filtrar ↗
          </button>
        </form>
        <div className="catalog-caption">
          <span>
            {data.total} produto{data.total !== 1 ? "s" : ""} encontrado
            {data.total !== 1 ? "s" : ""}
          </span>
          <Link href="/loja/">Limpar filtros</Link>
        </div>
        {data.items.length ? (
          <ProductGrid products={data.items} />
        ) : (
          <div className="empty-state">
            <h2>Nenhum essencial por aqui.</h2>
            <p>
              Tente outra palavra ou remova os filtros para explorar a coleção.
            </p>
            <Link className="button dark-button" href="/loja/">
              Ver todos os produtos ↗
            </Link>
          </div>
        )}
        {data.pages > 1 ? (
          <nav className="pagination" aria-label="Páginas">
            {data.page > 1 ? (
              <Link
                href={
                  "?" +
                  new URLSearchParams({
                    ...Object.fromEntries(query),
                    pagina: String(data.page - 1),
                  })
                }
              >
                ← Anterior
              </Link>
            ) : null}
            <span>
              {data.page} / {data.pages}
            </span>
            {data.page < data.pages ? (
              <Link
                href={
                  "?" +
                  new URLSearchParams({
                    ...Object.fromEntries(query),
                    pagina: String(data.page + 1),
                  })
                }
              >
                Próxima →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </>
  );
}
