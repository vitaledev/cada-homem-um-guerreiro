# Guerreiros — kit visual V1

Identidade baseada no PDF/EPS fornecido. Direção: força serena, fotografia editorial e tons escuros com ciano. Guia completo em `../docs/02-identidade-visual.md`.

| Pasta | Entrega |
|---|---|
| `originais/` | Matrizes EPS e PDF preservadas |
| `logos/` | Logo e símbolo extraídos em SVG com paths originais; versões original, branco, escuro e ciano; PNG transparente |
| `icones/` | 12 SVGs originais de interface, traço consistente e `currentColor` |
| `favicons/` | SVG, ICO e PNG 16/32/180/192/512 |
| `mockups/` | Camiseta, garrafa, caderno e kit; PNG e WebP |
| `banners/` | Hero fotográfico, peças desktop/mobile e kit presente, SVG/PNG |
| `anuncios/` | Feed 1080×1350, quadrado 1080×1080 e story 1080×1920, SVG/PNG |
| `fontes/` | Manrope e Oswald, arquivos locais e licenças OFL |
| `tokens/` | Paleta em JSON e CSS |
| `prompts/` | Prompts de imagem e referência da skill utilizada |
| `preview/` | Prancha de contato das peças para revisão |

O hero e os quatro mockups foram gerados com a ferramenta nativa de imagens, usando o símbolo original como referência nos mockups. Não são fotos de produtos físicos. A IA pode apresentar pequenas diferenças de impressão/perspectiva: revisar com o fabricante antes de uso comercial. Os vetores do logo são extrações determinísticas da matriz, sem redesenho por IA.

As peças diagramadas têm SVGs com fotografia incorporada e texto editável. As fontes de renderização dessas peças são DejaVu Sans, disponíveis no ambiente; Manrope/Oswald são usadas na interface. Logos brancos precisam de fundo escuro para visualização. Não existe manual oficial de cores enviado: tokens digitais são propostas aproximadas do material.

Para reexportar peças e copiar versões públicas para a aplicação:

```bash
.venv/bin/pip install -r requirements-design.txt
.venv/bin/python scripts/export_design.py
.venv/bin/python manage.py collectstatic --noinput
```

O script usa os PNGs locais; não chama serviços de IA nem exige chave de API. Foi usado Python apenas para exportação vetorial, formatos e prancha de QA; criação e edição fotográfica foram feitas pela ferramenta de imagem.

Não foram inventadas capas de livros publicados, avaliações ou preços oficiais. A marca fornecida deve ter sua titularidade/direitos confirmados pela empresa antes de anúncios. Não são incluídos assets de domínio ou perfil social ainda não definidos.

## Coleção do PDF de referência

Adicionados dois modelos: Camiseta Guerreiros — Estampa Original e Boné Guerreiros — Bordado Original. Quatro novos mockups (frente e costas de cada peça) estão em `mockups/colecao-pdf/`, com PNGs de origem e WebPs otimizados. Foram gerados pela ferramenta nativa de imagens a partir das páginas 6 e 7, com prompts registrados em `prompts/colecao-pdf.json`. Não são fotografias de peças fabricadas nem matrizes de impressão: usar sempre os vetores originais para produção.

`estampas-originais/` preserva renderizações dos layouts de camiseta e boné e exportações vetoriais das cinco páginas de artes. Os layouts originais também aparecem nas galerias do site para conferência.

Cadastro repetível, sem sobrescrever produtos anteriores: `.venv/bin/python manage.py add_pdf_collection`. A camiseta tem variações P/M/G/GG; o boné tem ajuste único; preço e estoque seguem demonstrativos. Os dois produtos podem ser editados no admin.

## Catálogo da montagem da loja

`mockups/catalogo-referencia/` contém 16 novos mockups em PNG e WebP. A prancha está em `preview/catalogo-referencia-contato.jpg`. Fonte, prompts e cadastro em `prompts/catalogo-referencia.json` e `catalogo-referencia.json`. As imagens seguem as cores, formas e produtos identificáveis da montagem; a capa de Líderes que Transbordam é uma proposta porque a capa frontal não aparece com nitidez. A camiseta Si Vis Pacem usa a frase identificada pela legenda, evitando reproduzir o texto distorcido do mockup de referência. Os arquivos são conceituais, não matrizes editoriais ou de impressão.
