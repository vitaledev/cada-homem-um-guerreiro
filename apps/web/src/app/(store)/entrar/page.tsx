import { Suspense } from "react";
import { SignIn } from "@/components/turmas-signin";
import "@/app/turmas.css";

export const metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  return (
    <section className="entrar-shell">
      <div className="entrar-card">
        <p className="eyebrow dark">CADA HOMEM UM GUERREIRO</p>
        <h1>
          Sua conta,
          <br />
          <em>sua jornada.</em>
        </h1>
        <p className="entrar-help">
          A conta é usada nas turmas: solicitações de interesse, matrículas e o
          ambiente exclusivo de encontros. A área de gestão da loja continua
          restrita aos gestores.
        </p>
        <Suspense fallback={<p className="entrar-help">Carregando…</p>}>
          <SignIn />
        </Suspense>
      </div>
    </section>
  );
}
