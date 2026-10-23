import { getCatalog } from "@/lib/server";
import { ProductGrid } from "@/components/product-card";
export default async function Home() {
  const data = await getCatalog("featured=true&limit=4");
  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src="/static/design/banners/hero-jornada.webp"
          alt="Homem em uma trilha, contemplando montanhas ao amanhecer"
          fetchPriority="high"
          width="1536"
          height="1024"
        />
        <div className="hero-shade"></div>
        <div className="hero-content">
          <p className="eyebrow">
            <span className="line"></span> CADA DIA, UM NOVO CHAMADO
          </p>
          <h1>
            A JORNADA
            <br />
            FORJA O<br />
            <span>GUERREIRO.</span>
          </h1>
          <p className="hero-description">
            Fé para caminhar. Coragem para viver.
            <br />
            Essenciais que acompanham o seu propósito.
          </p>
          <a className="button cyan" href="/loja/">
            Explore a coleção <span>↗</span>
          </a>
        </div>
        <div className="hero-bottom">
          <span>01 — EQUIPADO PARA A VIDA</span>
          <span className="hero-coordinate">FÉ · CARÁTER · PROPÓSITO</span>
          <a href="#colecao" aria-label="Descer para coleção">
            ↓
          </a>
        </div>
        <span className="hero-side">A FORÇA COMEÇA POR DENTRO</span>
      </section>
      <div className="value-strip">
        <span>
          <b>01</b> MAIS QUE PRODUTOS. UM PROPÓSITO.
        </span>
        <span>
          <b>02</b> ESSENCIAIS PARA A SUA CAMINHADA.
        </span>
        <span>
          <b>03</b> DO PRIMEIRO PASSO AO LEGADO.
        </span>
      </div>
      <section id="colecao" className="section collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">ESCOLHAS COM SIGNIFICADO</p>
            <h2>
              Feitos para ir
              <br />
              <em>com você.</em>
            </h2>
          </div>
          <p>
            Na leitura que transforma.
            <br />
            No essencial que acompanha.
            <br />
            Naquilo que você escolhe viver.
          </p>
          <a className="text-link" href="/loja/">
            Ver toda a coleção <span>↗</span>
          </a>
        </div>
        <ProductGrid products={data.items} />
      </section>
      <section className="purpose">
        <div className="purpose-mark">
          <img
            src="/static/design/logos/simbolo-ciano.svg"
            alt=""
            width="300"
            height="360"
          />
          <span>O QUE NOS MOVE</span>
        </div>
        <div className="purpose-copy">
          <p className="eyebrow">NÃO É SÓ O QUE VOCÊ CARREGA.</p>
          <h2>
            É o que você
            <br />
            <em>carrega em si.</em>
          </h2>
          <p>
            Acreditamos na força de uma vida com propósito. Na fé que se traduz
            em atitude. E nos pequenos passos que constroem um legado.
          </p>
          <a className="text-link light" href="/sobre/">
            Conheça nosso propósito <span>↗</span>
          </a>
        </div>
        <span className="purpose-number">G / 01</span>
      </section>
      <section className="section categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">ENCONTRE O SEU PRÓXIMO PASSO</p>
            <h2>
              Uma coleção.
              <br />
              <em>Muitas jornadas.</em>
            </h2>
          </div>
          <a className="text-link" href="/loja/">
            Explore por categoria <span>↗</span>
          </a>
        </div>
        <div className="category-grid">
          <a className="category-tile" href="/loja/?categoria=vestuario">
            <img
              src="/static/design/mockups/camiseta.webp"
              alt="Camiseta conceitual Guerreiros"
              loading="lazy"
              width="700"
              height="750"
            />
            <div>
              <span>01 / VISTA O PROPÓSITO</span>
              <h3>
                Vestuário <b>↗</b>
              </h3>
            </div>
          </a>
          <a className="category-tile" href="/loja/?categoria=acessorios">
            <img
              src="/static/design/mockups/garrafa.webp"
              alt="Garrafa conceitual Guerreiros"
              loading="lazy"
              width="700"
              height="750"
            />
            <div>
              <span>02 / LEVE O ESSENCIAL</span>
              <h3>
                Essenciais <b>↗</b>
              </h3>
            </div>
          </a>
          <a className="category-tile" href="/loja/?categoria=kits">
            <img
              src="/static/design/mockups/kit.webp"
              alt="Kit conceitual de presente"
              loading="lazy"
              width="700"
              height="750"
            />
            <div>
              <span>03 / COMPARTILHE A JORNADA</span>
              <h3>
                Kits & presentes <b>↗</b>
              </h3>
            </div>
          </a>
        </div>
      </section>
      <section className="closing">
        <p className="eyebrow dark">CADA HOMEM UM GUERREIRO</p>
        <h2>
          O próximo passo
          <br />
          <em>é seu.</em>
        </h2>
        <a className="button dark-button" href="/loja/">
          Encontre o seu essencial <span>↗</span>
        </a>
        <div className="closing-stamp" aria-hidden="true">
          FÉ
          <br />
          EM
          <br />
          MOVIMENTO ↗
        </div>
      </section>
    </>
  );
}
