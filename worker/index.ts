/**
 * Worker entry: the site itself is static (Astro → dist/), served by the assets binding.
 * This script only runs for /api/* (see `assets.run_worker_first` in wrangler.jsonc).
 *
 * POST /api/contato — checks the Turnstile captcha, validates the quote form from /contato,
 * stores it in D1 and, when e-mail is configured (Resend or the EMAIL binding), forwards it to the sales inbox.
 */

// Minimal types for the bindings used here (avoids adding @cloudflare/workers-types).
interface D1Result {
  meta: { last_row_id: number };
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface SendEmail {
  send(message: {
    to: string;
    from: { email: string; name?: string };
    replyTo?: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  /** Resend API key (Worker secret). When set, e-mail goes through Resend instead of the EMAIL binding. */
  RESEND_API_KEY?: string;
  /** Cloudflare Email Sending (Workers Paid plan only); alternative to Resend. */
  EMAIL?: SendEmail;
  EMAIL_TO?: string;
  EMAIL_FROM?: string;
  /** Turnstile widget secret (set as a Worker secret, never in wrangler.jsonc). */
  TURNSTILE_SECRET?: string;
  /** Comma-separated hostnames the form may be served from; subdomains of each are accepted. */
  TURNSTILE_HOSTNAMES?: string;
}

const LIMITS = { nome: 120, telefone: 40, email: 200, cidade: 120, servico: 120, mensagem: 5000 } as const;
type Field = keyof typeof LIMITS;
const FIELDS = Object.keys(LIMITS) as Field[];

/** Hidden field real visitors never fill in; bots that fill every input do. */
const HONEYPOT = "website";

/** Must match data-action on the widget in ContactSection.astro. */
const TURNSTILE_ACTION = "contato";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contato") {
      if (request.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405, { Allow: "POST" });
      return handleContact(request, env, ctx);
    }
    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "Não encontrado." }, 404);

    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Browsers without JS post the form directly; answer them with a redirect instead of JSON.
  const wantsHtml = (request.headers.get("Accept") ?? "").includes("text/html");
  const respond = (ok: boolean, error?: string, status = ok ? 200 : 400) =>
    wantsHtml
      ? Response.redirect(new URL(`/contato?${ok ? "enviado=1" : "erro=1"}#formulario`, request.url).toString(), 303)
      : json(ok ? { ok } : { ok, error }, status);

  let data: Record<string, string>;
  try {
    data = await readBody(request);
  } catch {
    return respond(false, "Não foi possível ler o formulário.");
  }

  // Pretend success so bots don't learn they were filtered.
  if (data[HONEYPOT]) return respond(true);

  if (!(await verifyTurnstile(env, data["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return respond(false, "Não conseguimos confirmar que você não é um robô. Faça a verificação e envie de novo.", 403);
  }

  const contact = {} as Record<Field, string>;
  for (const field of FIELDS) {
    const value = (data[field] ?? "").trim();
    if (!value) return respond(false, "Preencha todos os campos obrigatórios.");
    if (value.length > LIMITS[field]) return respond(false, "Algum campo passou do tamanho máximo.");
    contact[field] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return respond(false, "Informe um e-mail válido.");

  let id: number;
  try {
    const result = await env.DB.prepare(
      `INSERT INTO contatos (nome, telefone, email, cidade, servico, mensagem, origem, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        contact.nome,
        contact.telefone,
        contact.email,
        contact.cidade,
        contact.servico,
        contact.mensagem,
        new URL(request.url).host,
        (request.headers.get("User-Agent") ?? "").slice(0, 300),
      )
      .run();
    id = result.meta.last_row_id;
  } catch (error) {
    console.error("[contato] falha ao gravar no D1", error);
    return respond(false, "Não foi possível enviar agora. Tente novamente em instantes.", 500);
  }

  // E-mail never blocks or fails the visitor's submission: the row is already saved.
  if ((env.RESEND_API_KEY || env.EMAIL) && env.EMAIL_TO && env.EMAIL_FROM) ctx.waitUntil(forwardByEmail(env, id, contact));

  return respond(true);
}

/** Server-side check of the Turnstile token; fails closed on any error or missing config. */
async function verifyTurnstile(env: Env, token: string | undefined, ip: string | null): Promise<boolean> {
  const hostnames = (env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (!env.TURNSTILE_SECRET || hostnames.length === 0) {
    console.error("[contato] TURNSTILE_SECRET ou TURNSTILE_HOSTNAMES não configurado");
    return false;
  }
  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    const result = (await response.json()) as { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
    const host = (result.hostname ?? "").toLowerCase();
    const hostOk = hostnames.some((h) => host === h || host.endsWith(`.${h}`));
    if (result.success && result.action === TURNSTILE_ACTION && hostOk) return true;
    console.warn("[contato] turnstile recusado", { codes: result["error-codes"], action: result.action, hostname: result.hostname });
    return false;
  } catch (error) {
    console.error("[contato] falha no siteverify", error);
    return false;
  }
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("Content-Type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

async function forwardByEmail(env: Env, id: number, c: Record<Field, string>) {
  const rows: [string, string][] = [
    ["Nome", c.nome],
    ["Telefone / WhatsApp", c.telefone],
    ["E-mail", c.email],
    ["Cidade", c.cidade],
    ["Tipo de serviço", c.servico],
    ["Mensagem", c.mensagem],
  ];
  const message = {
    to: env.EMAIL_TO!,
    fromName: "Site Art's Construtora",
    from: env.EMAIL_FROM!,
    replyTo: c.email,
    subject: `Novo pedido de orçamento — ${c.nome} (${c.cidade})`,
    text: `Novo contato pelo site (#${id})\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n`,
    html: `<h2>Novo contato pelo site (#${id})</h2><table cellpadding="6">${rows
      .map(([k, v]) => `<tr><th align="left" valign="top">${k}</th><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table>`,
  };
  let status = "enviado";
  try {
    if (env.RESEND_API_KEY) {
      // Resend (free tier) — used instead of Cloudflare Email Sending, which needs the Workers Paid plan.
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${message.fromName} <${message.from}>`,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
    } else {
      await env.EMAIL!.send({
        to: message.to,
        from: { email: message.from, name: message.fromName },
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    }
  } catch (error) {
    status = "falhou";
    console.error("[contato] falha ao enviar e-mail", error);
  }
  await env.DB.prepare("UPDATE contatos SET email_status = ? WHERE id = ?").bind(status, id).run();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
