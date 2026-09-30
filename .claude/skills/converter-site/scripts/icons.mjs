#!/usr/bin/env node
// Extrai os SVGs inline de todas as páginas do site original e gera um módulo TS de ícones
// (nome → viewBox/corpo), pronto para um átomo Icon.astro sem dependências.
// Uso: node icons.mjs <pasta-do-site> <saida.ts>
//
// Nomes: ícones Lucide usam o nome da classe (lucide-phone → "phone"). SVGs sem nome
// (logos de redes sociais, WhatsApp…) saem como "custom-N" com um comentário do trecho do path —
// renomeie-os à mão (ex.: "whatsapp", "instagram") olhando onde aparecem no dump do condense.mjs.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , root, outFile] = process.argv;
if (!root || !outFile) {
  console.error("Uso: node icons.mjs <pasta-do-site> <saida.ts>");
  process.exit(1);
}

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });

const icons = new Map();
let custom = 0;
for (const file of walk(root)) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi)) {
    const attrs = m[1];
    const body = m[2].replace(/\s+/g, " ").trim();
    const cls = (attrs.match(/class="([^"]*)"/i) || [])[1] || "";
    const lucide = (cls.match(/lucide-(?!icon\b)([\w-]+)/) || [])[1];
    if ([...icons.values()].some((i) => i.body === body)) continue;
    const name = lucide ? lucide.replace(/(\D)(\d+)$/, "$1") : `custom-${++custom}`;
    if (icons.has(name)) continue;
    const viewBox = (attrs.match(/viewBox="([^"]*)"/i) || [])[1] || "0 0 24 24";
    const stroked = /stroke="currentColor"/i.test(attrs) || (lucide && !/fill="currentColor"/i.test(attrs));
    icons.set(name, { viewBox, filled: !stroked, body, hint: lucide ? "" : body.slice(0, 40) });
  }
}

const entries = [...icons.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, i]) => `${i.hint ? `  // ${i.hint.replace(/\*\//g, "")}…\n` : ""}  "${name}": { viewBox: "${i.viewBox}", filled: ${i.filled}, body: ${JSON.stringify(i.body)} },`)
  .join("\n");

writeFileSync(
  outFile,
  `// Inline SVG icons extracted from the original site. Add new icons here — no icon library or runtime.\n` +
    `export const icons = {\n${entries}\n} as const;\n\n` +
    `export type IconName = keyof typeof icons;\n` +
    `export const iconNames = Object.keys(icons) as [IconName, ...IconName[]];\n`,
);
console.log(`${icons.size} ícones → ${outFile} (${custom} sem nome: renomeie os "custom-N")`);
