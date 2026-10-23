# Cada Homem Um Guerreiro — loja V1

Vitrine editorial, catálogo pesquisável, páginas de produto, sacola em sessão e administração autenticada. Infraestrutura própria; sem Supabase/Firebase. Checkout e integrações financeiras/logísticas ainda não estão ativos.

## Abrir a prévia

- Loja: http://127.0.0.1:8000/
- Gestão: http://127.0.0.1:8000/admin/
- Usuário local: `gestor`. A senha aleatória fica em `.local-admin.txt`, arquivo privado ignorado pelo Git. Não distribuir ou reutilizar em produção.

A prévia foi iniciada com Gunicorn na porta local 8000, usando estáticos compilados por `collectstatic`. Se o processo parar, execute `scripts/preview.sh` para iniciar em segundo plano. `scripts/start-local.sh` mantém a prévia no terminal. A aplicação não usa um bundler JavaScript: Django renderiza as páginas no servidor e WhiteNoise entrega os arquivos estáticos.

## Instalação e desenvolvimento

Python 3.12 ou superior. Para reexportar artes, instale também `requirements-design.txt` e bibliotecas Cairo do sistema; a aplicação não depende do exportador.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py createsuperuser
scripts/preview.sh
```

O seed é repetível sem sobrescrever produtos existentes e não cria usuários. Os quatro produtos são conceitos para revisão, com preços e estoque de demonstração. Livros e Bíblias estão previstos nas categorias, mas não foram inventadas capas ou fichas bibliográficas.

O ambiente local usa SQLite. Produção usa PostgreSQL próprio obrigatoriamente. Banco local, sessão, mídia e segredos não entram no Git. A `.dev-secret` é criada localmente com permissão restrita; não entra na imagem de produção.

## Cadastrar produtos

1. Entre em `/admin/` com o usuário local.
2. Abra Produtos → Adicionar produto.
3. Informe nome, endereço, SKU único, categoria e descrição.
4. Envie JPG/PNG/WebP até 5 MB e 20 megapixels; a imagem é recodificada para WebP, sem metadados originais.
5. Defina preço e estoque. Se houver variações, cadastre SKU, tamanho/cor, estoque e preço opcional em cada linha.
6. Marque “publicado” para aparecer na loja e “destaque na home” para entrar na coleção inicial. Produtos reais devem desmarcar “produto conceitual” após revisão.
7. Salve. O histórico registra o usuário e a mudança; confira “Ver no site”.

Crie contas individuais por `createsuperuser` ou pela área Usuários. Para equipe, use grupos e permissões de catálogo; não conceda superusuário indiscriminadamente. Excluir categoria em uso é impedido. Imagens antigas não são apagadas automaticamente: retenção/limpeza deve ser controlada junto aos backups.

## Validação

```bash
.venv/bin/python manage.py check
.venv/bin/python manage.py test
.venv/bin/python manage.py makemigrations --check --dry-run
.venv/bin/python manage.py collectstatic --noinput
```

Os testes verificam autorização/CSRF, cadastro e edição administrativa, auditoria, preço calculado no servidor, estoque, variação de outro produto, upload e escape de conteúdo. Não substituem homologação de PostgreSQL, Docker, DNS, TLS, restauração e PSP reais.

## Implantação em infraestrutura própria

Os arquivos `Dockerfile`, `compose.yaml` e `deploy/Caddyfile` são a base de implantação, ainda sem execução Docker neste ambiente. Não há Docker instalado aqui.

1. Prepare um host Linux com Docker Compose, DNS apontado e firewall (80/443, administração do host restrita).
2. Copie `.env.example` para `.env`; gere valores fortes e diferentes para chave Django, senha PostgreSQL da aplicação e senha PostgreSQL de bootstrap. Nunca use os dados locais.
3. Revise versões/digests de contêiner, patches, recursos e armazenamento. O bootstrap usa `guerreiros_bootstrap`; o script `deploy/postgres/01-app-user.sh` cria um usuário separado sem superusuário para a aplicação. A senha de bootstrap não é passada ao contêiner da app. O script só roda em volume vazio; volumes existentes exigem ajuste supervisionado. A aplicação também executa migrações com seu papel; separar papel de DDL e runtime é evolução recomendada. O Compose inicial exige homologação, não representa hardening concluído.
4. Execute `docker compose build`, `docker compose up -d db`, `docker compose run --rm app python manage.py migrate` e `docker compose run --rm app python manage.py createsuperuser`.
5. Execute `docker compose run --rm app python manage.py check --deploy` e revise todos os avisos no contexto do proxy. HSTS fica desativado até validar domínio, TLS e subdomínios; não ativar preload sem estudo.
6. Execute `docker compose up -d`. Não execute o seed em produção se não quiser conceitos publicados.
7. Teste login, upload, edição e persistência após reiniciar; configure MFA/SSO ou VPN para o admin, SMTP, monitoramento e restauração de backup antes de exposição comercial.

A app não publica sua porta no Compose; PostgreSQL fica em rede interna. Caddy serve mídia sem execução. Configuração financeira e frete continuam indisponíveis até implementação, sandbox e revisão.

## Arquivos

- `docs/01-arquitetura-e-plano.md`: decisões, fronteiras, dados, riscos, operação e etapas.
- `docs/02-identidade-visual.md`: direção e regras visuais.
- `SKILLS-SELECIONADAS.md`: 17 skills pesquisadas com origem e uso.
- `design/`: matriz, logos, ícones, favicons, mockups, banners e anúncios.
- `static/`: somente arquivos destinados à interface pública.
- `shop/`: catálogo, administração, carrinho, formulários e testes.

## Limites atuais

Não há cobrança, pedidos finais, reserva concorrente de estoque, frete, nota fiscal, recuperação por e-mail, MFA próprio ou telemetria externa. Não lançar comercialmente antes da fase de homologação descrita na arquitetura. Ainda não há migração/compatibilidade de um catálogo anterior, pois nenhum sistema anterior foi fornecido.

## Coleção baseada no PDF

Para restaurar o cadastro dos dois modelos adicionais na prévia local, execute `.venv/bin/python manage.py add_pdf_collection`. O comando usa os arquivos locais de `design/mockups/colecao-pdf/` e `design/estampas-originais/`, cria a galeria em mídia e preserva os produtos e configurações existentes. Depois execute `scripts/preview.sh` para coletar os estáticos e atualizar o processo.

## Catálogo da imagem da loja

Foram acrescentados 16 produtos únicos identificados na montagem: sete livros (incluindo Líderes que Transbordam, listado no filtro/lombada), duas Bíblias, três camisetas, caneca, garrafa 750 ml, caderno e kit presente. Os seis produtos anteriores foram preservados.

Para recriar esses cadastros localmente: `.venv/bin/python scripts/export_reference_catalog.py`, `.venv/bin/python manage.py add_reference_catalog` e `scripts/preview.sh`. O comando não sobrescreve edições de registros existentes. A listagem exibe até 24 itens por página. Detalhes e origem dos preços em `docs/04-produtos-da-referencia.md`.
