import Link from "next/link";
import type { TurmaOverview } from "@guerreiros/contracts";
import { authedApi } from "@/lib/server";
import { MyTurmas } from "@/components/turmas-my";
import "@/app/turmas.css";

export const metadata = {
  title: "Minhas turmas",
  robots: { index: false, follow: false },
};

export default async function MinhasTurmasPage() {
  let overview: TurmaOverview | null = null;
  try {
    overview = await authedApi<TurmaOverview>("turmas/overview");
  } catch {
    overview = null;
  }
  if (!overview)
    return (
      <section className="ambiente-locked">
        <p className="eyebrow dark">ÁREA DO GUERREIRO</p>
        <h1>
          Entre com a sua
          <br />
          <em>conta de guerreiro.</em>
        </h1>
        <p>
          Solicitações de interesse, matrículas e o ambiente das turmas ficam
          vinculados à sua conta. Ainda não tem conta? Crie em um minuto.
        </p>
        <div className="ambiente-locked-actions">
          <Link
            className="button dark-button"
            href={"/entrar/?next=" + encodeURIComponent("/minhas-turmas/")}
          >
            Entrar ou criar conta <span>↗</span>
          </Link>
          <Link className="text-link" href="/turmas/">
            Conhecer as turmas <span>↗</span>
          </Link>
        </div>
      </section>
    );
  return <MyTurmas initial={overview} />;
}
