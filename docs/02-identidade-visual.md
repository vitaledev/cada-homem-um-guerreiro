# Guerreiros — identidade visual e sistema de design

22/10/2026 · Direção V1: **Força serena / equipamento para a jornada**.

## Origem e preservação

O símbolo G em escudo e o lettering Cada Homem Um Guerreiro vêm dos arquivos de impressão fornecidos. Preservar a geometria vetorial extraída, sem redesenhar o símbolo por IA. O PDF apresenta branco, azul muito escuro e ciano; os valores digitais abaixo são aproximações da conversão do material, não especificações oficiais de impressão. Arquivos EPS/PDF originais são matrizes e ficam preservados.

A referência de loja organiza categorias e produtos com clareza. A evolução proposta dá mais espaço à marca: direção editorial, composição assimétrica, grandes fotografias, alternância entre fundos claros e azul escuro, títulos de forte presença e uma linguagem de jornada e propósito. O catálogo continua previsível e fácil de comprar.

## Sistema visual

| Token | Valor inicial | Papel |
|---|---|---|
| ink | #191e37 | fundo institucional e títulos |
| deep | #08151b | contraste fotográfico |
| cyan | #73d4e7 | acento e assinatura da marca |
| paper | #f5f3ed | fundo editorial |
| white | #ffffff | superfícies e marca negativa |
| text | #182329 | leitura |
| muted | #58666c | informação secundária |
| line | #d8ddd9 | separadores |

Ciano em fundo escuro; botões claros com texto escuro. Não usar ciano claro para texto pequeno sobre branco. Medir contraste na implementação. Paleta operacional de sucesso/erro só com rótulo e ícone além da cor.

Tipografia: lettering original reservado à marca; Manrope para interface e Oswald para títulos de impacto, servidas localmente com licença OFL incluída e fallback de sistema; sem CDN. Títulos condensados em caixa alta como direção, sem reproduzir a marca com uma fonte aproximada. Escala fluida: hero 48–100 px, título 32–56 px, seção 24–36 px, corpo 16–18 px, informações auxiliares >= 12 px. Fontes adicionais exigem arquivo e licença antes de distribuição.

Grade: limite 1440 px, margens 20 px no mobile e 48–64 px no desktop; espaçamento base 4/8 px. Raios discretos de 4–12 px; botões retangulares de 48 px de altura; sombras leves apenas em superfícies elevadas. Fotografia deve dar profundidade, sem excesso de cartões arredondados. Motion entre 160–280 ms em hover/foco e entradas discretas; respeitar reduced-motion.

## Assinaturas da marca

- Horizontal original: leitura completa no rodapé, banners e materiais institucionais.
- Símbolo isolado: favicon, avatar e espaços reduzidos.
- Versões branca, azul escuro e ciano: sempre derivadas dos mesmos paths.
- Área de proteção mínima proposta: 1/4 da largura do escudo ao redor. Não distorcer, inclinar ou adicionar contorno/sombra.
- Logo não deve funcionar como título de todas as seções; marca presente com parcimônia.

## Direção de fotografia e mockups

Luz lateral natural ou de estúdio, sombras profundas, tecido real, papel texturizado, metal fosco. Acessórios e roupas sobre pedra escura, madeira ou fundo neutro quente. Pessoas com postura natural, caminhada e contemplação. Evitar fantasia militar, armamento, musculatura exagerada e excesso de iconografia religiosa genérica. O leão da referência é linguagem inspiracional opcional, não parte oficial do logotipo.

Mockups são conceituais e não comprovam material, acabamento, dimensão ou disponibilidade. Não recriar capas de livros publicados sem arte autorizada. Para o lançamento conceitual, usar caderno genérico, camiseta e kit presente com o escudo fornecido. Capa definitiva e especificações dependem do catálogo real.

## Peças e organização

`design/` reúne:

- `logos/`: SVGs fiéis à matriz, versões positivas/negativas e PNGs.
- `icones/`: conjunto SVG consistente para menu, busca, sacola, seta e controles.
- `favicons/`: SVG, ICO e PNGs 16/32/180/192/512 px.
- `mockups/`: imagens conceituais de camiseta, garrafa, caderno e kit.
- `banners/`: hero desktop/mobile, campanha editorial e categoria.
- `anuncios/`: quadrado, feed 4:5 e story 9:16; fontes editáveis quando a peça é diagramada.
- `tokens/`: tokens digitais em JSON/CSS.
- `fontes/`: somente fontes com licença de distribuição; fallback definido no CSS.
- `originais/`: cópia preservada das matrizes.
- `prompts/`: especificações e histórico de geração de imagens.
- `preview/`: prancha visual e contato das peças para revisão.

## Composição por tela

Home: anúncio curto honesto → navegação escura → hero editorial com fotografia e headline → coleção → categorias → bloco institucional → kit presente → rodapé. Uma ação primária por seção. Não mostrar frete grátis, desconto ou parcelamento sem configuração real.

Catálogo: título e contexto editorial, categorias claras, número de itens, busca e ordenação; grade com imagens uniformes e preço legível. Mobile com duas colunas e filtros acessíveis.

Produto: galeria, categoria, título, descrição, preço, variante, quantidade e botão; disponibilidade real vinda do banco. Mockup com identificação conceitual até revisão. Sem avaliações ou urgência inventadas.

Admin: superfície clara, navegação com a marca, foco em legibilidade; formulários agrupam identificação, conteúdo, preços, mídia, estoque e publicação. Feedback de gravação acessível e histórico por objeto.

## Critérios de revisão

Verificar símbolo idêntico à matriz; conteúdo legível em celular; espaço para títulos sem cobrir produtos; recortes específicos por formato; contraste; fundo transparente real nas exportações; nomes de arquivos previsíveis; ausência de marcas de terceiros inventadas. Todo mockup deve passar por revisão de fidelidade antes de anúncio comercial.

## Skills de apoio

frontend-design (direção e interface), storefront-best-practices (padrões de loja), web-design-guidelines (revisão), canvas-design (disponível para peças futuras) e imagegen (fotografia/mockups). Skills genéricas não substituem a identidade original nem a autorização do usuário para a direção proposta.
