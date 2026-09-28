// Val's emails. One per event, in her voice. Called by the app right after
// a /hey, /wing or /chat is created. Idempotent: notified_at guards each row.
// Needs RESEND_API_KEY; without it, it records nothing and returns skipped.
// (Deployed copy lives in Supabase; keep this file in sync.)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = Deno.env.get("SITE_URL") ?? "https://date-surfstung-systems.vercel.app";
const FROM = Deno.env.get("NOTIFY_FROM") ?? "Val <onboarding@resend.dev>";

async function send(to: string, subject: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));
  const kind = body.kind as string;

  if (kind === "hey") {
    const { data: h } = await db.from("date_heys").select("*").eq("to_handle", body.to_handle).eq("from_email", String(body.from_email).toLowerCase())
      .is("notified_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!h) return json({ skipped: "none" });
    const { data: to } = await db.from("date_handles").select("*").eq("handle", h.to_handle).maybeSingle();
    const { data: from } = await db.from("date_handles").select("*").eq("email", h.from_email).maybeSingle();
    if (!to || !from) return json({ skipped: "missing" });
    const ok = await send(to.email, `/${from.handle} sent you a /hey`,
      `${to.name} —\n\n/${from.handle}${from.tag ? ` /${from.tag}` : ""} sent you a /hey.${h.note ? ` Their note: "${h.note}"` : ""}\n\nTheir /vibe is waiting in your inbox. Yes opens a /chat. No is silent — they never know.\n\n${SITE}/inbox/\n\n— Val`);
    await db.from("date_heys").update({ notified_at: new Date().toISOString() }).eq("id", h.id);
    return json({ sent: ok });
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
    await db.from("date_wings").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
    return json({ sent: ok });
  }

  if (kind === "chat") {
    const { data: c } = await db.from("date_chats").select("*").eq("id", body.id).is("notified_at", null).maybeSingle();
    if (!c) return json({ skipped: "none" });
    const results = await Promise.all([
      send(c.a_email, `You and /${c.b_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`),
      send(c.b_email, `You and /${c.a_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`),
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
      }
      results.debriefs++;
    }
    return json(results);
  }

  return json({ error: "unknown kind" }, 400);
});
