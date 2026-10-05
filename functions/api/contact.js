/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Receives the landing page contact form, validates it, and forwards the lead.
 *
 * GorillaDesk integration (to be wired up when the client provides credentials):
 *   Set these in the Cloudflare Pages project > Settings > Environment variables:
 *     GORILLADESK_WEBHOOK_URL  - GorillaDesk lead/webhook endpoint
 *     GORILLADESK_API_KEY      - API key / bearer token
 *   Optional fallback email notification:
 *     NOTIFY_EMAIL             - address to notify (requires an email provider; see TODO)
 *
 * Until those are set, the function validates and returns success so the form
 * works in development and the lead is visible in the Functions log.
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clean(v, max = 500) {
  return String(v ?? "").trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get("content-type") || "";
    data = type.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }

  // Honeypot: real users never fill this in.
  if (clean(data.company)) return json({ ok: true });

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
    return json({ ok: false, error: `Missing required fields: ${missing.join(", ")}` }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ ok: false, error: "Invalid email address" }, 400);
  }

  // Forward to GorillaDesk when configured.
  if (env.GORILLADESK_WEBHOOK_URL) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (env.GORILLADESK_API_KEY) headers.Authorization = `Bearer ${env.GORILLADESK_API_KEY}`;

      const res = await fetch(env.GORILLADESK_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(lead),
      });

      if (!res.ok) {
        console.error("GorillaDesk forward failed", res.status, await res.text());
        return json({ ok: false, error: "Unable to submit lead right now" }, 502);
      }
    } catch (err) {
      console.error("GorillaDesk forward error", err);
      return json({ ok: false, error: "Unable to submit lead right now" }, 502);
    }
  } else {
    // TODO: optional email fallback (e.g. Resend / MailChannels) using env.NOTIFY_EMAIL
    console.log("New lead (GorillaDesk not configured):", JSON.stringify(lead));
  }

  return json({ ok: true });
}

// Any non-POST method falls through to this handler.
export function onRequest() {
  return json({ ok: false, error: "Method not allowed" }, 405);
}
