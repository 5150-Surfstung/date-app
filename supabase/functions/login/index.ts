// Val's own login link. Mints a one-time sign-in token with the admin API and
// emails a link straight to /date, where the app verifies it. No dependence
// on Supabase's redirect allowlist or its built-in mailer.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, 400);
  const next = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/inbox/";

  // Three links per email per ten minutes.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from("date_login_log").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= 3) return json({ error: "slow" }, 429);
  await db.from("date_login_log").insert({ email });

  // Make sure the account exists, then mint the link.
  await db.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) return json({ error: "mint" }, 500);

  const key = await secret("RESEND_API_KEY");
  if (!key) return json({ sent: false, why: "no_mail" });
  const from = (await secret("NOTIFY_FROM")) || "Val <onboarding@resend.dev>";
  const link = `${SITE}/login/?th=${encodeURIComponent(hashed)}&next=${encodeURIComponent(next)}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: email, subject: "Your way in to /date",
      text: `Tap this and you're in:\n\n${link}\n\nIt works once and expires in an hour. If you didn't ask for it, ignore this.\n\n— Val`,
    }),
  });
  return json({ sent: r.ok, why: r.ok ? undefined : "mail" });
});
