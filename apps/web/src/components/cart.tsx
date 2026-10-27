"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Cart } from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { brl } from "@/lib/format";
import { useSession } from "./session";
export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useSession();
  useEffect(() => {
    api<Cart>("cart")
      .then(setCart)
      .catch((e) => setError(e.message));
  }, []);
  async function change(key: string, method: string, quantity?: number) {
    setBusy(true);
    setError("");
    try {
      setCart(
        await api<Cart>(
          "cart/" + encodeURIComponent(key),
          method,
          method === "PATCH" ? { quantity } : undefined,
        ),
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error ? (
        <p className="messages error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="section cart-layout">
        {!cart ? (
          <p role="status">Carregando sua sacola…</p>
        ) : cart.items.length ? (
          <>
            <div className="cart-list">
              {cart.items.map((item) => (
                <article className="cart-item" key={item.key}>
                  <Link href={"/produto/" + item.product.slug + "/"}>
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      width="160"
                      height="180"
                    />
                  </Link>
                  <div>
                    <span className="eyebrow dark">
                      {item.product.category.name}
                    </span>
                    <h2>
                      <Link href={"/produto/" + item.product.slug + "/"}>
                        {item.product.title}
                      </Link>
                    </h2>
                    {item.variant ? <p>{item.variant.name}</p> : null}
                    <p>{brl(item.priceCents)} por unidade</p>
                    {item.unavailable ? (
                      <p className="error">
                        Estoque alterado. Atualize a quantidade.
                      </p>
                    ) : null}
                    <form
                      className="cart-controls"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        change(item.key, "PATCH", Number(data.get("quantity")));
                      }}
                    >
                      <label>
                        <span className="sr-only">
                          Quantidade de {item.product.title}
                        </span>
                        <input
                          key={item.quantity}
                          type="number"
                          name="quantity"
                          defaultValue={item.quantity}
                          min="1"
                          max="20"
                          required
                        />
                      </label>
                      <button disabled={busy} type="submit">
                        Atualizar
                      </button>
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => change(item.key, "DELETE")}
                      >
                        Remover
                      </button>
                    </form>
                  </div>
                  <strong>{brl(item.subtotalCents)}</strong>
                </article>
              ))}
            </div>
            <aside className="cart-summary">
              <p className="eyebrow dark">RESUMO DA JORNADA</p>
              <h2>
                Seus próximos
                <br />
                essenciais.
              </h2>
              <div>
                <span>Subtotal</span>
                <strong>{brl(cart.totalCents)}</strong>
              </div>
              <p>
                Este pedido reúne produtos sob demanda. Frete e condições de
                pagamento serão configurados no checkout futuro.
              </p>
              <button className="button dark-button" disabled>
                Checkout futuro
              </button>
              <p className="concept-note">
                Os itens já podem ser adicionados à sacola. O pagamento será
                habilitado quando o checkout for publicado.
              </p>
              <Link className="text-link" href="/loja/">
                Continuar explorando ↗
              </Link>
            </aside>
          </>
        ) : (
          <div className="empty-state">
            <p className="eyebrow dark">TODO CAMINHO COMEÇA COM UMA ESCOLHA</p>
            <h2>
              Sua sacola está
              <br />
              pronta para a jornada.
            </h2>
            <p>Explore a coleção e encontre o que vai com você.</p>
            <Link className="button dark-button" href="/loja/">
              Conhecer a coleção ↗
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
