import Link from "next/link";
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <img
            className="footer-logo"
            src="/static/design/logos/logo-original.svg"
            alt="Cada Homem Um Guerreiro"
            width="300"
            height="63"
          />
          <p>
            Para a jornada que acontece
            <br />
            todos os dias.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link href="/loja/">A coleção</Link>
          <Link href="/loja/?categoria=livros">Leituras com propósito</Link>
          <Link href="/loja/?categoria=kits">Presentes que inspiram</Link>
        </div>
        <div>
          <h2>Guerreiros</h2>
          <Link href="/sobre/">Nosso propósito</Link>
          <Link href="/turmas/">As turmas</Link>
          <Link href="/minhas-turmas/">Minhas turmas</Link>
          <Link href="/carrinho/">Sua sacola</Link>
          <Link href="/admin/">Área de gestão ↗</Link>
        </div>
        <div className="footer-manifesto">
          <span className="eyebrow">UM CHAMADO. UMA JORNADA.</span>
          <p>
            Firme na fé.
            <br />
            Presente na vida.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Cada Homem Um Guerreiro.</span>
        <span>Prévia de desenvolvimento · Produtos e valores conceituais.</span>
        <Link href="/admin/">Administração</Link>
      </div>
    </footer>
  );
}
