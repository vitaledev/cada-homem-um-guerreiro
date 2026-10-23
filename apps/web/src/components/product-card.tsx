import Link from "next/link";
import type { Product } from "@guerreiros/contracts";
import { brl } from "@/lib/format";
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        className={
          "product-visual" +
          (/colecao-pdf|catalogo-referencia/.test(p.imageUrl)
            ? " product-visual-contained"
            : "")
        }
        href={"/produto/" + p.slug + "/"}
      >
        <img
          src={p.imageUrl}
          alt={p.imageAlt || p.title}
          loading="lazy"
          width="720"
          height="800"
        />
        {p.conceptual ? <span className="product-tag">CONCEITO</span> : null}
        <span className="card-arrow" aria-hidden="true">
          ↗
        </span>
      </Link>
      <div className="product-meta">
        <span>{p.category.name}</span>
        <span>GUERREIROS</span>
      </div>
      <Link className="product-title" href={"/produto/" + p.slug + "/"}>
        {p.title}
      </Link>
      <p className="product-subtitle">{p.subtitle}</p>
      <div className="product-price">
        <strong>{brl(p.priceCents)}</strong>
        {p.comparePriceCents ? <del>{brl(p.comparePriceCents)}</del> : null}
        <Link href={"/produto/" + p.slug + "/"} aria-label={"Ver " + p.title}>
          +
        </Link>
      </div>
    </article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
