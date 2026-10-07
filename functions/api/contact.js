// POST /api/contact
// Needs GORILLADESK_WEBHOOK_URL (and GORILLADESK_API_KEY) before it will accept a lead.
// TURNSTILE_SECRET_KEY is optional.

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY = 12000;
const RATE_LIMIT = 8;
const RATE_WINDOW = 600;

const ALLOWED_HOSTS = new Set([
  "structurepesttx.com",
  "www.structurepesttx.com",
  "structure-pest-control.pages.dev",
  "localhost",
  "127.0.0.1",
]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clean(v, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}

function originAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return ALLOWED_HOSTS.has(host) || host.endsWith(".structure-pest-control.pages.dev");
}

async function rateLimited(request) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const url = new URL(request.url);
    url.pathname = "/__rl/" + encodeURIComponent(ip);
    url.search = "";
    const key = new Request(url.toString(), { method: "GET" });
    const hit = await caches.default.match(key);
    const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= RATE_LIMIT) return true;
    await caches.default.put(
      key,
      new Response(String(count + 1), {
        headers: { "Cache-Control": "public, max-age=" + RATE_WINDOW },
      })
    );
    return false;
  } catch {
    console.error("Rate limit check failed");
    return false;
  }
}

async function turnstileOk(request, token, secret) {
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: request.headers.get("CF-Connecting-IP") || "",
  });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const outcome = await res.json();
  return outcome.success === true;
}

export async function onRequestPost({ request, env }) {
  if (!originAllowed(request)) {
    return json({ ok: false, error: "Request was rejected" }, 403);
  }
  if (await rateLimited(request)) {
    return json({ ok: false, error: "Too many requests. Please call us instead." }, 429);
  }

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY) {
    return json({ ok: false, error: "Request is too large" }, 413);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }
  if (raw.length > MAX_BODY) {
    return json({ ok: false, error: "Request is too large" }, 413);
  }

  let data;
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      data = JSON.parse(raw);
    } else {
      data = Object.fromEntries(new URLSearchParams(raw));
    }
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }

  if (clean(data.company)) return json({ ok: true }); // bot filled the honeypot

  const lead = {
    firstName: clean(data.firstName, 100),
    lastName: clean(data.lastName, 100),
    phone: clean(data.phone, 40),
    email: clean(data.email, 200),
    address: clean(data.address, 300),
    service: clean(data.service, 100),
    message: clean(data.message, 2000),
    source: clean(data.source, 100) || "structurepesttx.com",
    page: clean(data.page, 500),
    receivedAt: new Date().toISOString(),
  };

  const missing = ["firstName", "lastName", "phone", "email", "service"].filter((k) => !lead[k]);
  if (missing.length) {
    return json({ ok: false, error: "Please fill in every required field." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ ok: false, error: "Invalid email address" }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = clean(data["cf-turnstile-response"], 2048);
    const passed = token && (await turnstileOk(request, token, env.TURNSTILE_SECRET_KEY));
    if (!passed) {
      return json({ ok: false, error: "Please confirm you are a real person and try again." }, 400);
    }
  }

  if (!env.GORILLADESK_WEBHOOK_URL) {
    console.log("Quote request refused: GorillaDesk webhook is not configured");
    return json({ ok: false, error: "Online quotes are not available yet. Please call us." }, 503);
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (env.GORILLADESK_API_KEY) headers.Authorization = `Bearer ${env.GORILLADESK_API_KEY}`;

    const res = await fetch(env.GORILLADESK_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(lead),
    });

    if (!res.ok) {
      console.error("GorillaDesk forward failed", res.status);
      return json({ ok: false, error: "Unable to submit the request right now" }, 502);
    }
  } catch {
    console.error("GorillaDesk forward error");
    return json({ ok: false, error: "Unable to submit the request right now" }, 502);
  }

  console.log("Quote request forwarded");
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: "Method not allowed" }, 405);
}
