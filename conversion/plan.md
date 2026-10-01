# Plano de conversão — Art's Construtora

Input: `inputs/site-dowload/` (16 páginas; SPA React + Tailwind v4 + shadcn exportada estaticamente; JS do app **não** veio no download, só HTML/CSS/imagens).
Auditoria: `inputs/site-audit/` (confirma tags duplicadas no `<head>` e posts de blog sem artigo).

## Rotas (original → Astro)

URL canônica original **sem barra final** (`https://artsconstrutora.com.br/servicos/pintura-predial`) → `build.format: "file"` + `trailingSlash: "never"`.

| Rota | Arquivo |
|---|---|
| `/` | `src/pages/index.astro` |
| `/empresa` | `src/pages/empresa.astro` |
| `/servicos` | `src/pages/servicos/index.astro` |
| `/servicos/<slug>` (9) | `src/pages/servicos/[slug].astro` ← collection `services` |
| `/projetos` | `src/pages/projetos.astro` |
| `/areas-atendidas` | `src/pages/areas-atendidas.astro` |
| `/blog` | `src/pages/blog.astro` (listagem; posts não têm página no original) |
| `/contato` | `src/pages/contato.astro` |

## Collections / dados

| Entidade | Onde aparece | Collection |
|---|---|---|
| Serviço (9) | cards home, /servicos, menu, footer, select do form, página própria, "Outros serviços" | `services` (md, glob) |
| Projeto do portfólio (9) | /projetos | `projects` (json, file) → referencia `services` |
| Projeto em destaque (3) | home | `featuredProjects` (json, file) |
| Post (6) | /blog (só cards) | `posts` (md sem corpo, glob) |
| Depoimento (3) | home | `testimonials` (json) |
| FAQ (6) | home | `faqs` (json) |
| Região (4) | /areas-atendidas | `regions` (json) |
| Dados globais (contato, WhatsApp, nav, cidades em destaque, garantias, selos) | header, footer, CTAs, JSON-LD | `src/data/site.ts` |

## Seções → componentes

Globais: TopBar + Header (sólido / transparente na home, dropdown de serviços, menu mobile), Footer (4 colunas), WhatsAppFloat.
Home: Hero (fullscreen com imagem), TrustBar (faixa escura), Services, WhyUs (split escuro + grid de features), StatsSection (verde), ProjectShowcase, CityChips, TestimonialsSection (escuro), FAQ, CTASection (verde, 2 botões).
Internas: PageHero (banner com imagem escurecida, eyebrow, h1, subtítulo, back-link/badge opcionais), IntroText, TagList (chips), ServiceDetail (conteúdo + aside sticky), PortfolioGrid, FeaturedPost + PostCard, RegionCard, CityColumns, MapEmbed, ContactForm, ContactAside, AboutStory, MissionVision, ValuesGrid (=FeatureGrid variante card), Timeline (Trajetória).

## Design system (estilos computados na home + CSS)

| Papel | Uso no original | Original | oklch |
|---|---|---|---|
| `primary` / `-foreground` | botões, links, destaques, faixas verdes | #6FA43A / #fff | 65.9% .148 131.9 |
| `primary-hover` (novo) | hover de botões primários | #4E7D2B | 53.8% .124 134.2 |
| `background` | seções brancas | #fff (body #F7F7F7 fundido) | 100% 0 0 |
| `muted` | seções `bg-gray-50` | #F9FAFB | 98.5% .002 247.8 |
| `foreground` | títulos e textos fortes | #3A3A3A (#262626 do body fundido) | 34.8% 0 0 |
| `muted-foreground` | parágrafos (gray-500; gray-400/600 fundidos) | #6B7280 | 55.1% .023 264.4 |
| `border` | bordas e divisórias de grid (gray-200; gray-100/300 fundidos) | #E5E7EB | 92.8% .006 264.5 |
| `card` | cards brancos | #fff | 100% 0 0 |
| `secondary` / `-foreground` | botão branco com texto verde (sobre faixas verdes) | #fff / #6FA43A | |
| `accent` / `-foreground` | seções escuras, top bar, menu mobile | #2D2D2D / #fff | 29.7% 0 0 |
| `accent-deep` (novo) | footer, overlays de hero, seção Trajetória, tooltip | #222 / #1E1E1E / #1A1A1A → fundidos | 23.5% 0 0 |
| `rating` (novo) | estrelas | #C9A646 | 73.9% .121 88.9 |
| `whatsapp` (novo) | botão flutuante | #25D366 | 76.1% .201 149.7 |

- Tipografia: **só Montserrat** (Playfair Display é carregada no original mas não usada em nenhum elemento) — pesos 400/500/600/700/900. Títulos `font-black` com `tracking-tight`.
- Raio: 0 em tudo (botões, cards, badges); `rounded-full` só no botão flutuante/estrelas.
- Container: `container` do Tailwind com `px-4 lg:px-8`, 1280px em telas ≥1280.
- Seções: `py-20 lg:py-28` (section-pad), variações `py-16`, `py-12`, `py-5`.
- Contraste: branco sobre #6FA43A ≈ 2.9:1 (abaixo de 4.5:1). Preservado — é a marca.

## Interações
Dropdown de serviços no hover (desktop), menu mobile deslizante, acordeão de FAQ, header transparente→sólido no scroll (home), botão flutuante do WhatsApp com tooltip, zoom em imagens no hover, cards de serviço que ficam verdes no hover. Animações de entrada (framer-motion) → classes `motion-*`.

## Lacunas conhecidas
- Posts do blog sem artigo (cards sem link) — mantidos como cards sem link.
- Formulário de contato sem backend (JS não baixado).
- `og:image` padrão `/opengraph.jpg` e `images/proj-manutencao-condominios.webp` não vieram no download.
- Imagens de hero internas são do Unsplash (localizadas em `_externo/`).
