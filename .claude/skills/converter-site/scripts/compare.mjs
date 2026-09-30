#!/usr/bin/env node
// Compara o inventário do site original com o do site novo (gerado a partir de dist/).
// Uso: node compare.mjs <inventory-original.json> <inventory-novo.json>
// Sai com código 1 se houver rotas ausentes ou canonical, título ou h1 divergentes.

import { readFile } from "node:fs/promises";

const [, , origPath, newPath] = process.argv;
if (!origPath || !newPath) {
  console.error("Uso: node compare.mjs <inventory-original.json> <inventory-novo.json>");
  process.exit(1);
}
const orig = JSON.parse(await readFile(origPath, "utf8"));
const next = JSON.parse(await readFile(newPath, "utf8"));

const key = (r) => (r === "/" ? "/" : r.replace(/\/$/, ""));
const newByRoute = new Map(next.pages.map((p) => [key(p.route), p]));
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

let critical = 0;
const lines = [];
const log = (s) => lines.push(s);

for (const o of orig.pages) {
  const n = newByRoute.get(key(o.route));
  if (!n) {
    critical++;
    log(`✗ ${o.route} — ROTA AUSENTE no site novo`);
    continue;
  }
  const issues = [];
  if (norm(o.title) !== norm(n.title)) issues.push(`title: "${o.title}" → "${n.title}"`);
  if (norm(o.description) !== norm(n.description)) issues.push(`description diferente`);
  if (n.duplicateHeadTags.length) issues.push(`tags duplicadas no head: ${n.duplicateHeadTags.join(", ")}`);
  if (o.lang && o.lang !== n.lang) issues.push(`lang: ${o.lang} → ${n.lang}`);
  for (const h of ["h1", "h2", "h3"]) {
    const missing = o.headings[h].filter((t) => !n.headings[h].map(norm).includes(norm(t)));
    const extra = n.headings[h].filter((t) => !o.headings[h].map(norm).includes(norm(t)));
    if (missing.length) issues.push(`${h} faltando: ${missing.map((t) => `"${t}"`).join(", ")}`);
    if (extra.length) issues.push(`${h} extra: ${extra.map((t) => `"${t}"`).join(", ")}`);
  }
  const diff = o.wordCount ? (n.wordCount - o.wordCount) / o.wordCount : 0;
  if (Math.abs(diff) > 0.1) issues.push(`palavras: ${o.wordCount} → ${n.wordCount} (${(diff * 100).toFixed(0)}%)`);
  const origAlts = new Set(o.images.filter((i) => i.alt).map((i) => norm(i.alt)));
  const newAlts = new Set(n.images.filter((i) => i.alt).map((i) => norm(i.alt)));
  const lostAlts = [...origAlts].filter((a) => !newAlts.has(a));
  if (lostAlts.length) issues.push(`alts perdidos: ${lostAlts.map((a) => `"${a}"`).join(", ")}`);
  if (o.jsonLd.length && !n.jsonLd.length) issues.push(`JSON-LD ausente (original tinha ${o.jsonLd.map((j) => j["@type"]).join(", ")})`);

  // Canonical: the new URL must be byte-identical to the original's (a ".html" suffix or a
  // trailing-slash change here silently moves every page in Google's eyes).
  const canonicalDiffers = (o.canonical ?? "") !== (n.canonical ?? "");
  if (canonicalDiffers) issues.push(`canonical: ${o.canonical} → ${n.canonical}`);

  if (
    canonicalDiffers ||
    norm(o.title) !== norm(n.title) ||
    o.headings.h1.map(norm).join() !== n.headings.h1.map(norm).join()
  )
    critical++;
  log(`${issues.length ? "!" : "✓"} ${o.route}${issues.length ? "\n    - " + issues.join("\n    - ") : ""}`);
}

const origRoutes = new Set(orig.pages.map((p) => key(p.route)));
const extraRoutes = next.pages.map((p) => key(p.route)).filter((r) => !origRoutes.has(r));
if (extraRoutes.length) log(`\nRotas novas (não existiam no original): ${extraRoutes.join(", ")}`);
if (next.site.brokenInternalLinks.length) {
  log(`\nLinks internos quebrados no site novo:`);
  for (const b of next.site.brokenInternalLinks) log(`  ${b.from} → ${b.to}`);
}

console.log(lines.join("\n"));
console.log(`\nResumo: ${orig.pages.length} rotas no original, ${critical} com problemas críticos (rota ausente, canonical, title ou h1 divergentes).`);
process.exit(critical ? 1 : 0);
