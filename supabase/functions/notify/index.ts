// Val's emails. One per event, in her voice. Called by the app right after
// a /hey, /wing or /chat is created. Idempotent: notified_at guards each row.
// Needs a Resend key (function secret, else Vault via date_secret()); without
// one it records nothing and returns skipped.
// (Deployed copy lives in Supabase; keep this file in sync.)
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// A setting from the function's env, else from Vault. Only the service role
// can call date_secret(), so none of this is reachable from the browser.
const cache: Record<string, string> = {};
async function secret(name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  if (cache[name] !== undefined) return cache[name];
  const { data } = await db.rpc("date_secret", { p_name: name });
  cache[name] = typeof data === "string" ? data : "";
  return cache[name];
}

// Web push. The VAPID pair is made once, by this function, and kept in Vault.
let vapid: { publicKey: string; privateKey: string } | null = null;
async function ensureVapid() {
  if (vapid) return vapid;
  let pub = await secret("VAPID_PUBLIC_KEY");
  let priv = await secret("VAPID_PRIVATE_KEY");
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    await db.rpc("date_set_secret", { p_name: "VAPID_PUBLIC_KEY", p_value: k.publicKey });
    await db.rpc("date_set_secret", { p_name: "VAPID_PRIVATE_KEY", p_value: k.privateKey });
    pub = cache["VAPID_PUBLIC_KEY"] = k.publicKey;
    priv = cache["VAPID_PRIVATE_KEY"] = k.privateKey;
  }
  vapid = { publicKey: pub, privateKey: priv };
  return vapid;
}

type Note = { title: string; body: string; url?: string; tag?: string };
async function push(email: string, note: Note): Promise<number> {
  const { data: subs } = await db.from("date_push_subs").select("*").eq("email", email);
  if (!subs?.length) return 0;
  const v = await ensureVapid();
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(note),
        { vapidDetails: { subject: "mailto:info@surfstung.com", publicKey: v.publicKey, privateKey: v.privateKey }, TTL: 6 * 3600 },
      );
      sent++;
      await db.from("date_push_subs").update({ last_ok_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("date_push_subs").delete().eq("id", s.id);
    }
  }
  return sent;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = Deno.env.get("SITE_URL") ?? "https://date-surfstung-systems.vercel.app";
const from = async () => (await secret("NOTIFY_FROM")) || "Val <onboarding@resend.dev>";

async function send(to: string, subject: string, text: string) {
  const key = await secret("RESEND_API_KEY");
  if (!key) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: await from(), to, subject, text }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.json().catch(() => ({}));
  const kind = body.kind as string;

  if (kind === "status") {
    // Which of Val's keys are wired. Booleans only, never the values.
    const v = await ensureVapid();
    return json({ resend: Boolean(await secret("RESEND_API_KEY")), anthropic: Boolean(await secret("ANTHROPIC_API_KEY")), push: Boolean(v.publicKey && v.privateKey), from: await from(), site: SITE });
  }

  if (kind === "test") {
    // Admin only: one email or one push, to the caller, so the pipes can be
    // checked from the console without touching a member.
    const auth = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    }).auth.getUser();
    const me = user?.email?.toLowerCase();
    if (!me) return json({ error: "login" }, 401);
    const { data: adminRow } = await db.from("date_admins").select("email").eq("email", me).maybeSingle();
    if (!adminRow) return json({ error: "admin" }, 403);
    if (body.what === "push") {
      const pushed = await push(me, { title: "Val, checking the line", body: "If you can read this, lock-screen notes work.", url: `${SITE}/console/`, tag: "test" });
      return json({ pushed });
    }
    const sent = await send(me, "Val, checking the line", `If you can read this, email works.\n\n${SITE}/status/\n\n— Val`);
    return json({ sent });
  }

  if (kind === "hey") {
    const { data: h } = await db.from("date_heys").select("*").eq("to_handle", body.to_handle).eq("from_email", String(body.from_email).toLowerCase())
      .is("notified_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!h) return json({ skipped: "none" });
    const { data: to } = await db.from("date_handles").select("*").eq("handle", h.to_handle).maybeSingle();
    const { data: from } = await db.from("date_handles").select("*").eq("email", h.from_email).maybeSingle();
    if (!to || !from) return json({ skipped: "missing" });
    const ok = await send(to.email, `/${from.handle} sent you a /hey`,
      `${to.name} —\n\n/${from.handle}${from.tag ? ` /${from.tag}` : ""} sent you a /hey.${h.note ? ` Their note: "${h.note}"` : ""}\n\nTheir /vibe is waiting in your inbox. Yes opens a /chat. No is silent — they never know.\n\n${SITE}/inbox/\n\n— Val`);
    const pushed = await push(to.email, { title: `/${from.handle} sent you a /hey`, body: "Their /vibe is in your inbox. Yes opens a /chat. No is silent.", url: `${SITE}/inbox/`, tag: "hey" });
    await db.from("date_heys").update({ notified_at: new Date().toISOString() }).eq("id", h.id);
    return json({ sent: ok, pushed });
  }

  if (kind === "wing") {
    const { data: w } = await db.from("date_wings").select("*").eq("subject_handle", body.subject).is("notified_at", null)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!w) return json({ skipped: "none" });
    const { data: winger } = await db.from("date_handles").select("*").eq("email", w.from_email).maybeSingle();
    const toEmail = w.to_email ?? (await db.from("date_handles").select("email,name").eq("handle", w.to_handle).maybeSingle()).data?.email;
    if (!toEmail) return json({ skipped: "missing" });
    const ok = await send(toEmail, `/${winger?.handle ?? "a friend"} thinks you should meet /${w.subject_handle}`,
      w.to_handle
        ? `/${winger?.handle} passed you a /name: /${w.subject_handle}.${w.note ? ` "${w.note}"` : ""}\n\nHave a look. If you're into it, send the /hey — it's still theirs to say yes.\n\n${SITE}/inbox/\n\n— Val`
        : `/${winger?.handle} is on /date, a matchmaking thing in Charleston, and thinks you should meet /${w.subject_handle}.${w.note ? ` "${w.note}"` : ""}\n\nClaim a /name (thirty seconds) and I'll show you.\n\n${SITE}/claim/\n\n— Val`);
    const pushed = w.to_handle ? await push(toEmail, { title: `/${winger?.handle ?? "a friend"} thinks you should meet /${w.subject_handle}`, body: "Have a look. It's still theirs to say yes.", url: `${SITE}/inbox/`, tag: "wing" }) : 0;
    await db.from("date_wings").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
    return json({ sent: ok, pushed });
  }

  if (kind === "chat") {
    const { data: c } = await db.from("date_chats").select("*").eq("id", body.id).is("notified_at", null).maybeSingle();
    if (!c) return json({ skipped: "none" });
    const results = await Promise.all([
      send(c.a_email, `You and /${c.b_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`),
      send(c.b_email, `You and /${c.a_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`),
    ]);
    await Promise.all([
      push(c.a_email, { title: `You and /${c.b_handle}`, body: "You both said yes. Forty-eight hours to pick a time.", url: `${SITE}/chat/?c=${c.id}`, tag: `chat-${c.id}` }),
      push(c.b_email, { title: `You and /${c.a_handle}`, body: "You both said yes. Forty-eight hours to pick a time.", url: `${SITE}/chat/?c=${c.id}`, tag: `chat-${c.id}` }),
    ]);
    await db.from("date_chats").update({ notified_at: new Date().toISOString() }).eq("id", c.id);
    return json({ sent: results });
  }

  if (kind === "help") {
    // Someone answered "get me out". Val's people move first.
    const { data: c } = await db.from("date_chats").select("*").eq("id", body.id).maybeSingle();
    if (!c) return json({ skipped: "none" });
    const { data: admins } = await db.from("date_admins").select("email");
    const who = body.email as string;
    const other = c.a_email === who ? c.b_handle : c.a_handle;
    await Promise.all((admins ?? []).map((a: { email: string }) =>
      send(a.email, `CHECK-IN: ${who} needs help`, `${who} answered "get me out" on their /date with /${other}.\nChat: ${SITE}/chat/?c=${c.id}\nSpot: ${c.spot_slug ?? "?"} at ${c.date_at ?? "?"}\n\nRule 6. Move first.`)));
    await Promise.all((admins ?? []).map((a: { email: string }) =>
      push(a.email, { title: `CHECK-IN: ${who} needs help`, body: `Out with /${other} at ${c.spot_slug ?? "?"}. Rule 6. Move first.`, url: `${SITE}/console/`, tag: `help-${c.id}` })));
    return json({ ok: true });
  }

  if (kind === "clock") {
    // Called every minute by pg_cron. Two jobs, both idempotent.
    const nowIso = new Date().toISOString();
    const results: Record<string, number> = { checks: 0, debriefs: 0 };

    // 1. Check-ins that are due: "All good?"
    const { data: due } = await db.from("date_chats").select("*").eq("check_status", "pending").lte("check_at", nowIso).limit(50);
    for (const c of due ?? []) {
      await db.from("date_chats").update({ check_status: "asked" }).eq("id", c.id);
      for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
        await send(email, "All good?", `Checking in like you asked. You're out with /${other}.\n\nAll good: ${SITE}/chat/?c=${c.id}&check=ok\nGet me out: ${SITE}/chat/?c=${c.id}&check=help\n\nTap the second one and I'll give you a reason to leave. — Val`);
        await push(email, { title: "All good?", body: `You're out with /${other}. Tap if you need a way out.`, url: `${SITE}/chat/?c=${c.id}`, tag: `check-${c.id}` });
      }
      results.checks++;
    }

    // 2. The morning after: "Worth a /second?"
    const twelveHoursAgo = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const { data: done } = await db.from("date_chats").select("*").eq("status", "date_set").is("debrief_asked_at", null).lte("date_at", twelveHoursAgo).limit(50);
    for (const c of done ?? []) {
      await db.from("date_chats").update({ debrief_asked_at: nowIso }).eq("id", c.id);
      for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
        await send(email, `Worth a /second with /${other}?`, `Morning. How was it with /${other}?\n\nTell me here — it's private, they never see it. If you both say /second, I'll book it.\n\n${SITE}/chat/?c=${c.id}\n\n— Val`);
        await push(email, { title: `Worth a /second with /${other}?`, body: "Morning. Tell me here. They never see it.", url: `${SITE}/chat/?c=${c.id}`, tag: `second-${c.id}` });
      }
      results.debriefs++;
    }
    return json(results);
  }

  return json({ error: "unknown kind" }, 400);
});
