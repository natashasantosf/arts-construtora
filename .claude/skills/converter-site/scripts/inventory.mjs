#!/usr/bin/env node
// Inventário determinístico de um site estático (HTML file-based).
// Uso: node inventory.mjs <pasta-do-site> [saida.json]
// Sem dependências: parsing por regex, suficiente para inventário (não é um DOM completo).

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, relative, dirname, extname, posix, resolve } from "node:path";

const [, , inputArg, outArg] = process.argv;
if (!inputArg) {
  console.error("Uso: node inventory.mjs <pasta-do-site> [saida.json]");
  process.exit(1);
}
const root = resolve(inputArg);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...(await walk(full)));
    } else out.push(full);
  }
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", copy: "©", reg: "®", middot: "·" };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : undefined;
};

function routeFor(file) {
  const rel = relative(root, file).split("\\").join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel.replace(/\.html?$/, "");
}

function normalizeRoute(href, fromRoute) {
  if (!href) return null;
  if (/^(https?:)?\/\//i.test(href) || /^(mailto|tel|javascript|data|whatsapp|sms):/i.test(href)) return null;
  let path = href.split("#")[0].split("?")[0];
  if (!path) return null;
  if (!path.startsWith("/")) path = posix.join(fromRoute.endsWith("/") ? fromRoute : posix.dirname(fromRoute) + "/", path);
  path = posix.normalize(path).replace(/index\.html?$/, "");
  return path;
}

function parsePage(html, route) {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [""])[0];
  const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];

  const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => stripTags(m[1]));
  const metaTags = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const metas = {};
  for (const t of metaTags) {
    const key = attr(t, "name") || attr(t, "property");
    if (!key) continue;
    (metas[key.toLowerCase()] ??= []).push(attr(t, "content") ?? "");
  }
  const canonicals = [...head.matchAll(/<link\b[^>]*rel=["']?canonical[^>]*>/gi)].map((m) => attr(m[0], "href"));
  const icons = [...head.matchAll(/<link\b[^>]*rel=["']?[^"'>]*icon[^>]*>/gi)].map((m) => attr(m[0], "href"));
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi)].map((m) => attr(m[0], "href"));
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)].map((m) => attr(m[0], "src") || attr(m[0], "type") || "inline");

  const jsonLd = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try { return JSON.parse(m[1]); } catch { return { _unparsed: m[1].trim().slice(0, 500) }; }
  });

  const headings = { h1: [], h2: [], h3: [] };
  for (const m of body.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)) headings[m[1].toLowerCase()].push(stripTags(m[2]));

  const images = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ src: attr(m[0], "src"), alt: attr(m[0], "alt") ?? null }));
  const bgImages = [...body.matchAll(/url\((['"]?)([^)'"]+)\1\)/gi)].map((m) => m[2]);

  const links = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: attr(m[0], "href") ?? null,
    text: stripTags(m[2]).slice(0, 80),
    target: attr(m[0], "target"),
    rel: attr(m[0], "rel"),
  }));
  const internalLinks = [...new Set(links.map((l) => normalizeRoute(l.href, route)).filter(Boolean))];
  const externalLinks = [...new Set(links.map((l) => l.href).filter((h) => h && /^(https?:|mailto:|tel:)/i.test(h)))];

  const forms = [...body.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)].map((m) => ({
    action: attr(m[0], "action") ?? null,
    method: attr(m[0], "method") ?? null,
    fields: [...m[1].matchAll(/<(input|textarea|select)\b[^>]*>/gi)].map((f) => ({ tag: f[1], type: attr(f[0], "type"), name: attr(f[0], "name"), placeholder: attr(f[0], "placeholder") })),
  }));

  // Esboço de seções: tags estruturais na ordem em que aparecem + primeiro heading depois de cada uma.
  const outline = [];
  const structRe = /<(header|nav|main|section|footer|aside)\b([^>]*)>/gi;
  let sm;
  while ((sm = structRe.exec(body))) {
    const after = body.slice(sm.index, sm.index + 20000);
    const h = after.match(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/i);
    outline.push({ tag: sm[1].toLowerCase(), id: attr(sm[0], "id") ?? null, class: (attr(sm[0], "class") || "").slice(0, 200), firstHeading: h ? `${h[1]}: ${stripTags(h[2]).slice(0, 80)}` : null });
  }

  const text = stripTags(body.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " "));
  const classAttrs = [...html.matchAll(/\sclass\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);

  const duplicateHeadTags = [];
  if (titles.length > 1) duplicateHeadTags.push("title");
  if (canonicals.length > 1) duplicateHeadTags.push("canonical");
  for (const [k, v] of Object.entries(metas)) if (v.length > 1) duplicateHeadTags.push(k);

  return {
    route,
    lang: (html.match(/<html\b[^>]*\slang=["']?([^"'\s>]+)/i) || [])[1] ?? null,
    // Valores finais escolhidos depois (pickPageSpecific), pois tags duplicadas são comuns em SPAs exportadas.
    title: null,
    description: null,
    canonical: null,
    robots: null,
    og: {},
    _all: { title: titles, canonical: canonicals, ...metas },
    duplicateHeadTags,
    icons,
    headings,
    wordCount: text ? text.split(" ").length : 0,
    images,
    backgroundImages: [...new Set(bgImages)],
    internalLinks,
    externalLinks,
    forms,
    jsonLd,
    outline,
    stylesheets,
    scripts,
    _classAttrs: classAttrs,
    _text: text,
  };
}

const files = await walk(root);
const htmlFiles = files.filter((f) => /\.html?$/i.test(f)).sort();
const pages = [];
for (const f of htmlFiles) pages.push(parsePage(await readFile(f, "utf8"), routeFor(f)));

// ---- Tags duplicadas: escolher o valor específico da página ----
// SPAs pré-renderizadas (React Helmet etc.) deixam as tags genéricas do index.html E as da página.
// Para cada tag com vários valores, escolhemos o valor que aparece em menos páginas (o específico).
const valueFreq = {};
for (const p of pages) for (const [k, vals] of Object.entries(p._all)) for (const v of new Set(vals)) (valueFreq[k] ??= {})[v] = (valueFreq[k][v] || 0) + 1;
const pick = (p, k) => {
  const vals = p._all[k];
  if (!vals?.length) return null;
  return [...vals].sort((a, b) => valueFreq[k][a] - valueFreq[k][b] || vals.lastIndexOf(b) - vals.lastIndexOf(a))[0];
};
for (const p of pages) {
  p.title = pick(p, "title");
  p.description = pick(p, "description");
  p.canonical = pick(p, "canonical");
  p.robots = pick(p, "robots");
  p.og = Object.fromEntries(Object.keys(p._all).filter((k) => k.startsWith("og:") || k.startsWith("twitter:")).map((k) => [k, pick(p, k)]));
  p.allHeadValues = Object.fromEntries(Object.entries(p._all).filter(([, v]) => v.length > 1));
  delete p._all;
}

// ---- Nível do site ----
const routes = new Set(pages.map((p) => p.route));
const assetSet = new Set(files.map((f) => "/" + relative(root, f).split("\\").join("/")));
const routeExists = (r) => routes.has(r) || routes.has(r.endsWith("/") ? r : r + "/") || routes.has(r.replace(/\/$/, "")) || assetSet.has(r);
const brokenInternalLinks = [];
for (const p of pages) for (const l of p.internalLinks) if (!routeExists(l)) brokenInternalLinks.push({ from: p.route, to: l });

const colorCount = {};
const bump = (c) => (colorCount[c.toLowerCase()] = (colorCount[c.toLowerCase()] || 0) + 1);
for (const p of pages) for (const c of p._classAttrs) for (const m of c.matchAll(/\[(#[0-9a-fA-F]{3,8})\]/g)) bump(m[1]);
const arbitraryColors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).map(([color, count]) => ({ color, count }));

const classCount = {};
for (const p of pages) for (const c of p._classAttrs) for (const cls of c.split(/\s+/)) if (cls) classCount[cls] = (classCount[cls] || 0) + 1;
const topClasses = Object.entries(classCount).sort((a, b) => b[1] - a[1]).slice(0, 80).map(([cls, count]) => ({ cls, count }));

const cssFiles = files.filter((f) => extname(f).toLowerCase() === ".css");
const fonts = new Set();
const cssVars = {};
for (const f of cssFiles) {
  const css = await readFile(f, "utf8");
  for (const m of css.matchAll(/family=([^&"')]+)/g)) for (const fam of decodeURIComponent(m[1]).split("|")) fonts.add(fam.split(":")[0].replace(/\+/g, " "));
  for (const m of css.matchAll(/@font-face\s*{[^}]*font-family:\s*['"]?([^;'"]+)/g)) fonts.add(m[1].trim());
  const rootBlock = css.match(/:root\s*{([^}]*)}/);
  if (rootBlock) for (const m of rootBlock[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) cssVars[m[1]] = m[2].trim();
}
for (const p of pages) for (const s of p.stylesheets) if (s && /fonts\.googleapis/.test(s)) for (const m of s.matchAll(/family=([^&]+)/g)) fonts.add(decodeURIComponent(m[1]).split(":")[0].replace(/\+/g, " "));

const imageFiles = [];
for (const f of files.filter((f) => /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(f))) {
  imageFiles.push({ path: relative(root, f).split("\\").join("/"), bytes: (await stat(f)).size });
}

// Blocos de texto repetidos entre páginas (header/footer/CTA globais) — ajudam a identificar componentes globais.
const sentenceCount = {};
for (const p of pages) for (const s of new Set(p._text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40))) sentenceCount[s] = (sentenceCount[s] || 0) + 1;
const repeatedText = Object.entries(sentenceCount).filter(([, c]) => c >= Math.max(2, Math.ceil(pages.length / 2))).map(([text, pagesCount]) => ({ text: text.slice(0, 160), pagesCount })).slice(0, 40);

for (const p of pages) { delete p._classAttrs; delete p._text; }

const result = {
  generatedAt: new Date().toISOString(),
  input: root,
  site: {
    pageCount: pages.length,
    routes: [...routes],
    langs: [...new Set(pages.map((p) => p.lang))],
    fonts: [...fonts],
    cssFiles: cssFiles.map((f) => relative(root, f).split("\\").join("/")),
    rootCssVariables: cssVars,
    arbitraryColors,
    topClasses,
    imageFiles,
    brokenInternalLinks,
    pagesWithDuplicateHeadTags: pages.filter((p) => p.duplicateHeadTags.length).map((p) => ({ route: p.route, tags: p.duplicateHeadTags })),
    repeatedText,
  },
  pages,
};

const out = outArg ? resolve(outArg) : null;
if (out) {
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(result, null, 2));
  console.log(`Inventário: ${pages.length} páginas → ${out}`);
  console.log(`Fontes: ${[...fonts].join(", ") || "(nenhuma detectada)"}`);
  console.log(`Cores arbitrárias: ${arbitraryColors.slice(0, 10).map((c) => `${c.color}×${c.count}`).join(", ") || "(nenhuma)"}`);
  console.log(`Links internos quebrados: ${brokenInternalLinks.length}`);
  for (const p of pages) console.log(`  ${p.route.padEnd(50)} ${String(p.wordCount).padStart(5)} palavras  h1: ${p.headings.h1[0] ?? "-"}`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
