# Relatório de conversão — Art's Construtora

Conversão de `inputs/site-dowload/` (SPA React + Tailwind v4 + shadcn exportada estaticamente, 16 páginas) para o template Astro, feita com a skill `converter-site` (`.claude/skills/converter-site/`). Plano e mapeamento: `conversion/plan.md`.

## Rotas

Todas as 16 rotas preservadas, **sem barra final**, iguais aos canonicals do original (`trailingSlash: "never"`, `build.format: "file"`).

| Original | Astro | Status |
|---|---|---|
| `/` | `src/pages/index.astro` | ✓ |
| `/empresa` | `src/pages/empresa.astro` | ✓ |
| `/servicos` | `src/pages/servicos/index.astro` | ✓ |
| `/servicos/<slug>` (9) | `src/pages/servicos/[slug].astro` ← collection `services` | ✓ |
| `/projetos` | `src/pages/projetos.astro` | ✓ |
| `/areas-atendidas` | `src/pages/areas-atendidas.astro` | ✓ |
| `/blog` | `src/pages/blog.astro` | ✓ |
| `/contato` | `src/pages/contato.astro` | ✓ |
| — | `/design-system` (novo, `noindex`, fora do sitemap) | referência interna |

## Design system (`src/styles/global.css`)

| Token | Valor | Origem |
|---|---|---|
| `primary` / `primary-hover` / `primary-foreground` | #6FA43A / #4E7D2B / branco | cor de marca e hover dos botões |
| `background`, `card` | branco | seções brancas |
| `muted` | #F9FAFB | seções `bg-gray-50` |
| `foreground` | #3A3A3A | títulos (fundido com o #262626 do body) |
| `muted-foreground` | #6B7280 | parágrafos (gray-500; gray-400 e gray-600 fundidos) |
| `border` | #E5E7EB | bordas e grids "hairline" (gray-100/200/300 fundidos) |
| `secondary` | branco com texto verde | botões sobre faixas verdes |
| `accent` | #2D2D2D | faixas escuras, top bar, menu mobile |
| `accent-deep` (novo) | #1E1E1E | footer, overlays de hero, "Trajetória" (#222/#1E1E1E/#1A1A1A fundidos) |
| `inverse`, `scrim` (novos) | branco, preto | texto/linhas sobre superfícies escuras; overlays de foto |
| `rating`, `whatsapp` (novos) | #C9A646, #25D366 | estrelas, botão flutuante |

- Fonte: **Montserrat** (400/500/600/700/900) via Fonts API do Astro. Playfair Display era carregada no original, mas nenhum elemento a usava, então não foi incluída.
- Raios zerados (a marca é de cantos retos); ritmo de seções `py-20 lg:py-28` no átomo `Section`.
- Dark mode: tokens escuros definidos; o site abre **sempre em modo claro**, como o original (`FOLLOW_OS_BY_DEFAULT = false` em `darkMode.astro`).
- Contraste: branco sobre #6FA43A dá 2,98:1, abaixo do mínimo WCAG AA (4,5:1). Foi mantido por ser a marca; vale revisar com o cliente.

## Arquitetura da informação (`src/content.config.ts`)

| Collection | Entradas | Usada em |
|---|---:|---|
| `services` (md) | 9 | home, /servicos, menu, footer, select do formulário, páginas de serviço, "Outros serviços" |
| `projects` (json, referencia `services`) | 9 | /projetos |
| `featuredProjects` (json) | 3 | home |
| `posts` (md) | 6 | /blog |
| `testimonials` (json) | 3 | home |
| `faqs` (json) | 6 | home (+ JSON-LD `FAQPage`) |
| `regions` (json) | 4 | /areas-atendidas |

Dados globais em `src/data/site.ts` (contatos, navegação, cidades em destaque, garantias). As mensagens de WhatsApp por serviço seguiam um padrão fixo e passaram a ser derivadas do título do serviço. Nomes de ícone são validados no schema (`z.enum(iconNames)`).

## Componentes

- Átomos novos: `Icon` (+ `icons.ts`, SVGs copiados do original), `IconBox`, `Chip`, `DividedGrid`, `Logo`, `JsonLd`. Reestilizados: `Button` (variantes `secondary`/`outline-inverse`, tamanhos com os paddings do original), `Heading`, `Text`, `Eyebrow`, `Badge`, `Section`, `Container`.
- Moléculas novas: `SectionHeading`, `CheckItem`, `ProjectCard`, `PostCard`, `QuoteCard`, `InfoItem`, `RegionCard`. Reestilizadas: `ServiceCard`, `FeatureItem`, `Stat`, `Testimonial`, `FaqItem`, `ProcessStep`, `NavLink`, `SocialLinks`.
- Organismos: `Header` (top bar, dropdown, menu mobile, modo transparente na home), `Footer`, `WhatsAppFloat`, `Hero`, `PageHero`, `TrustBar`, `Services`, `WhyUs`, `StatsSection`, `ProjectShowcase`, `CityGrid`, `TestimonialsSection`, `FAQ`, `CTASection`, `LeadSection`, `TagBar`, `ServiceDetail`, `ProjectGrid`, `PostsSection`, `RegionsGrid`, `CityColumns`, `MapEmbed`, `ContactStrip`, `ContactSection`, `AboutStory`, `MissionVision`, `Timeline`.
- Boilerplate removido: `FeatureGrid`, `Pricing`, `PricingCard`, `LogoCloud`, favicons e `site.webmanifest` placeholder do Astro.

## SEO técnico

- Title, description, canonical, `og:*` e `twitter:*` únicos por página e **idênticos aos específicos da página no original**. O original tinha todas as tags duplicadas (genéricas + da página); a duplicação foi eliminada.
- JSON-LD `LocalBusiness` do original preservado em todas as páginas, com telefone e e-mail corrigidos para os contatos confirmados pelo cliente. Adicionados `FAQPage` (home, derivado do FAQ visível) e `Service` (páginas de serviço).
- `og:image` gerada em 1200×630 a partir das imagens do site. Sitemap sem `/design-system`, `robots.txt` com o sitemap, `lang="pt-BR"`, favicon a partir do logo.
- `meta keywords` descartada (ignorada pelos buscadores).

## Adaptações visuais intencionais

- Tons quase iguais fundidos em um token (ver tabela acima).
- O item "Serviços" do menu tinha peso 400 por um bug de classe no original (`font-600`); foi padronizado em 600, como os demais itens.
- O ícone do menu mobile era branco sobre fundo claro no topo da home (praticamente invisível); agora usa a cor de texto.
- Botão "Falar com um Engenheiro": padding padronizado com os demais botões (4px mais baixo).
- Animações de entrada reproduzidas com as classes `motion-*` do template. Não animamos as células dos grids com divisória de 1px, porque o fundo cinza apareceria durante a animação.

## Lacunas do input e pendências — decisão do cliente

1. **Formulário de contato:** ~~sem backend~~ resolvido depois da conversão. `worker/index.ts` recebe `POST /api/contato` e grava na base D1 `arts-construtora-contatos` (tabela `contatos`, ver `migrations/`). **Pendente:** o encaminhamento por e-mail para `comercial@` já está no código, mas desligado até o domínio usar o DNS da Cloudflare e ser habilitado no Email Sending (instruções em `wrangler.jsonc`).
2. **Posts do blog sem artigo:** os 6 cards não levam a lugar nenhum no original (confirmado pela auditoria) e foram mantidos assim, sem link. Os posts já existem como collection; basta escrever o corpo e criar a rota.
3. **JSON-LD com dados divergentes:** ~~telefone `+55-51-99958-3045` e e-mail `contato@`~~ resolvido. O cliente confirmou `(51) 98403-3255` e `comercial@artsconstrutora.com.br`, e o JSON-LD foi corrigido.
4. **Imagens ausentes no download:** `/opengraph.jpg` (og:image padrão) e `images/proj-manutencao-condominios.webp` (og:image da página de manutenção). Substituídas por imagens existentes.
5. **Fotos de banco de imagens:** os heróis das páginas internas são fotos do Unsplash (baixadas em `_externo/`). Confirmar a licença ou trocar por fotos próprias.
6. As imagens dos cards do blog e dos projetos têm resolução baixa no original (ex.: 405×224) e continuam assim.
7. `trailingSlash: "never"` + `build.format: "file"` assumem o comportamento padrão de assets estáticos do Cloudflare (servir `x.html` em `/x`). Validar no primeiro deploy.

## Verificação

- `npx astro check`: 0 erros, 0 avisos. Dois erros pré-existentes do template foram corrigidos: a tipagem de `playformInline()` e a declaração de tipos do `html-minifier-terser`.
- `npm run build`: 17 páginas (16 + design-system).
- `compare.mjs`: **16/16 rotas ✓**. Rotas, canonical, title, description, h1–h3, contagem de palavras (±10%), alts e JSON-LD conferem com o original. Nenhum link interno quebrado.
- Altura por seção (build de produção × original):
  - **Desktop (1366px):** idêntica ao pixel nas 8 páginas-tipo.
  - **Mobile (390px):** idêntica em 6 das 8 páginas. Na home há 4px de diferença (botão padronizado) e em /projetos, 2px.
- Screenshots comparados em desktop e mobile. Funcionaram o menu mobile, o dropdown de serviços, o acordeão de FAQ, o header transparente → sólido, o link ativo e o dark mode.
- Nenhuma cor hex, `rgb()` ou da paleta padrão do Tailwind em `src/components`, `src/pages` ou `src/layouts`.
- Não verificado: Lighthouse e envio real do formulário (não há endpoint).
