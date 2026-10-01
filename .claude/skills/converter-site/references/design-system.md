# Design system: do site legado aos tokens do template

O template define tudo em `src/styles/global.css` com Tailwind 4 (`@theme`). Os componentes consomem **papéis semânticos** (`bg-primary`, `text-muted-foreground`, `border-border`…), nunca matizes. Converter o design system é, portanto, descobrir quais papéis o site original usa e preencher os valores — não copiar o CSS antigo.

## 1. Coletar evidências

Use as três fontes, nesta ordem de confiança:

1. **Estilos computados no navegador** (mais confiáveis — refletem o que o usuário vê). Com o input servido localmente, rode no console via Chrome MCP algo como:
   ```js
   const pick = s => [...document.querySelectorAll(s)].slice(0,5).map(e => { const c = getComputedStyle(e); return { s, text: e.textContent.trim().slice(0,30), color: c.color, bg: c.backgroundColor, font: c.fontFamily, size: c.fontSize, weight: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, radius: c.borderRadius, shadow: c.boxShadow } });
   ['body','header','nav a','h1','h2','h3','p','a.button, button, [class*="btn"]','section','footer','.card, [class*="card"]','input, textarea'].flatMap(pick)
   ```
   Repita na home e em uma página interna. Anote também cores de fundo de cada `<section>` (seções escuras/claras alternadas são comuns).
2. **Variáveis CSS do original** (`:root { --primary: … }`, `.dark {…}`). Sites feitos com shadcn/Tailwind costumam ter tokens HSL prontos — ótimo ponto de partida, mas confira se são realmente usados.
3. **Cores arbitrárias nas classes** (`bg-[#1E1E1E]`, `text-[#6FA43A]`) — o `inventory.json` lista em `site.arbitraryColors` com frequência. Estas geralmente são as cores de marca reais.

O CSS compilado de sites gerados por frameworks costuma conter centenas de classes mortas (componentes de UI não usados). Não trate o arquivo CSS como especificação; trate o que aparece renderizado como especificação.

## 2. Mapear para papéis

Monte uma tabela (coloque-a no `conversion/plan.md`) antes de editar:

| Papel no template | Uso no original | Valor original | Valor oklch |
|---|---|---|---|
| `primary` / `-foreground` | botões principais, links de destaque | #6FA43A / #fff | … |
| `accent` | seções escuras, header/footer escuros | #1E1E1E | … |
| `background`, `foreground`, `card`, `muted`, `border`, `ring` | superfícies e texto | … | … |
| `secondary` | botões secundários / chips | … | … |
| `success`/`warning`/`danger` | feedback (mantenha os do template se o original não tiver) | | |

Regras de mapeamento:
- Cada cor que aparece com significado recorrente vira um papel. Tons quase idênticos (diferença imperceptível) se fundem em um só token — registre a fusão no relatório.
- Se o original tem um papel que o template não tem (ex.: uma segunda superfície escura `#2D2D2D` para cards dentro de seções escuras, ou a cor do WhatsApp), **adicione um token semântico** novo com par `-foreground` (ex.: `--color-surface-dark`, `--color-whatsapp`) em `@theme` e no bloco dark. Nomeie pelo papel, não pelo matiz.
- Converta para `oklch()` com `node .claude/skills/converter-site/scripts/oklch.mjs 6FA43A 3A3A3A …` (imprime também o contraste contra branco e preto). Mantenha o valor visualmente idêntico ao original.
- Branco e preto usados com opacidade sobre faixas escuras/fotos (`text-white/70`, `border-white/10`, `bg-black/30`, gradientes `from-black/60`) também são papéis: crie `--color-inverse` (texto/linhas sobre superfícies escuras ou primárias) e `--color-scrim` (overlays sobre fotos) e use `text-inverse/70`, `bg-scrim/30`. Assim nenhuma cor da paleta padrão do Tailwind sobra nos componentes.
- Confira contraste do par `X`/`X-foreground` (≥ 4.5:1 para texto normal). Se o original falha, preserve o original e anote — não é papel da conversão corrigir marca, a não ser que o usuário peça.

## 3. Dark mode

O template tem dark mode (`:root[data-theme="dark"]`). Se o original não tem, gere valores dark derivados (mesmo matiz, luminosidade ajustada) para que o toggle continue funcionando, mas mantenha o **modo claro como padrão** idêntico ao original. Se o original é escuro por padrão, avalie com o usuário; na dúvida, faça o tema claro ser o do original.

Se o original não tinha toggle de tema visível, não adicione um toggle no header — o mecanismo continua disponível pelo `darkMode.astro`. E se o original não tinha dark mode, **não deixe o site seguir o tema do sistema operacional por padrão**: um visitante com SO escuro veria um site diferente do original. Desligue o "seguir o SO" no `darkMode.astro` (flag `FOLLOW_OS_BY_DEFAULT = false`) — o modo escuro fica disponível só por escolha explícita.

## 4. Tipografia

- Identifique famílias (o `inventory.json` lista em `site.fonts`; confirme nos estilos computados), pesos realmente usados e papéis (ex.: display/serif em headings, sans no corpo). **Fonte carregada não é fonte usada:** sites gerados costumam importar famílias que nenhum elemento renderiza. Confirme com `[...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).fontFamily.includes('Nome'))` antes de carregá-la. Para os pesos, `grep -ohE 'font-(black|extrabold|bold|semibold|medium|light)'` nos HTML.
- Configure com a **Fonts API do Astro** (`fonts: [...]` no `astro.config.mjs` + `<Font cssVariable="..." preload />` no `head.astro`). Consulte `search_astro_docs("Fonts API")` para a sintaxe da versão instalada. Prefira `fontProviders.fontsource()` ou `google()` para fontes do Google; use `fontProviders.local()` com arquivos em `src/assets/fonts/` para fontes proprietárias que vieram no download. Peça apenas os pesos usados.
- No `@theme`, aponte `--font-sans` (e crie `--font-display`/`--font-serif` se houver fonte de títulos) para as variáveis da Fonts API, com fallbacks genéricos.
- Registre a escala tipográfica (tamanhos de h1/h2/h3/p em mobile e desktop, tracking de eyebrows, uppercase) e reflita no átomo `Heading`/`Text`/`Eyebrow` via props/variantes — não em classes soltas nas páginas.

## 5. Forma e profundidade

- `--radius-*`: se o original usa raio pequeno (ex.: 4px) e o template usa `rounded-md` nos componentes, ajuste os tokens de raio no `@theme` (`--radius-sm`, `--radius-md`, `--radius-lg`…) para que os componentes existentes herdem a forma do original sem reescrever classe por classe.
- Sombras: idem com `--shadow-*` se o original tem sombras características.
- Container: largura máxima e padding lateral do original → ajuste o átomo `Container` (sizes).
- Ritmo vertical: copie os paddings de seção do original para variantes do átomo `Section` (`spacing`), em vez de repetir `py-*` em cada organism.

## 6. Atualizar `/design-system`

`src/pages/design-system.astro` é a vitrine do sistema. Atualize as listas de tokens (inclua os novos, com classes literais — o scanner do Tailwind não vê classes interpoladas) e adicione exemplos dos componentes novos criados na Fase 4. Essa página deve continuar `noindex`.

## Checklist

- [ ] Tabela de mapeamento no `plan.md`
- [ ] `global.css` com todos os papéis em oklch, light + dark
- [ ] Fontes via Fonts API, só os pesos usados, preload da fonte principal
- [ ] Raios/sombras/container ajustados nos tokens/átomos
- [ ] `grep -rE "\[#[0-9a-fA-F]{3,8}\]|#[0-9a-fA-F]{6}" src/components src/pages` sem resultados (exceto `design-system.astro` se exibir valores como texto)
- [ ] `/design-system` atualizado e renderizando
