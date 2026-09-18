/**
 * Приймач заявок: сайт → Telegram власника.
 *
 * Один Worker на одного клієнта. Безкоштовний тариф Cloudflare —
 * 100 000 запитів на добу, чого для сайту малого бізнесу вистачає з запасом.
 *
 * Секрети (ставляться один раз, у код не потрапляють):
 *   npx wrangler secret put TELEGRAM_TOKEN
 *   npx wrangler secret put TELEGRAM_CHAT_ID
 *   npx wrangler secret put TURNSTILE_SECRET   (необовʼязково)
 *
 * Змінна ALLOWED_ORIGIN задається у wrangler.toml — домен сайту клієнта.
 */

const MAX_FIELD = 2000;

function corsHeaders(origin, allowed) {
  const ok = allowed === "*" || origin === allowed;
  return {
    "Access-Control-Allow-Origin": ok ? origin || allowed : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function esc(s) {
  return String(s ?? "")
    .slice(0, MAX_FIELD)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function verifyTurnstile(token, secret, ip) {
  if (!secret) return true;
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json();
  return data.success === true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "*";
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }
    if (allowed !== "*" && origin && origin !== allowed) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400, headers: cors });
    }

    // Шар 1 — honeypot. Бот заповнює приховане поле, людина ні.
    // Відповідаємо 200, щоб бот не дізнався, що його впіймали.
    if (data.company) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Шар 2 — Turnstile, якщо підключений.
    const ip = request.headers.get("CF-Connecting-IP");
    const passed = await verifyTurnstile(data["cf-turnstile-response"], env.TURNSTILE_SECRET, ip);
    if (!passed) {
      return new Response("Failed verification", { status: 403, headers: cors });
    }

    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    if (!name || phone.replace(/\D/g, "").length < 10) {
      return new Response("Invalid payload", { status: 422, headers: cors });
    }

    const cf = request.cf || {};
    const lines = [
      `<b>Нова заявка з сайту</b>`,
      ``,
      `<b>Імʼя:</b> ${esc(name)}`,
      `<b>Телефон:</b> ${esc(phone)}`,
      data.message ? `<b>Повідомлення:</b> ${esc(data.message)}` : null,
      ``,
      `<i>${esc(cf.city || "")}${cf.city ? ", " : ""}${esc(cf.country || "")}</i>`,
      `<i>${esc(data.page || "")}</i>`,
    ].filter(Boolean);

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      const detail = await tgRes.text();
      console.error("telegram error", tgRes.status, detail);
      return new Response("Upstream error", { status: 502, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
