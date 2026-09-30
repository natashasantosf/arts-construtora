#!/usr/bin/env node
// Dump estrutural legível de uma página HTML (minificada ou não): uma tag por linha, indentada,
// com classes e atributos úteis, e o texto em linhas "» ...". SVGs viram "<svg lucide-nome>".
// Uso: node condense.mjs <pagina.html> [> saida.txt]
//
// Atributos NÃO são truncados de propósito: textos copiados daqui (placeholders, alts) precisam
// ser literais. Leia a seção <main> com: awk '/<main/{p=1} /<footer/{p=0} p' saida.txt

import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node condense.mjs <pagina.html>");
  process.exit(1);
}

const html = readFileSync(file, "utf8");
const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0]
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<svg\b([^>]*)>[\s\S]*?<\/svg>/gi, (_, attrs) => {
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || "";
    const names = (cls.match(/lucide-[\w-]+/g) || []).filter((n) => n !== "lucide-icon");
    return `<svg ${names.join(",")}/>`;
  });

const KEEP = ["id", "href", "src", "alt", "name", "type", "placeholder", "value", "aria-label", "title", "target", "rows", "width", "height", "style"];
const VOID = /^<(img|br|hr|input|meta|link|source|svg|wbr|area|col|embed|track)\b/i;
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[1] ?? m[2]) : undefined;
};

let depth = 0;
const out = [];
for (const token of body.split(/(<[^>]+>)/).filter((t) => t.trim())) {
  if (token.startsWith("<!--")) continue;
  if (token.startsWith("</")) {
    depth = Math.max(0, depth - 1);
    continue;
  }
  if (token.startsWith("<")) {
    const tag = token.match(/^<([\w-]+)/)?.[1] ?? "?";
    if (tag === "svg") {
      out.push("  ".repeat(depth) + token);
      continue;
    }
    const cls = attr(token, "class");
    const kept = KEEP.map((a) => [a, attr(token, a)]).filter(([, v]) => v !== undefined).map(([a, v]) => `${a}="${v}"`);
    out.push("  ".repeat(depth) + `<${tag}${cls ? ` .${cls}` : ""}${kept.length ? " " + kept.join(" ") : ""}>`);
    if (!VOID.test(token) && !token.endsWith("/>")) depth++;
  } else {
    out.push("  ".repeat(depth) + "» " + token.trim().replace(/\s+/g, " "));
  }
}
console.log(out.join("\n"));
