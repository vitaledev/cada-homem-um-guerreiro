# Skills selecionadas para o projeto Guerreiros

Pesquisa e download em 22/10/2026. **17 skills locais**, instaladas em `.agents/skills/`, disponíveis para descoberta pelo Codex no próximo turno. Os nomes de invocação podem diferir da pasta: React usa `vercel-react-best-practices` e composição usa `vercel-composition-patterns`.

Seleção por adequação ao projeto, origem primária, documentação prática, referências incluídas e complementaridade. Não é ranking universal nem certificação de segurança. Baixadas as pastas completas, preservando scripts e referências. Os scripts de terceiros não foram executados só por serem baixados. Não foi feita auditoria integral dos repositórios.

| Skill | Aplicação | Origem |
|---|---|---|
| [ab-testing](.agents/skills/ab-testing/SKILL.md) | Experimentos quando houver tráfego suficiente | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/ab-testing) |
| [analytics](.agents/skills/analytics/SKILL.md) | Plano de eventos e mensuração | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/analytics) |
| [canvas-design](.agents/skills/canvas-design/SKILL.md) | Peças gráficas e composição visual (opcional) | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/canvas-design) |
| [composition-patterns](.agents/skills/composition-patterns/SKILL.md) | Composição de componentes React | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns) |
| [conversion-tracking](.agents/skills/conversion-tracking/SKILL.md) | Confirmação e deduplicação de conversões | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/conversion-tracking) |
| [copywriting](.agents/skills/copywriting/SKILL.md) | Textos de produto e chamadas claras | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting) |
| [cro](.agents/skills/cro/SKILL.md) | Conversão e redução de atrito | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/cro) |
| [frontend-design](.agents/skills/frontend-design/SKILL.md) | Direção estética e interface com personalidade | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) |
| [react-best-practices](.agents/skills/react-best-practices/SKILL.md) | Desempenho de React/Next.js (ativa na arquitetura Next.js) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) |
| [schema](.agents/skills/schema/SKILL.md) | Dados estruturados reais de produtos | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/schema) |
| [security-best-practices](.agents/skills/security-best-practices/SKILL.md) | Segurança da aplicação e do painel | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices) |
| [security-threat-model](.agents/skills/security-threat-model/SKILL.md) | Modelagem formal futura, baseada em código | [openai/skills](https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model) |
| [seo-audit](.agents/skills/seo-audit/SKILL.md) | SEO técnico e conteúdo de comércio eletrônico | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit) |
| [site-architecture](.agents/skills/site-architecture/SKILL.md) | Navegação, hierarquia e URLs | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/site-architecture) |
| [storefront-best-practices](.agents/skills/storefront-best-practices/SKILL.md) | Catálogo, produto, sacola e checkout | [medusajs/medusa-agent-skills](https://github.com/medusajs/medusa-agent-skills/tree/main/plugins/ecommerce-storefront/skills/storefront-best-practices) |
| [web-design-guidelines](.agents/skills/web-design-guidelines/SKILL.md) | Acessibilidade, formulários e qualidade de UI | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) |
| [webapp-testing](.agents/skills/webapp-testing/SKILL.md) | Testes de navegação e interações | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) |

## Ordem sugerida

1. `site-architecture` e `storefront-best-practices`: fluxos e responsabilidades.
2. `frontend-design`: direção Guerreiros, respeitando o logo original.
3. `security-best-practices`: regras do framework em uso (NestJS/Express e Next.js na arquitetura vigente).
4. `web-design-guidelines` e `webapp-testing`: revisão e validação.
5. `seo-audit`, `schema`, `copywriting`, `cro`: descoberta e compra.
6. `analytics`, `conversion-tracking`, `ab-testing`: medir somente após definição da operação e consentimento.

`security-threat-model` fica reservada para uma modelagem formal futura, com confirmação do contexto; ela não foi usada para declarar a aplicação auditada. Skills de React agora são usadas na arquitetura vigente. Não foi instalada a `brand-guidelines` da Anthropic porque ela prescreve a marca Anthropic, que não serve como identidade Guerreiros. Skills de hospedagem de plataformas não foram incluídas como padrão porque a infraestrutura será própria.

A skill de geração de imagens do ambiente está em `/home/dev01/.codex/skills/.system/imagegen/SKILL.md`. Cópia de referência em `design/prompts/IMAGEGEN-SKILL-REFERENCIA.md`; não é duplicada no diretório de descoberta para evitar colisão de nomes. Ela foi usada com a ferramenta nativa, sem API paga configurada localmente.

O manifesto em `skills-provenance/manifest.json` contém fontes e hashes dos arquivos baixados. `main` é mutável; os hashes registram o conteúdo local, não uma alegação de commit exato ou revisão de segurança. Antes de atualizar, comparar diferenças e licenças. Dependências externas indicadas por skills não são automaticamente adotadas.

## Documentos do projeto

- [Arquitetura e execução](docs/01-arquitetura-e-plano.md)
- [Direção de identidade visual](docs/02-identidade-visual.md)
- [Kit visual](design/README.md)
- [Aplicação e execução](README.md)
