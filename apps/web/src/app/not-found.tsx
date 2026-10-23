import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section empty-state">
      <h1>Página não encontrada.</h1>
      <p>Explore a coleção para encontrar o seu próximo essencial.</p>
      <Link className="button dark-button" href="/loja/">
        Ver coleção ↗
      </Link>
    </main>
  );
}
