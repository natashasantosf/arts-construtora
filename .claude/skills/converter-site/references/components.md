# Componentes: das seções do original ao sistema atômico

O template organiza a UI em três camadas, cada uma com `index.ts` exportando seus componentes:

- **atoms** — peças indivisíveis sem conhecimento de negócio: `Button`, `Heading`, `Text`, `Eyebrow`, `Container`, `Section`, `Badge`, `Link`, `Divider`…
- **molecules** — combinações pequenas: `Card`, `ServiceCard`, `FeatureItem`, `Stat`, `Testimonial`, `FaqItem`, `ProcessStep`, `NavLink`, `Breadcrumbs`…
- **organisms** — seções inteiras: `Header`, `Footer`, `Hero`, `Services`, `FeatureGrid`, `StatsSection`, `TestimonialsSection`, `FAQ`, `Process`, `CTASection`, `LogoCloud`…

Leia os arquivos antes de decidir — as props reais importam mais que os nomes.

## Decidir por seção

Para cada tipo de seção listado no `plan.md`, na ordem:

1. **Um organism existente resolve** com as props atuais? Use-o.
2. **Resolve com uma extensão pequena** (nova prop opcional, nova variante, slot)? Estenda-o mantendo compatibilidade com os usos existentes (ex.: `Hero` ganhar `background` image + `tone="dark"`; `Section` ganhar `tone: "default" | "muted" | "dark"`).
3. **É um padrão novo** que aparece no site? Crie um componente novo na camada certa. Se ele se repete em mais de uma página, é organism; se é uma peça dentro de seções, é molecule.
4. **É realmente único e simples** (aparece uma vez)? Ainda assim prefira um organism nomeado (ex.: `AboutIntro.astro`) em vez de markup solto na página — a página deve ler como um índice de seções.

Ao estender um componente existente, verifique quem mais o usa (`grep -r "ComponentName" src`) — inclusive `design-system.astro`.

## Convenções (siga o estilo dos componentes existentes)

- Frontmatter com `interface Props` tipada; `class` repassável via `class:list`; `...rest` quando fizer sentido.
- Variantes como mapas de classes literais (`const variants = { primary: "bg-primary …" } as const`) — nunca classes montadas por interpolação (o Tailwind não as detecta).
- **Somente tokens**: `bg-primary`, `text-accent-foreground`, `border-border`, `rounded-md`, `shadow-md`. Nada de `#hex`, `bg-[…]` com cor, nem cores da paleta padrão (`bg-gray-800`) — se precisar de algo novo, é um token novo (ver `design-system.md`).
- Tipografia via `Heading`/`Text`/`Eyebrow` com props (`size`, `tone`), não `text-3xl font-bold` repetido em cada organism.
- Espaçamento vertical de seções via `Section` (ou a prop equivalente) para que o ritmo seja global.
- Ícones: gere `src/components/atoms/icons.ts` com `scripts/icons.mjs` (SVGs inline copiados do original, sem biblioteca) e um átomo `Icon.astro` que lê esse mapa. Exporte `IconName`/`iconNames` e use `z.enum(iconNames)` nos schemas das collections que guardam nomes de ícone — um nome errado vira erro de validação no `astro sync`, não uma página quebrada no build.
- Interatividade: sem frameworks JS. Menu mobile, acordeão, dropdown → HTML semântico (`<details>`, `<dialog>`, `popover`) ou um `<script>` pequeno no componente / Web Component. Carrossel → CSS scroll-snap antes de qualquer JS.
- Imagens: `<Image>`/`<Picture>` de `astro:assets` com `widths`/`sizes` razoáveis; `loading="eager"` + `fetchpriority="high"` apenas na imagem do hero.
- Animações: use as classes `motion-*` de `src/utils/animation-classes.ts` para reproduzir entradas que o original tinha. Não adicione animações que o original não tinha.
- Exporte o componente novo no `index.ts` da camada e adicione um exemplo em `/design-system`.

## Armadilhas que geram divergência visual

Estas custaram mais retrabalho na primeira conversão real; evite-as desde o início.

- **Nunca "corrija" um componente passando utilitários conflitantes em `class`.** `<Button class="py-3">` sobre um `py-3.5` interno, `<Button class="hidden lg:flex">` sobre um `inline-flex` interno, `<Text tone="inverse" class="text-white/70">`: o Tailwind resolve pela ordem das regras no CSS gerado, não pela ordem das classes, e o resultado é imprevisível (o botão "escondido" apareceu no mobile). Em vez disso: adicione um `size`/`variant`/prop ao componente, ou ponha a responsabilidade num wrapper (`<div class="hidden lg:block"><Button …/></div>`).
- **Entrelinha:** o `leading-relaxed` padrão do átomo `Text` não é o que parágrafos de apoio costumam usar (1.5). Uma diferença de 2px por linha vira dezenas de pixels por página — exponha `leading` como prop.
- **Proporção declarada vs. real:** se o original tem `<img width="800" height="500">` e a imagem é `h-auto`/`h-full` num grid, é a proporção dos atributos (não a do arquivo) que define a altura do card. O `astro:assets` usa as dimensões reais do arquivo; reproduza a proporção original com `aspect-[8/5]` no wrapper.
- **Grids "hairline" (`gap-px` + fundo `bg-border`) não combinam com animação de entrada nas células:** enquanto as células estão com `opacity:0`, o fundo cinza do grid aparece como um bloco. Anime o cabeçalho da seção, não as células.
- **`class:list` em componentes:** passe `class` como string já resolvida para componentes (`class={cond ? "a" : "b"}`); reserve `class:list` para elementos HTML.
- **Botões de largura total** no original geralmente não têm padding horizontal (`w-full py-4`); com `px-8` o texto quebra em duas linhas no mobile. Faça `block` remover o padding horizontal.

## Layout global

`src/layouts/main.astro` deve receber o que se repete em todas as páginas do original: `Header` (com nav de `site.ts`), `Footer`, botão flutuante (WhatsApp), `lang` do `<html>`. Assim as páginas ficam só com o conteúdo. Se algumas páginas do original não têm header/footer (landing pages), exponha props no layout para desligá-los em vez de criar outro layout.

## Formulários

O site estático baixado geralmente perdeu o backend do formulário. Reproduza o formulário visualmente (campos, labels, placeholders, textos) com átomos/molecules de formulário. Copie os atributos que afetam layout (`rows` do textarea, `type`, `required`) e os placeholders por inteiro. Para o envio:
- se o original enviava para WhatsApp/mailto, reproduza esse comportamento;
- caso contrário, **bloqueie o submit** (`preventDefault` num `<script>`, com um `TODO` explicando) — um `<form>` sem `action` faria GET na própria página e colocaria os dados do visitante na URL — e registre no relatório como pendência de go-live (a implementação — Cloudflare Worker, serviço de formulário — é decisão do usuário).
