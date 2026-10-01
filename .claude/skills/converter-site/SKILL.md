---
name: converter-site
description: Converte um site antigo baixado (HTML estático em inputs/site-download ou similar) para o template Astro + Tailwind + Design System + Cloudflare deste repositório — extrai design tokens, modela content collections (content.config.ts), recompõe as páginas com os componentes atômicos, aplica SEO técnico e verifica visualmente o resultado contra o original. Use sempre que o usuário pedir para converter, migrar, portar, importar ou "trazer para o template" um site existente/baixado/legado, mesmo que não diga "skill" nem "Astro" (ex.: "migra o site do cliente", "passa esse site antigo pro nosso padrão", "convert the downloaded site").
---

# Converter site legado → template Astro

Esta skill transforma um site baixado (HTML/CSS/imagens) em um site construído sobre a arquitetura deste template. O objetivo **não** é redesenhar nem melhorar o site: é reconstruí-lo sobre uma base disciplinada (design system + componentes + conteúdo estruturado + SEO), para que evoluções futuras sejam fáceis e globais.

Critério de sucesso: o site novo é **visualmente semelhante** ao original (não precisa ser pixel-perfect), todas as rotas e todo o texto do original existem, e o código segue a arquitetura do template — tokens semânticos, componentes reutilizáveis, conteúdo em collections, metadados corretos.

## Princípios (leia antes de começar)

- **Conversão, não criação.** Copie textos literalmente (inclusive erros de digitação óbvios só se corrigir mudaria o sentido — na dúvida, preserve). Não escreva conteúdo novo, não "melhore" copy, não adicione seções. Se algo está faltando no input (link quebrado, post sem artigo, formulário sem backend), registre no relatório final como lacuna em vez de inventar.
- **Semelhante > idêntico.** Adaptações de design são permitidas quando o design system pede (ex.: unificar 5 tons de cinza quase iguais em 2 tokens), mas cada adaptação visível deve ser consciente e anotada no relatório. O rigor do design system é o que justifica a diferença.
- **Tudo passa pelo design system.** Nenhuma cor hex/arbitrária em componentes ou páginas (`bg-[#6FA43A]` → `bg-primary`), e nem cores da paleta padrão do Tailwind (`text-white`, `bg-black/30`, `text-gray-500`) — viram tokens semânticos (`text-inverse`, `bg-scrim/30`, `text-muted-foreground`). Se uma cor do original não cabe em nenhum token, crie um token novo em `global.css` — nunca um valor solto.
- **Páginas são composição.** Um arquivo em `src/pages` importa layout + organisms e passa dados; markup de seção vive em componentes. Se duas páginas repetem a mesma estrutura, isso é um componente (ou uma rota dinâmica).
- **O boilerplate existente é descartável**, mas a arquitetura não: mantenha `src/components/{atoms,molecules,organisms}` (+ `index.ts`), `src/layouts/main.astro`/`head.astro`, os scripts de layout (dark mode, PostHog, query string), `animation-classes.ts` e a página `/design-system` (atualizada para os novos tokens/componentes).
- **Documentação atual do Astro.** O template usa uma versão recente do Astro (confira em `package.json`). Antes de usar uma API (content layer, `astro:assets`, Fonts API, `getStaticPaths`, redirects), consulte o MCP `astro-docs` (`search_astro_docs`) em vez de confiar na memória — APIs mudaram entre versões.

## Fluxo de trabalho

Siga as fases em ordem. Cada fase termina com um checkpoint verificável; não avance com o checkpoint quebrado. Crie uma todo list com as fases no início.

### Fase 0 — Preflight

1. Localize o input: `inputs/site-download/` (aceite variações como `inputs/site-dowload/`; se houver dúvida, liste `inputs/`). Procure também uma auditoria opcional (`inputs/site-audit/` com `audit.json`/`relatorio.md`) — ela traz títulos, metas e lacunas já mapeadas.
2. Leia o template: `package.json`, `astro.config.mjs`, `src/styles/global.css`, `src/components/*/index.ts` (e abra os componentes que parecem relevantes), `src/layouts/main.astro`, `src/layouts/head.astro`, `src/pages/design-system.astro`, `CLAUDE.md`.
3. Confirme que o MCP `astro-docs` responde e que há um navegador disponível (Chrome MCP) para a verificação visual. Se não houver navegador, avise o usuário que a verificação será apenas estrutural.
4. Rode `npm install` se `node_modules` não existir. Se o install falhar no meio (ex.: `EFTYPE` ao executar o binário do esbuild, `EPERM` ao remover pastas, módulos com arquivos faltando), o `node_modules` ficou parcial: apague-o inteiro e reinstale — consertar pacote a pacote não funciona.

Checkpoint: você sabe onde está o input, quantas páginas ele tem e qual o inventário de componentes do template.

### Fase 1 — Inventário

1. Rode o script de inventário (Node puro, sem dependências):
   ```
   node .claude/skills/converter-site/scripts/inventory.mjs <pasta-do-input> conversion/inventory.json
   ```
   Ele gera, por página: rota, `<title>`, meta description, canonical, OG, `lang`, headings h1–h3, imagens (+alt), links internos/externos, JSON-LD, contagem de palavras, esboço de seções (tag + classes + primeiro heading), e no nível do site: cores hex arbitrárias usadas em classes, fontes, CSS/JS referenciados, e links internos quebrados.
2. Gere dumps estruturais legíveis das páginas-tipo (o HTML exportado costuma ser minificado numa linha só):
   ```
   node .claude/skills/converter-site/scripts/condense.mjs <input>/index.html > conversion/dumps/index.txt
   ```
   Cada tag vira uma linha indentada com classes e atributos; o texto aparece em linhas `» ...`. É a fonte para mapear seções e extrair conteúdo literal (leia só o `<main>`: header/footer se repetem).
   Se o site é uma SPA exportada (React/Vue — `<div id="root">`, classes Tailwind/shadcn, `data-testid`), espere: tags `<head>` duplicadas (genéricas + da página; o inventário já escolhe as da página), JS do app ausente no download (formulários e interações sem comportamento) e estilos inline `opacity:1; transform:none` que são o estado final de animações de entrada.
3. Leia o `inventory.json` e produza `conversion/plan.md` curto com: mapa de rotas (URL original → arquivo Astro), entidades repetidas (candidatas a collections), seções repetidas entre páginas (candidatas a organisms), e comportamentos interativos observados.
4. Sirva o input e olhe as páginas-chave no navegador (home, uma página de cada tipo, contato), desktop e mobile, para entender comportamento (menu mobile, dropdowns, acordeões, carrosséis, botões flutuantes de WhatsApp, animações). Servidor estático sugerido: `npx --yes serve <pasta-do-input> -l 4322` em background. Se os caminhos de assets forem relativos e quebrarem em subrotas, anote.

Checkpoint: `conversion/inventory.json` e `conversion/plan.md` existem; todas as rotas do input estão no mapa.

### Fase 2 — Design system

Leia `references/design-system.md` e siga-o. Em resumo: extraia paleta, tipografia, raios, sombras e escala de espaçamento do original (preferindo estilos computados no navegador ao CSS bruto, que costuma conter muito CSS morto), mapeie para os tokens semânticos do template em `src/styles/global.css` (oklch, light + dark), configure as fontes via Fonts API do Astro, e atualize `/design-system` para refletir tokens e componentes novos.

Checkpoint: `npm run build` passa; `/design-system` renderiza com as cores/fontes do cliente; nenhuma cor arbitrária fora de `global.css`.

### Fase 3 — Arquitetura da informação

Leia `references/information-architecture.md`. Crie `src/content.config.ts` com collections para as entidades repetidas (serviços, projetos, posts, depoimentos, FAQs, áreas atendidas… o que o site realmente tiver) e `src/data/site.ts` (ou similar) para dados globais do negócio (nome, telefones, WhatsApp, e-mail, endereço, redes, horário, navegação). Transfira o conteúdo **literalmente** do HTML para os arquivos de dados. Imagens de conteúdo vão para `src/assets/` e são referenciadas pelo schema `image()`.

Para volume grande, escreva um script descartável `conversion/scripts/extract.mjs` que lê os dumps do `condense.mjs` e grava os arquivos das collections — é mais fiel que copiar à mão. Revise o resultado (campos vazios costumam indicar que o seletor pegou o nível errado da árvore).

Checkpoint: `npx astro sync` sem erros; contagem de entradas por collection bate com o inventário.

### Fase 4 — Componentes

Leia `references/components.md` (inclui as armadilhas de Tailwind que mais causaram divergência visual). Extraia os ícones SVG do original com `node .claude/skills/converter-site/scripts/icons.mjs <input> src/components/atoms/icons.ts` e renomeie os `custom-N`. Para cada tipo de seção do `plan.md`, escolha: usar um organism existente → estender variantes/props de um existente → criar novo. Header, footer, botão flutuante de WhatsApp e afins entram no layout. Componentes novos seguem as convenções (Props tipadas, `class` repassável, só tokens, exportados no `index.ts` da camada) e ganham um exemplo em `/design-system`.

### Fase 5 — Páginas

Recrie cada rota em `src/pages` preservando **exatamente** as URLs originais (inclusive barra final — veja `references/seo.md`). Entidades de collection viram rotas dinâmicas (`[slug].astro` + `getStaticPaths`) quando o original tinha uma página por item; listagens consultam `getCollection`. Substitua `src/pages/index.astro` do boilerplate pela home convertida. Use `<Image>`/`<Picture>` de `astro:assets` para imagens. Reproduza animações de entrada com as classes de `src/utils/animation-classes.ts` quando o original tinha efeito parecido; não invente animações.

Checkpoint: `npm run build` passa e o número de páginas geradas ≥ número de rotas do input.

### Fase 6 — SEO técnico

Leia `references/seo.md` e aplique: `site` no `astro.config.mjs`, `SITE_NAME`, `lang` correto, title/description/canonical/OG por página (vindos do original, sem duplicatas), JSON-LD, favicon, sitemap, `robots.txt`, alt text preservado, hierarquia de headings igual à do original.

### Fase 7 — Verificação

Leia `references/verification.md` e execute a verificação completa: build + `astro check`, paridade automática (`compare.mjs`: rotas, canonical, title, description, h1–h3, palavras, alts, JSON-LD), **altura de cada seção medida nos dois sites** em desktop e em 390px (é o detector mais sensível de divergência — iguala-se ao pixel quando a conversão está certa), screenshots lado a lado, interações e dark mode. Faça a verificação visual sobre o build de produção (`astro build` + `astro preview`), não sobre o dev server. Corrija as divergências relevantes e repita. Não declare a conversão concluída sem ter olhado os screenshots.

Por fim escreva `conversion/report.md` com:
- rotas convertidas (tabela original → novo, status);
- decisões de design system (tokens criados e de onde vieram);
- collections criadas e contagens;
- adaptações visuais intencionais e por quê;
- lacunas do input e TODOs (ex.: posts sem artigo, formulário sem endpoint, imagens de stock externas);
- resultado da verificação (build, check, paridade, screenshots revisados).

## Arquivos de referência

- `references/design-system.md` — extração de tokens, mapeamento semântico, fontes, dark mode.
- `references/information-architecture.md` — collections, schemas, dados globais, imagens.
- `references/components.md` — como mapear seções para atoms/molecules/organisms.
- `references/seo.md` — URLs, metadados, JSON-LD, sitemap/robots.
- `references/verification.md` — roteiro de verificação e critérios de "parecido o suficiente".
- `scripts/inventory.mjs` — inventário determinístico do input (também roda sobre `dist/`).
- `scripts/condense.mjs` — dump estrutural legível de uma página (fonte para mapear seções e extrair texto literal).
- `scripts/icons.mjs` — extrai os SVGs inline do original para `icons.ts` (usado pelo átomo `Icon`).
- `scripts/oklch.mjs` — hex → `oklch()` + contraste WCAG contra branco/preto.
- `scripts/compare.mjs` — paridade de rotas/títulos/headings/palavras entre original e novo.
