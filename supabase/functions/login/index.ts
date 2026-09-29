// Val's own sign-in email: a code (6 or 8 digits, per the project setting;
// works inside the installed app, where links open the browser instead) plus
// a one-tap link as backup. Minted with the admin API, so there's no
// dependence on Supabase's redirect allowlist or its built-in mailer.
// (Deployed copy lives in Supabase; keep this file in sync.)
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = Deno.env.get("SITE_URL") ?? "https://date-surfstung-systems.vercel.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function secret(name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await db.rpc("date_secret", { p_name: name });
  return typeof data === "string" ? data : "";
}

function html(code: string, link: string) {
  const digits = code.split("").map((d) =>
    `<td style="width:36px;height:52px;background:#FFF3EA;border-radius:12px;text-align:center;font:800 26px/52px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#141414">${d}</td><td style="width:5px"></td>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#FFF3EA;padding:24px 12px">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#141414">
  <div style="background:#FF3B2F;padding:22px 28px;font:800 28px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#fff;letter-spacing:-0.03em">/date</div>
  <div style="padding:28px">
    <div style="font:800 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#FF3B2F">Your code</div>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:14px 0 6px"><tr>${digits}</tr></table>
    <p style="font-size:15px;line-height:1.5;color:#555;margin:14px 0 22px">Type it where you asked. It works once, for an hour.</p>
    <a href="${link}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:14px 26px">Or tap to sign in</a>
    <p style="font-size:13px;line-height:1.5;color:#888;margin:26px 0 0">Didn&rsquo;t ask for this? Ignore it; nothing happens. &mdash; Val</p>
  </div>
</div>
<p style="text-align:center;font-size:12px;color:#999;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">/date &middot; Charleston</p>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, 400);
  const next = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/me/";

  // Bots fill the hidden field; people never see it. Pretend it worked, send nothing.
  if (typeof body.website === "string" && body.website.trim()) return json({ sent: true, digits: 6 });

  // Limits: 4 per email / 10 min, 8 per network / 10 min, 30 per network / day,
  // 250 site-wide / hour (keeps a flood from burning the email quota).
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
  const n = async (col: string | null, val: string | null, since: string) => {
    let q = db.from("date_login_log").select("id", { count: "exact", head: true }).gte("created_at", since);
    if (col && val) q = q.eq(col, val);
    return (await q).count ?? 0;
  };
  if (await n("email", email, ago(10 * 60e3)) >= 4) return json({ error: "slow" }, 429);
  if (ip !== "unknown" && (await n("ip", ip, ago(10 * 60e3)) >= 8 || await n("ip", ip, ago(24 * 3600e3)) >= 30)) return json({ error: "slow" }, 429);
  if (await n(null, null, ago(3600e3)) >= 250) return json({ error: "busy" }, 503);
  await db.from("date_login_log").insert({ email, ip });

  await db.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  const code = data?.properties?.email_otp;
  if (error || !hashed || !code) return json({ error: "mint" }, 500);

  const key = await secret("RESEND_API_KEY");
  if (!key) return json({ sent: false, why: "no_mail" });
  const from = (await secret("NOTIFY_FROM")) || "Val <onboarding@resend.dev>";
  const link = `${SITE}/login/?th=${encodeURIComponent(hashed)}&next=${encodeURIComponent(next)}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: email, reply_to: "hello@surfstung.com",
      subject: `${code} is your /date code`,
      text: `Your /date code: ${code}\n\nType it where you asked. It works once, for an hour.\n\nOr tap to sign in: ${link}\n\nDidn't ask for this? Ignore it. — Val`,
      html: html(code, link),
    }),
  });
  // The code's length is the project's setting (6 or 8); the app sizes its boxes to match.
  return json({ sent: r.ok, digits: code.length, why: r.ok ? undefined : "mail" });
});
