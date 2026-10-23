"use client";
import { useState } from "react";
import Link from "next/link";
import type { Category } from "@guerreiros/contracts";
import { useSession } from "./session";
export function Header({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const { value } = useSession();
  return (
    <>
      <a className="skip" href="#conteudo">
        Ir para o conteúdo
      </a>
      <div className="announcement">
        <span>FÉ QUE SE VIVE. PROPÓSITO QUE SE VESTE.</span>
        <Link href="/sobre/">
          Conheça o movimento <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <header className="header">
        <Link className="brand" href="/" aria-label="Guerreiros, início">
          <img
            src="/static/design/logos/simbolo-branco.svg"
            width="36"
            height="44"
            alt=""
          />
          <span>
            <small>CADA HOMEM UM</small>
            <strong>GUERREIRO</strong>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Principal">
          <Link href="/loja/">A coleção</Link>
          {categories.map((c) => (
            <Link key={c.id} href={"/loja/?categoria=" + c.slug}>
              {c.name}
            </Link>
          ))}
          <Link href="/turmas/">Turmas</Link>
        </nav>
        <div className="header-tools">
          <Link href="/loja/#busca" aria-label="Buscar produtos">
            <svg viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
          </Link>
          <Link
            className="bag-link"
            href="/carrinho/"
            aria-label={`Sacola, ${value?.cartCount || 0} itens`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 8h14l1 13H4L5 8Z M8 8V6a4 4 0 0 1 8 0v2" />
            </svg>
            <span aria-live="polite">{value?.cartCount || 0}</span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen(!open)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>
        </div>
      </header>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Menu móvel"
        hidden={!open}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <Link href="/loja/" onClick={() => setOpen(false)}>
          Toda a coleção
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={"/loja/?categoria=" + c.slug}
            onClick={() => setOpen(false)}
          >
            {c.name}
          </Link>
        ))}
        <Link href="/turmas/" onClick={() => setOpen(false)}>
          Turmas
        </Link>
        <Link href="/minhas-turmas/" onClick={() => setOpen(false)}>
          Minhas turmas
        </Link>
        <Link href="/sobre/" onClick={() => setOpen(false)}>
          Nosso propósito
        </Link>
      </nav>
    </>
  );
}
