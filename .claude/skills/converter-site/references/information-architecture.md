# Arquitetura da informação: conteúdo estruturado

O site antigo tem o conteúdo "chumbado" no HTML. No template, o conteúdo vive em arquivos de dados validados por schema, e as páginas apenas os renderizam. Isso é o que permite, no futuro, criar centenas de páginas, trocar o design inteiro ou plugar um CMS sem reescrever texto.

Sempre confirme a API atual com `search_astro_docs("content collections content.config.ts loaders")` antes de escrever — use `defineCollection` de `astro:content`, loaders `glob()`/`file()` de `astro/loaders` e `z` de `astro/zod`.

## 1. Identificar entidades

Uma entidade merece collection quando **aparece mais de uma vez com a mesma forma**. Procure no `inventory.json` e no HTML:

| Sinal no original | Collection típica | Loader |
|---|---|---|
| Uma página por item em `/servicos/<slug>/` + cards numa listagem | `services` (um arquivo `.md`/`.json` por item) | `glob()` |
| Cards de projeto/portfólio com imagem, título, categoria | `projects` | `glob()` ou `file()` |
| Cards de blog (título, data, categoria, resumo, tempo de leitura) | `posts` (`.md`/`.mdx`) | `glob()` |
| Depoimentos (nome, cargo/empresa, texto, nota) | `testimonials` | `file()` (um JSON com array) |
| Perguntas frequentes | `faqs` (campo opcional `page`/`service` se variarem por página) | `file()` |
| Lista de cidades/regiões | `areas` | `file()` |
| Números/estatísticas, diferenciais, etapas de processo | geralmente **não** — são dados da página; deixe em `src/data/*.ts` ou no frontmatter da página, a menos que se repitam em várias páginas | — |

Não crie collections especulativas (ex.: `team` se o site não tem equipe). O objetivo é refletir o conteúdo real.

Quando a mesma entidade aparece em vários lugares (ex.: o serviço tem card na home, card em `/servicos` e página própria), **todas** essas aparições devem vir da mesma entrada da collection — é o ganho principal da conversão. Se os textos do card e da página diferem no original, guarde os dois campos (ex.: `summary` para o card, corpo para a página).

## 2. Schemas

- Um campo por informação que o original exibe; nada além. Use nomes em inglês (`title`, `summary`, `image`, `imageAlt`, `order`, `category`, `publishedAt`) para consistência com o código, e mantenha o **conteúdo** no idioma original.
- Imagens: `schema: ({ image }) => z.object({ cover: image(), coverAlt: z.string() })`, com os arquivos em `src/assets/<collection>/`. Isso habilita a otimização do `astro:assets`.
- `order: z.number()` quando a ordem do original importa (quase sempre em listagens de serviços).
- Datas: `z.coerce.date()`; guarde a data como estava no original (ex.: "12 de abril de 2025" → `2025-04-12`) e formate na renderização com `Intl.DateTimeFormat` no locale do site.
- Referências entre collections com `reference('services')` quando o original relaciona entidades (ex.: projeto → serviço).
- SEO por entrada: `seoTitle`/`seoDescription` opcionais quando a página do item tinha `<title>`/description próprios diferentes do título visível (ver `seo.md`).
- Conteúdo longo (corpo de uma página de serviço, post) vai no **corpo Markdown** do arquivo, renderizado com `render()` — preserve títulos, listas e negritos do original convertendo o HTML para Markdown fielmente. Se a página interna de um serviço tem seções estruturadas (benefícios, etapas, FAQ específico), prefira campos estruturados no frontmatter para que o layout seja o mesmo em todos os serviços.

## 3. Dados globais do negócio

Crie `src/data/site.ts` exportando um objeto tipado com o que é global e repetido no header/footer/JSON-LD:

```ts
export const site = {
  name: "...",
  legalName: "...",       // se aparecer
  url: "https://...",     // domínio original (canonical)
  locale: "pt-BR",
  phone: { display: "(51) 99999-9999", href: "tel:+5551999999999" },
  whatsapp: { number: "5551999999999", message: "..." },  // mensagem exatamente como no link original
  email: "...",
  address: { ... },
  social: [{ name: "Instagram", href: "..." }],
  nav: [{ label: "Serviços", href: "/servicos/", children: [...] }],
  footerNav: [...],
};
```

Tudo que estava duplicado no HTML de cada página (menu, rodapé, contatos) passa a vir daqui. Links de WhatsApp: gere com uma função a partir de `number` + `message` em vez de colar URLs prontas.

Quando um texto segue um padrão fixo a partir de outro dado (ex.: a mensagem do WhatsApp de cada serviço é sempre "Olá, preciso de orçamento para {serviço}"), confirme o padrão em todas as páginas (`grep` nos links) e **derive-o** numa função em vez de gravar 9 cópias no conteúdo — a próxima entrada nova herda o padrão sozinha.

## 4. Transferência de conteúdo

- Extraia os textos do HTML de forma programática quando for volume grande (um script Node descartável em `conversion/scripts/` lendo o HTML e gravando os `.md`/`.json`), e revise o resultado. Para poucas páginas, extraia manualmente com cuidado.
- **Literal**: mantenha acentuação, pontuação, maiúsculas e números. Não resuma, não reescreva, não traduza.
- Imagens: copie os arquivos usados de `inputs/.../images` (e de pastas de assets externos baixados, como `_externo/`) para `src/assets/...` com nomes descritivos. Imagens decorativas/de fundo usadas por componentes (hero, textura) também vão para `src/assets/`. Só coisas que precisam de URL fixa (favicon, imagem OG, `robots.txt`) vão para `public/`.
- Alt text: copie o `alt` original. Se estiver vazio, deixe vazio e anote no relatório — não invente descrições.

## Checklist

- [ ] `src/content.config.ts` com apenas as collections justificadas
- [ ] Contagem de entradas = contagem no original (ex.: 9 serviços, 6 posts)
- [ ] `src/data/site.ts` com contatos/nav; nenhum telefone/e-mail/URL de WhatsApp chumbado em componente
- [ ] Imagens de conteúdo em `src/assets` via `image()`
- [ ] `npx astro sync` sem erros
