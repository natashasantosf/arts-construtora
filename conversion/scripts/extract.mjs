// Extração descartável do conteúdo literal do site original para as collections (específica deste site).
// Lê os dumps de .claude/skills/converter-site/scripts/condense.mjs em conversion/dumps/ e o inventário.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const IN = "inputs/site-dowload";
const inv = JSON.parse(readFileSync("conversion/inventory.json", "utf8"));
const page = (r) => inv.pages.find((p) => p.route === r);
const lines = (f) => readFileSync(f, "utf8").split("\n");
const text = (l) => l.trim().replace(/^» /, "");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
const copy = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); };
const yamlStr = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars

// Texts following a line that matches `re`, collected until indentation returns to that level.
function after(ls, i) { const out = []; const ind = ls[i].search(/\S/); for (let j = i + 1; j < ls.length && ls[j].search(/\S/) > ind; j++) if (ls[j].trim().startsWith("»")) out.push(text(ls[j])); return out; }

// ---- Serviços: card (listagem /servicos) ----
const listing = lines("conversion/dumps/servicos.txt");
const cards = [];
listing.forEach((l, i) => {
  const m = l.match(/<a href="([\w-]+)\/index\.html">/);
  if (!m) return;
  const block = listing.slice(i, i + 12).join("\n");
  cards.push({
    slug: m[1],
    icon: block.match(/<svg lucide-([\w-]+)/)[1].replace(/^building2,lucide-/, ""),
    title: text(listing[i + 5]),
    summary: text(listing[i + 7]),
  });
});

const whatsappText = (href) => decodeURIComponent(href.split("text=")[1]);

cards.forEach((card, order) => {
  const ls = lines(`conversion/dumps/svc_${card.slug}.txt`);
  const find = (re) => ls.findIndex((l) => re.test(l));
  const heroImg = ls.find((l) => l.includes("_externo/images.unsplash.com"));
  const heroSrc = heroImg.match(/src="([^"]+)"/)[1].split("/").pop();
  const heroAlt = heroImg.match(/alt="([^"]+)"/)[1];
  const subtitle = text(ls[find(/text-white\/70 text-lg mt-3/) + 1]);
  const about = after(ls, find(/Sobre o Serviço/) - 2).slice(1);
  const included = [];
  const iInc = find(/O que está incluído/);
  const iHow = find(/Como trabalhamos/);
  for (let j = iInc; j < iHow; j++) if (/text-gray-600 text-sm/.test(ls[j])) included.push(text(ls[j + 1]));
  const steps = [];
  const iAside = find(/<aside/);
  for (let j = iHow; j < iAside; j++) if (/font-bold text-\[#3A3A3A\] font-montserrat mb-1/.test(ls[j])) steps.push({ title: text(ls[j + 1]), description: text(ls[j + 3]) });
  const hrefs = ls.filter((l) => l.includes("wa.me")).map((l) => l.match(/href="([^"]+)"/)[1]);
  const p = page(`/servicos/${card.slug}/`);

  const heroFile = `src/assets/heroes/${heroSrc.replace(/_[0-9a-f]{8}\.jpg$/, ".jpg")}`;
  copy(`${IN}/_externo/images.unsplash.com/${heroSrc}`, heroFile);

  const fm = [
    "---",
    `title: ${yamlStr(card.title)}`,
    `order: ${order + 1}`,
    `icon: ${card.icon}`,
    `summary: ${yamlStr(card.summary)}`,
    `subtitle: ${yamlStr(subtitle)}`,
    `heroImage: ${yamlStr("../../assets/heroes/" + heroFile.split("/").pop())}`,
    `heroImageAlt: ${yamlStr(heroAlt)}`,
    "included:",
    ...included.map((s) => `  - ${yamlStr(s)}`),
    "steps:",
    ...steps.flatMap((s) => [`  - title: ${yamlStr(s.title)}`, `    description: ${yamlStr(s.description)}`]),
    "seo:",
    `  title: ${yamlStr(p.title)}`,
    `  description: ${yamlStr(p.description)}`,
    `  image: ${yamlStr(p.og["og:image"])}`,
    "---",
    "",
    about.join("\n\n"),
    "",
  ].join("\n");
  write(`src/content/services/${card.slug}.md`, fm);
});
console.log("services:", cards.length);

// ---- Projetos (/projetos) ----
const proj = lines("conversion/dumps/projetos.txt");
const projects = [];
proj.forEach((l, i) => {
  const m = l.match(/<a \.block h-full href="\.\.\/servicos\/([\w-]+)\/index\.html">/);
  if (!m) return;
  const img = proj[i + 2];
  const src = img.match(/src="\.\.\/images\/([^"]+)"/)[1];
  copy(`${IN}/images/${src}`, `src/assets/projects/${src}`);
  projects.push({
    id: src.replace(/\.\w+$/, ""),
    order: projects.length + 1,
    service: m[1],
    category: text(proj[i + 5]),
    title: text(proj[i + 7]),
    summary: text(proj[i + 9]),
    image: `../assets/projects/${src}`,
    imageAlt: img.match(/alt="([^"]+)"/)[1],
  });
});
write("src/content/projects.json", JSON.stringify(projects, null, 2) + "\n");
console.log("projects:", projects.length);

// ---- Projetos em destaque (home) ----
const home = lines("conversion/dumps/index.txt");
const featured = [];
home.forEach((l, i) => {
  if (!/<img \.w-full h-72 object-cover/.test(l)) return;
  const src = l.match(/src="images\/([^"]+)"/)[1];
  copy(`${IN}/images/${src}`, `src/assets/projects/${src}`);
  featured.push({
    id: src.replace(/\.\w+$/, ""),
    order: featured.length + 1,
    category: text(home[i + 3]),
    title: text(home[i + 5]),
    image: `../assets/projects/${src}`,
    imageAlt: l.match(/alt="([^"]+)"/)[1],
  });
});
write("src/content/featured-projects.json", JSON.stringify(featured, null, 2) + "\n");

// ---- Depoimentos (home) ----
const testimonials = [];
home.forEach((l, i) => {
  if (!/italic/.test(l) || !/<p /.test(l)) return;
  testimonials.push({
    id: `depoimento-${testimonials.length + 1}`,
    order: testimonials.length + 1,
    rating: home.slice(i - 6, i).filter((x) => x.includes("lucide-star")).length,
    quote: text(home[i + 1]).replace(/^"|"$/g, ""),
    name: text(home[i + 4]),
    role: text(home[i + 6]),
  });
});
write("src/content/testimonials.json", JSON.stringify(testimonials, null, 2) + "\n");

// ---- FAQ (home) ----
const faqs = [];
home.forEach((l, i) => {
  if (!/<button \.w-full text-left px-6 py-5/.test(l)) return;
  faqs.push({ id: `faq-${faqs.length + 1}`, order: faqs.length + 1, question: text(home[i + 2]), answer: text(home[i + 5]) });
});
write("src/content/faqs.json", JSON.stringify(faqs, null, 2) + "\n");

// ---- Regiões (/areas-atendidas) ----
const areas = lines("conversion/dumps/areas-atendidas.txt");
const regions = [];
areas.forEach((l, i) => {
  if (!/<h2 \.font-black font-montserrat text-xl/.test(l)) return;
  const cities = [];
  for (let j = i; j < i + 40 && !(j > i && /<h2 \.font-black font-montserrat text-xl/.test(areas[j])) && !/<section/.test(areas[j]); j++)
    if (/<span \.border border-gray-200 text-xs/.test(areas[j])) cities.push(text(areas[j + 1]));
  regions.push({ id: text(areas[i + 1]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"), order: regions.length + 1, name: text(areas[i + 1]), status: text(areas[i + 3]), description: text(areas[i + 5]), cities });
});
write("src/content/regions.json", JSON.stringify(regions, null, 2) + "\n");
console.log("regions:", regions.map((r) => `${r.name}(${r.cities.length})`).join(", "));

// ---- Posts (/blog) ----
const blog = lines("conversion/dumps/blog.txt");
const dateFromPt = (s) => {
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const [, d, m, y] = s.match(/(\d+) de (\S+) de (\d{4})/);
  return `${y}-${String(months.indexOf(m) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
};
let n = 0;
blog.forEach((l, i) => {
  const img = l.match(/<img .*src="\.\.\/images\/([^"]+)" alt="([^"]+)"/);
  if (!img) return;
  const block = blog.slice(i, i + 45);
  const texts = block.filter((x) => x.trim().startsWith("»")).map(text);
  // featured: category, date, time, title, excerpt ; grid: category, time, title, excerpt, date
  const featuredPost = n === 0;
  const [category, a, b, c, d] = texts;
  const post = featuredPost
    ? { category, date: a, readingTime: b, title: c, excerpt: d }
    : { category, readingTime: a, title: b, excerpt: c, date: d };
  copy(`${IN}/images/${img[1]}`, `src/assets/posts/${img[1]}`);
  const slug = post.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 6).join("-");
  write(`src/content/posts/${slug}.md`, [
    "---",
    `title: ${yamlStr(post.title)}`,
    `category: ${yamlStr(post.category)}`,
    `publishedAt: ${dateFromPt(post.date)}`,
    `readingTime: ${yamlStr(post.readingTime)}`,
    `excerpt: ${yamlStr(post.excerpt)}`,
    `image: ${yamlStr("../../assets/posts/" + img[1])}`,
    `imageAlt: ${yamlStr(img[2])}`,
    `featured: ${featuredPost}`,
    "---",
    "",
  ].join("\n"));
  n++;
});
console.log("posts:", n);

// ---- Imagens avulsas ----
for (const [from, to] of [
  ["hero-bg.png", "src/assets/heroes/hero-home.png"],
  ["logo.png", "src/assets/brand/logo.png"],
  ["images/empresa-institucional.png", "src/assets/pages/empresa-institucional.png"],
]) copy(`${IN}/${from}`, to);
for (const [route, name] of [["/empresa/", "empresa"], ["/servicos/", "servicos"], ["/projetos/", "projetos"], ["/areas-atendidas/", "areas-atendidas"], ["/blog/", "blog"], ["/contato/", "contato"]]) {
  const img = page(route).images.find((x) => x.src.includes("_externo"));
  const file = img.src.split("/").pop();
  copy(`${IN}/_externo/images.unsplash.com/${file}`, `src/assets/heroes/page-${name}.jpg`);
}
console.log("ok");
