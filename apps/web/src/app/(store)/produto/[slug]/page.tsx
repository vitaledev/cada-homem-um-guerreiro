import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getCatalog } from "@/lib/server";
import { brl } from "@/lib/format";
import { Gallery, BuyForm } from "@/components/product-interactions";
import { ProductGrid } from "@/components/product-card";
import { isBook, officialBookUrl } from "@/lib/commerce";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug).catch(() => null);
  return { title: p?.title || "Produto não encontrado" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p;
  try {
    p = await getProduct(slug);
  } catch (error) {
    if ((error as Error).message === "NOT_FOUND") notFound();
    throw error;
  }
  const related = (
    await getCatalog("categoria=" + p.category.slug + "&limit=5")
  ).items
    .filter((r) => r.id !== p.id)
    .slice(0, 4);
  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Início</Link> /{" "}
        <Link href={"/loja/?categoria=" + p.category.slug}>
          {p.category.name}
        </Link>{" "}
        / {p.title}
      </div>
      <section className="product-detail">
        <Gallery product={p} />
        <div className="product-info">
          <p className="eyebrow dark">{p.category.name} / GUERREIROS</p>
          <h1>{p.title}</h1>
          <p className="detail-subtitle">{p.subtitle}</p>
          <div className="detail-price">
            <strong>{brl(p.priceCents)}</strong>
            {p.comparePriceCents ? <del>{brl(p.comparePriceCents)}</del> : null}
          </div>
          <div className="product-description">
            {p.description.split(/\n\n+/).map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
          {p.conceptual ? (
            <p className="concept-note">
              Produto conceitual para revisão visual. Imagens, preço e
              disponibilidade são de demonstração.
            </p>
          ) : null}
          <BuyForm
            product={p}
            officialPurchaseUrl={
              isBook(p.category.slug) ? officialBookUrl(p.slug) : undefined
            }
          />
          {!isBook(p.category.slug) ? (
            <p className="concept-note">
              Este item é produzido sob demanda. A solicitação será confirmada
              pela equipe antes da produção e do envio.
            </p>
          ) : null}
          <div className="detail-promises">
            <p>Itens sob demanda entram na sacola e poderão ser finalizados no checkout futuro.</p>
            <p>SKU {p.sku}</p>
            <p>
              {p.variants.some((v) => v.stock > 0) ||
              (!p.variants.length && p.stock > 0)
                ? "Disponível na prévia"
                : "Indisponível no estoque"}
            </p>
          </div>
          <details open>
            <summary>Sobre este essencial</summary>
            <p>
              Uma peça da coleção Cada Homem Um Guerreiro. Confira os detalhes e
              as imagens antes de escolher.
            </p>
          </details>
          <details>
            <summary>Entrega e trocas</summary>
            <p>
              As condições comerciais e a integração de frete serão configuradas
              antes do lançamento. Esta prévia não recebe pagamentos.
            </p>
          </details>
        </div>
      </section>
      {related.length ? (
        <section className="section">
          <div className="section-heading">
            <h2>
              Na mesma
              <br />
              <em>direção.</em>
            </h2>
            <Link className="text-link" href="/loja/">
              Explore a coleção ↗
            </Link>
          </div>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </>
  );
}
