"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { brl } from "@/lib/format";
import { useSession } from "./session";
export function Gallery({ product: p }: { product: Product }) {
  const images = [
    { url: p.imageUrl, alt: p.imageAlt || p.title },
    ...p.gallery,
  ];
  const [current, setCurrent] = useState(0);
  return (
    <div className="product-gallery">
      <img
        className="detail-image"
        src={images[current].url}
        alt={images[current].alt}
        width="900"
        height="1000"
      />
      {images.length > 1 ? (
        <>
          <div className="gallery-thumbnails" aria-label="Imagens do produto">
            {images.map((image, i) => (
              <a
                key={image.url + "-" + i}
                className="gallery-thumb"
                href={image.url}
                aria-label={"Ver " + image.alt}
                aria-current={current === i ? "true" : undefined}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  setCurrent(i);
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  width="100"
                  height="100"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
          <p className="gallery-hint">
            Selecione uma imagem para ver os detalhes.
          </p>
        </>
      ) : null}
    </div>
  );
}
export function BuyForm({
  product: p,
  officialPurchaseUrl,
}: {
  product: Product;
  officialPurchaseUrl?: string;
}) {
  if (officialPurchaseUrl) {
    return (
      <div className="buy-form">
        <a
          className="button dark-button"
          href={officialPurchaseUrl}
          target="_blank"
          rel="noreferrer"
        >
          Comprar no site oficial <span>↗</span>
        </a>
        <p className="concept-note">
          A compra e a entrega deste livro são feitas pela loja oficial da RTM
          Brasil.
        </p>
      </div>
    );
  }
  const [variant, setVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { refresh } = useSession();
  return (
    <form
      className="buy-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api("cart", "POST", {
            productId: p.id,
            variantId: variant ? Number(variant) : null,
            quantity,
          });
          await refresh();
          router.replace("/carrinho/");
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {p.variants.length ? (
        <label>
          Escolha sua variação
          <select
            name="variant"
            required
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
          >
            <option value="">Selecione</option>
            {p.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.stock}>
                {v.name}
                {v.priceCents ? " · " + brl(v.priceCents) : ""}
                {!v.stock ? " · Esgotado" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="buy-controls">
        <label>
          Quantidade
          <input
            type="number"
            name="quantity"
            min="1"
            max="20"
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <button className="button dark-button" disabled={busy} type="submit">
          {busy ? "Adicionando…" : "Adicionar ao carrinho"} <span>↗</span>
        </button>
      </div>
      {error ? (
        <p className="concept-note error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
