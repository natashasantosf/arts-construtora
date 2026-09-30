#!/usr/bin/env node
// Converte cores sRGB (hex) para oklch(), o formato dos tokens do template. Sem dependências.
// Uso: node oklch.mjs 6FA43A "#3A3A3A" fff
// Também imprime o contraste WCAG contra branco e preto, para checar pares X / X-foreground.

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function parse(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? [...h].map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}

export function hexToOklch(hex) {
  const [r, g, b] = parse(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return C < 0.0005 ? `oklch(${(L * 100).toFixed(1)}% 0 0)` : `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
}

const luminance = (hex) => {
  const [r, g, b] = parse(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

if (process.argv[1]?.endsWith("oklch.mjs")) {
  for (const hex of process.argv.slice(2)) {
    console.log(
      `#${hex.replace("#", "").toUpperCase().padEnd(6)}  ${hexToOklch(hex).padEnd(26)}  vs branco ${contrast(hex, "fff").toFixed(2)}:1  vs preto ${contrast(hex, "000").toFixed(2)}:1`,
    );
  }
}
