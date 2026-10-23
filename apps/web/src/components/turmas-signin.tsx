"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@guerreiros/contracts";
import { api } from "@/lib/browser";
import { useSession } from "./session";

export function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/minhas-turmas/";
  const router = useRouter();
  const { set } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(endpoint: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      set(await api<Session>(endpoint, "POST", body));
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="entrar-panel">
      <div className="entrar-tabs" role="tablist" aria-label="Acesso">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
        >
          Criar conta
        </button>
      </div>
      {mode === "login" ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            await submit("auth/login", {
              username: String(data.get("username")),
              password: String(data.get("password")),
            });
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
            <p className="turma-note bad" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button dark-button" disabled={busy} type="submit">
            {busy ? "Entrando…" : "Entrar"} <span>↗</span>
          </button>
        </form>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            await submit("auth/register", {
              username: String(data.get("username")),
              password: String(data.get("password")),
            });
          }}
        >
          <label>
            Usuário
            <input
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={150}
              pattern="[-\w.@+]{3,150}"
              title="De 3 a 150 caracteres: letras, números, ponto, @, +, _ ou -."
            />
          </label>
          <label>
            Senha <small>(mínimo de 8 caracteres)</small>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={200}
            />
          </label>
          {error ? (
            <p className="turma-note bad" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button dark-button" disabled={busy} type="submit">
            {busy ? "Criando…" : "Criar conta e continuar"} <span>↗</span>
          </button>
        </form>
      )}
      <p className="entrar-back">
        <Link href="/">← Voltar para a loja</Link>
      </p>
    </div>
  );
}
