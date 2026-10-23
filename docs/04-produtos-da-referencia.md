# Produtos da imagem de referência

16 produtos identificáveis cadastrados separadamente. Repetições nas áreas desktop/mobile da montagem são um só produto. Os seis cadastros anteriores permanecem preservados.

| Produto | Categoria | Preço de demonstração | Fonte do preço |
|---|---|---|---|
| Cada homem um guerreiro — Livro 3 | livros | R$ 59,90 | Valor legível na referência |
| Cada homem um guerreiro — Livro 1: Andar com Deus | livros | R$ 59,90 | Valor legível na referência |
| Cada homem um guerreiro — Livro 2 | livros | R$ 59,90 | Valor legível na referência |
| Homens de Impacto | livros | R$ 59,90 | Valor legível na referência |
| O Céu Invisível | livros | R$ 62,35 | Valor legível na referência |
| Tudo o que Jesus Ordenou | livros | R$ 84,90 | Valor legível na referência |
| Líderes que Transbordam | livros | R$ 59,90 | Proposta provisória; preço ausente/ilegível |
| Bíblia 365 NAA Guerreiros | biblias | R$ 119,90 | Valor legível na referência |
| Bíblia Guerreiros Personalizada | biblias | R$ 119,90 | Proposta provisória; preço ausente/ilegível |
| Camiseta Guerreiros — Logo Oficial | vestuario | R$ 69,90 | Valor legível na referência |
| Camiseta Guerreiros — Logo Minimal | vestuario | R$ 69,90 | Valor legível na referência |
| Camiseta Si Vis Pacem Para Bellum | vestuario | R$ 69,90 | Proposta provisória; preço ausente/ilegível |
| Caneca Guerreiros — Logo Oficial | acessorios | R$ 49,90 | Valor legível na referência |
| Garrafa Térmica Guerreiros 750 ml | acessorios | R$ 89,90 | Valor legível na referência |
| Caderno Guerreiros — Anotações e Propósito | acessorios | R$ 39,90 | Valor legível na referência |
| Kit Guerreiros — Presente com Propósito | kits | R$ 249,90 | Proposta provisória; preço ausente/ilegível |

As imagens são mockups gerados pela ferramenta nativa `image_gen`, não fotografias ou capas oficiais fornecidas por editoras. As capas identificáveis seguem os elementos visuais da montagem; Líderes que Transbordam usa uma proposta de capa porque somente o nome/lombada está identificável. Não se atribuem dados bibliográficos não fornecidos. A camiseta Si Vis Pacem usa o nome legível na legenda como texto, pois a tipografia da montagem está distorcida.

Arquivos: `design/mockups/catalogo-referencia/` (PNG e WebP); `design/prompts/catalogo-referencia.json` (prompts e fontes); `design/catalogo-referencia.json` (cadastros); `referencias/catalogo-produtos.png` (montagem original). As imagens são renderizadas com produto inteiro no card, sem cortes das capas ou estampas.

Reposição de ambiente local: `.venv/bin/python scripts/export_reference_catalog.py`, `.venv/bin/python manage.py add_reference_catalog`, `scripts/preview.sh`. O cadastro é repetível e preserva edições existentes. Todos os produtos são editáveis no admin. Preços, estoque, capa final e informações comerciais precisam de revisão da operação antes de venda.
