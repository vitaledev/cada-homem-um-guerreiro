# Validação da migração — 22/10/2026

- Build de produção concluído para contratos TypeScript, API NestJS e frontend Next.js standalone.
- Verificação TypeScript aprovada nos três pacotes; formatação Prettier aprovada.
- Nove testes de integração da API aprovados em banco isolado: catálogo/rascunhos, CSRF/origem/autorização, cookies/login/logout, compatibilidade PBKDF2, preços/estoque/variantes no carrinho, administração/auditoria, upload raster, integridade de categorias/preços e limitação de login.
- Comparação da API publicada com a exportação privada: todos os 22 IDs, SKUs, preços, estoques e contagens de variantes/galerias preservados; cinco categorias importadas.
- Todas as 26 imagens distintas do catálogo/galerias retornaram HTTP 200.
- Início, catálogo, produto, carrinho e admin retornaram HTTP 200 na prévia compilada em 127.0.0.1:8000.
- CSP da página inicial contém nonce correspondente ao HTML renderizado.
- Login do administrador existente validado no navegador; painel lista os 22 produtos. Sessão continuou válida após reiniciar a API.
- Identidade e layout observados no navegador. Registros: `preview-next-home.png` e `preview-next-admin.png`.

O processo Django foi parado; o código anterior e seu banco foram arquivados em `legacy/django/`. O banco da nova versão fica separado, em `data/next-nest.sqlite`; a mídia existente permanece em `media/`.

Limites: Docker e PostgreSQL não estão instalados neste ambiente. Migrations PostgreSQL, imagens de container, proxy HTTPS e restauração de backup precisam de homologação na infraestrutura de destino. Pagamentos e frete continuam fora da prévia funcional.
