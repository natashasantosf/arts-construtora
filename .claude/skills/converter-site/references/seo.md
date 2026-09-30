# SEO técnico na conversão

A conversão não pode custar posições no Google. A regra de ouro: **mesmas URLs, mesmos sinais, menos erros**. Aproveite para corrigir defeitos técnicos objetivos (tags duplicadas, canonical errado), mas não reescreva títulos e descrições — isso é trabalho de conteúdo, fora do escopo.

## URLs

- Cada rota do input existe no novo site com o **mesmo caminho**. Downloads de sites estáticos costumam ter `rota/index.html` → a URL pública é `/rota/` (com barra) ou `/rota` conforme o servidor original. Descubra o formato canônico olhando os `canonical` e os links internos do original (`inventory.json`) e configure `trailingSlash` e `build.format` no `astro.config.mjs` para reproduzi-lo (consulte `search_astro_docs("trailingSlash build.format")`).
- Se alguma URL precisar mudar (raro — só se a arquitetura exigir), adicione `redirects` no `astro.config.mjs` e registre no relatório.
- Links internos em componentes/dados devem usar o mesmo formato (com ou sem barra) para evitar redirecionamentos.
- **URLs sem barra final** (`/servicos/pintura-predial`): use `trailingSlash: "never"` + `build.format: "file"` (gera `servicos/pintura-predial.html`, que o Cloudflare serve exatamente nesse caminho). Atenção: com `format: "file"`, `Astro.url.pathname` vale `/servicos/pintura-predial.html` no build (e `/index.html` na home), mas não no dev. Qualquer coisa derivada dele — canonical, `og:url`, link ativo do menu — precisa passar por uma função que remova `.html`/`/index` (ex.: `src/utils/paths.ts → publicPath()`). Esse bug só aparece no build; o `compare.mjs` compara os canonicals e o pega.

## `astro.config.mjs` e ambiente

- `site`: o domínio de produção do original (do canonical ou do JSON-LD). Sem isso o sitemap e os canonicals ficam errados.
- `SITE_NAME` (`.env` e `.env.example`): o nome da marca como aparece no título do original. Confira como o `head.astro` monta o título (`"{title} | {siteName}"`) e ajuste para reproduzir o padrão de títulos do original — se o original usa títulos completos e únicos por página, passe o título completo e faça o `head.astro` não sufixar (ex.: prop `fullTitle`).

## `<head>` por página

Estenda `src/layouts/head.astro` (props, não markup por página) para cobrir o que o original tinha e o template ainda não:
- `<html lang>` do original (ex.: `pt-BR`) — no `main.astro`.
- `title` e `description` **exatamente** como no original (vêm do `inventory.json`; nas collections, via `seoTitle`/`seoDescription`).
- `canonical` absoluto e único (o `head.astro` já calcula a partir de `Astro.site`).
- Open Graph: `og:locale`, `og:title`, `og:description`, `og:image` (crie/copie uma imagem social para `public/` — use a imagem OG do original se existir; senão a do hero, e anote), `twitter:card`.
- `robots`: conservar `index, follow` nas páginas que o original indexava; `noindex` no `/design-system`.
- Remova duplicatas: sites exportados frequentemente têm dois `<title>`, dois `description` ou canonicals repetidos. Em SPAs exportadas, um é o genérico do `index.html` (igual em todas as páginas) e o outro é o da página (injetado pelo React Helmet ou similar). O `inventory.mjs` escolhe o valor menos repetido entre as páginas — o específico — e guarda todos em `allHeadValues`. Use sempre o específico. No novo site cada tag aparece uma vez.
- Descarte `meta keywords` (ignorado pelos buscadores) e registre no relatório.
- Favicon: use o ícone do original (se era o logo, gere o PNG com `getImage` a partir de `src/assets`) e **remova os placeholders do template** (`public/favicon.svg`, `favicon.ico`, `site.webmanifest` com "Site Name") — o navegador pede `/favicon.ico` sozinho e mostraria o ícone do Astro.
- `og:image`: aponte para uma imagem que existe no novo site (gere 1200×630 com `getImage` a partir de `src/assets`). URLs de imagem do original que não vieram no download (ex.: `/opengraph.jpg`) não podem ser reaproveitadas — registre no relatório.

## Dados estruturados (JSON-LD)

- Preserve o JSON-LD do original **literalmente**, mesmo que contradiga dados visíveis (telefone ou e-mail diferentes são comuns): corrigir dado de negócio não é papel da conversão. Mantenha-o num módulo próprio (ex.: `src/data/structured-data.ts`) com um comentário apontando a divergência e registre-a no relatório para o cliente decidir. Fora isso, preserve o JSON-LD do original (ex.: `LocalBusiness`, `Organization`, `Service`, `FAQPage`, `BreadcrumbList`), alimentado por `src/data/site.ts` e pelas collections em vez de texto duplicado.
- Implemente como um componente (`src/components/atoms/JsonLd.astro` com `<script type="application/ld+json" set:html={JSON.stringify(data)} />`) e um slot/prop no layout para cada página injetar o seu.
- Se o original tem FAQ visível mas não tem `FAQPage`, pode adicionar — é derivado 1:1 de conteúdo existente. Idem `BreadcrumbList` se houver breadcrumbs visíveis. Não adicione schemas que exijam dados inexistentes (avaliações, preços).

## Sitemap e robots

- `@astrojs/sitemap` já está no template; exclua `/design-system` com `filter`.
- Crie `public/robots.txt` com `Sitemap: <site>/sitemap-index.xml` (preserve regras `Disallow` do original, se havia).

## Conteúdo on-page

- Hierarquia de headings igual à do original (um `h1` por página; mesmo texto). O `inventory.json` tem os headings para conferência na verificação.
- `alt` das imagens preservado.
- Links externos com os mesmos `rel` do original.

## Checklist

- [ ] Todas as URLs do input respondem no build (`dist/`)
- [ ] `site`, `trailingSlash`, `SITE_NAME` configurados
- [ ] title/description/canonical/OG únicos por página, iguais ao original
- [ ] JSON-LD preservado via componente
- [ ] sitemap sem `/design-system`; `robots.txt` presente
- [ ] favicon e imagem OG em `public/`
