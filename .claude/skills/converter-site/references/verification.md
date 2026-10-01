# Verificação: o site novo ficou parecido?

"Parecido" tem três dimensões — estrutural, de conteúdo e visual. Verifique as três; nenhuma substitui as outras. A ordem abaixo vai do mais barato e objetivo ao mais caro.

## 1. Build e tipos

```
npx astro check
npm run build
```
Ambos sem erros. Warnings de imagem/acessibilidade devem ser lidos e resolvidos quando forem da conversão. Exclua `conversion/`, `inputs/` e `.claude/` do `tsconfig.json` para o `astro check` não analisar scripts auxiliares.

## 2. Paridade de conteúdo e SEO (automático)

```
node .claude/skills/converter-site/scripts/inventory.mjs dist conversion/inventory-new.json
node .claude/skills/converter-site/scripts/compare.mjs conversion/inventory.json conversion/inventory-new.json
```

Reporta, por rota: rota ausente, **canonical diferente**, `<title>`/description divergentes, tags duplicadas no head, `lang`, headings h1–h3 faltando ou a mais, diferença de palavras > 10%, alts perdidos, JSON-LD ausente, e links internos quebrados no site novo. Sai com código 1 se houver problema crítico (rota, canonical, title ou h1). Meta: todas as rotas com ✓ — cada exceção precisa estar justificada no relatório.

## 3. Estrutura visual: altura de cada seção (automático, com navegador)

É o detector de divergência mais sensível e barato: se a conversão está certa, a altura de cada `<section>` bate **ao pixel** com a do original. Uma diferença aponta exatamente onde olhar, e medir os filhos daquela seção (altura, `line-height`, `margin`) revela a causa (entrelinha, padding de botão, proporção de imagem…).

Suba os dois sites:
- original: `npx --yes serve <pasta-do-input> -l 4322` em background (use timeout longo; o padrão de 30 min derruba o servidor no meio do trabalho);
- novo: **o build de produção**, `npm run build && npx astro preview --port 4323`. Não verifique no dev server: ele otimiza cada imagem na primeira requisição (imagens aparecem em branco nos screenshots) e o `Astro.url` difere do build.

Desktop — em cada site, para cada rota:
```js
'H=' + document.documentElement.scrollHeight + ' | ' +
  [...document.querySelectorAll('header, main section, footer')].map(e => Math.round(e.getBoundingClientRect().height)).join(' ')
```

Mobile (390px) — `resize_window` nem sempre tem efeito na janela controlada. Meça dentro de iframes da **mesma origem** (para poder ler o DOM): abra qualquer página do site e rode:
```js
const measure = async (routes) => { const out = []; for (const r of routes) {
  const f = document.createElement('iframe'); f.style.cssText = 'width:390px;height:800px;border:0;position:absolute;left:-2000px';
  f.src = r; document.body.append(f); await new Promise(res => f.onload = res); await new Promise(res => setTimeout(res, 400));
  const d = f.contentDocument;
  out.push(r + ' H=' + d.documentElement.scrollHeight + ' | ' + [...d.querySelectorAll('main section, footer')].map(e => Math.round(e.getBoundingClientRect().height)).join(' '));
  f.remove(); } return out.join('\n'); };
await measure(['/', '/empresa', '/contato']);
```
Repita no outro servidor (com as rotas no formato dele) e compare as colunas.

Se `innerWidth` voltar 0 (janela minimizada), abra uma aba nova com `tabs_create_mcp`, feche a antiga e chame `tabs_context_mcp` de novo.

## 4. Visual (screenshots)

Antes de cada screenshot, neutralize o que depende de tempo — a janela controlada costuma estar em segundo plano, onde o Chrome estrangula `requestAnimationFrame`, transições e lazy-loading:
```js
const st = document.createElement('style');
st.textContent = '[style*=opacity]{opacity:1!important;transform:none!important}';
document.head.append(st);
document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; i.src = i.src; });
```
Mesmo assim, screenshots reduzidos às vezes mostram um quadro antigo (imagem "em branco", elemento sobreposto). Antes de concluir que há bug, confirme com `computer.zoom` na região ou com `document.elementFromPoint()`.

Para cada rota, compare original × novo nas mesmas posições de rolagem, em desktop e (com iframes visíveis lado a lado, 390px) em mobile. Seção por seção:
- ordem e presença das seções; cores de fundo/texto das seções e dos botões;
- tipografia (família, peso, tamanho relativo, caixa alta);
- grids (colunas por breakpoint), alinhamentos; imagens (mesmas, enquadramento parecido);
- elementos globais (header fixo/transparente, link ativo do menu, footer, botão de WhatsApp).

Interações: abra o menu mobile (clique no toggle dentro do iframe via `contentDocument`), dropdown de serviços, acordeão do FAQ, links de telefone/WhatsApp/e-mail. Dark mode: `setDarkMode()` no console (ou no `contentWindow` do iframe) — e **volte com `localStorage.removeItem('theme')`** para não deixar o navegador do usuário em modo escuro.

Critério: um visitante que conhece o site antigo reconheceria imediatamente o novo como "o mesmo site". Aceitável: variações de poucos pixels, fusão de tons quase iguais, padronização de componentes que eram inconsistentes no original. Inaceitável: seção faltando, cor de marca errada, fonte errada, grid diferente, texto diferente, imagem trocada.

Abra **todas** as rotas, mesmo as que usam o mesmo template (dados de uma entrada podem quebrar o layout) — a medição de alturas do passo 3 torna isso barato.

## 5. Qualidade técnica (rápido)

- Nenhum erro no console do navegador.
- Nenhuma cor fora dos tokens:
  ```
  grep -rnE '\[#[0-9a-fA-F]{3,8}\]|#[0-9a-fA-F]{6}\b|rgb\(|hsl\(' src/components src/pages src/layouts
  grep -rhoE '\b(text|bg|border|from|via|to|ring|fill)-(white|black|gray|slate|zinc|neutral|red|green|blue)\b' src/components src/pages
  ```
- `dist/` contém `robots.txt` e o sitemap não lista `/design-system`.
- Opcional: Lighthouse no preview — registre os números como linha de base, sem otimizar além da conversão.

## 6. Relatório

Registre em `conversion/report.md` o resultado de cada passo acima (inclusive o que ficou pendente). Se alguma divergência visual foi mantida intencionalmente, explique o motivo (geralmente: consistência do design system).
