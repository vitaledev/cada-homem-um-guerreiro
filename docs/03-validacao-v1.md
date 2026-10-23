> Documento histórico da V1 Django. A arquitetura vigente e os critérios da migração estão em `05-arquitetura-next-nest.md` e no README da raiz.

# Validação da V1

22/10/2026. Ambiente local Linux; Django 5.2.18 e Python 3.12; SQLite de desenvolvimento; Gunicorn ligado apenas a 127.0.0.1:8000. Não houve deploy remoto.

## Verificações concluídas

- `manage.py check`: sem problemas.
- `manage.py makemigrations --check --dry-run`: sem alterações pendentes.
- `manage.py test`: 10 testes aprovados. Abrangem escape de texto, produtos não publicados, preço recalculado e preço adulterado, limites/estoque, vínculo de variante, CSRF, permissões administrativas, cadastro/edição e auditoria, upload e recodificação de raster, cabeçalhos e bloqueio de tentativas de login, busca e remoção de carrinho.
- `manage.py collectstatic --noinput`: estáticos coletados e pós-processados para servir a interface com Gunicorn/WhiteNoise.
- `manage.py check --deploy` com configuração de produção efêmera: um aviso de HSTS. A opção permanece desativada até validar TLS/domínio e implicações nos subdomínios; não foi silenciada. Não houve conexão a PostgreSQL nessa verificação.

## Conferência no navegador

Home renderizada com logo original, fontes locais, hero e navegação. Catálogo exibiu os quatro conceitos. Página de Caderno Propósito apresentou imagem, preço, aviso conceitual e botão. Adição à sacola resultou em subtotal de R$ 69,90; remoção retornou ao estado vazio. Login no admin local aceitou a credencial gerada e mostrou produtos cadastrados. O cadastro e a edição completos no admin foram exercitados em teste isolado com auditoria.

Prancha de mockups/anúncios inspecionada. Logo vetorial/PNG inspecionado e exportado com transparência. Ajustada a incorporação do logo nas peças SVG. Ajustado contraste do painel no tema escuro. Desktop foi conferido visualmente; CSS responsivo foi implementado, mas não há certificação de compatibilidade entre dispositivos ou auditoria WCAG completa.

## Não verificado em infraestrutura real

Docker não está instalado no ambiente desta tarefa; o build da imagem, inicialização PostgreSQL, permissões dos volumes, DNS, TLS, firewall, restauração de backup e comunicação externa precisam de homologação. Não se afirma que esses controles foram testados em produção. `compose.yaml` separa bootstrap do banco e usuário da aplicação, sem expor porta do banco; validar comportamento no host real.

MFA/VPN, e-mail transacional, PSP, frete, fiscal, pedidos e reservas concorrentes estão previstos na arquitetura e não implementados nesta V1. Checkout permanece bloqueado. Não há alegação de auditoria de segurança completa ou prontidão para venda real.

## Acompanhar e refinar

Acesse http://127.0.0.1:8000/ para acompanhar. Abra http://127.0.0.1:8000/admin/ para gerir produtos. O usuário local `gestor` tem senha no arquivo privado `.local-admin.txt`. Não reutilizar credenciais nem o banco local em produção.

A imagem `preview-home.png` registra a home da V1. A interface ativa é a referência para os próximos refinamentos.
