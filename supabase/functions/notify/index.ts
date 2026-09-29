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

type Kind = "heys" | "chats" | "dates" | null;

// One email. `kind` is the member's switchable category; null = safety or
// system mail, which always goes. Every member email carries a one-tap stop.
async function send(to: string, subject: string, text: string, kind: Kind = null) {
  const key = await secret("RESEND_API_KEY");
  if (!key) return false;
  const { data: h } = await db.from("date_handles").select("email_prefs, unsub_token").eq("email", to).maybeSingle();
  if (kind && h?.email_prefs && h.email_prefs[kind] === false) return false;
  const stop = h?.unsub_token ? `${SITE}/unsub/?t=${h.unsub_token}${kind ? `&k=${kind}` : ""}` : null;
  const footer = `\n\n—\nEmail settings: ${SITE}/me/settings/${stop && kind ? `\nStop these: ${stop}` : ""}`;
  const headers: Record<string, string> = {};
  if (stop && kind) { headers["List-Unsubscribe"] = `<${stop}>`; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: await from(), to, reply_to: "hello@surfstung.com", subject, text: text + (h ? footer : ""), headers }),
  });
  return r.ok;
}

// Everyday member news goes to the lock screen first: free, instant. Email
// only when push didn't land (not installed, notifications off). Safety,
// status and login mail always email, via send() directly.
async function tell(to: string, subject: string, text: string, note: Note, kind: Exclude<Kind, null>) {
  const pushed = await push(to, note);
  if (pushed > 0) return { pushed, sent: false };
  return { pushed, sent: await send(to, subject, text, kind) };
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

  if (kind === "welcome") {
    // Right after a claim. Once per member; the caller must be that member.
    const auth = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    }).auth.getUser();
    const me = user?.email?.toLowerCase();
    if (!me) return json({ error: "login" }, 401);
    const { data: h } = await db.from("date_handles").select("*").eq("email", me).is("welcomed_at", null).maybeSingle();
    if (!h) return json({ skipped: "none" });
    await db.from("date_handles").update({ welcomed_at: new Date().toISOString() }).eq("email", me);
    const num = h.founding_number ? ` You're founding member #${String(h.founding_number).padStart(3, "0")}. Season I is free.` : "";
    const ok = await send(me, `/${h.handle} is yours`,
      `${h.name} —\n\n/${h.handle}${h.tag ? ` /${h.tag}` : ""} is yours.${num}\n\nGive it out instead of your number. Anyone with it can send you a /hey. I show you their /vibe first; they hear nothing until you say yes.\n\nOne thing left: your /vibe. Eight questions, three photos, sixty seconds of your voice. It's how I find your person.\n${SITE}/apply/\n\nYour badge, with your QR: ${SITE}/badge/?h=${h.handle}\n\n— Val`);
    return json({ sent: ok });
  }

  if (kind === "report") {
    // Fired by the database the moment a report lands. Val's people, first.
    const { data: r } = await db.from("date_reports").select("*").eq("id", body.id).maybeSingle();
    if (!r) return json({ skipped: "none" });
    const { data: who } = await db.from("date_handles").select("handle").eq("email", r.reporter_email).maybeSingle();
    const { data: admins } = await db.from("date_admins").select("email");
    const auto = r.auto_suspended ? "They were removed from the pool automatically. Review, then lift or ban." : "Not removed yet. Review it.";
    const subj = `${r.auto_suspended ? "REMOVED" : "REPORT"}: /${r.about_handle} — ${r.reason}`;
    const text = `${who?.handle ? `/${who.handle}` : r.reporter_email} reported /${r.about_handle}.\nReason: ${r.reason}${r.details ? `\nDetails: ${r.details}` : ""}\n\n${auto}\n${SITE}/console/\n\nRule 6. Move first.`;
    await Promise.all((admins ?? []).map(async (a: { email: string }) => {
      await send(a.email, subj, text);
      await push(a.email, { title: subj, body: auto, url: `${SITE}/console/`, tag: `report-${r.id}` });
    }));
    return json({ ok: true });
  }

  if (kind === "vibe_status") {
    // Fired by the database when a /vibe is approved, verified, waitlisted or declined. Once each.
    const { data: a } = await db.from("date_applications").select("*").eq("id", body.id).maybeSingle();
    if (!a) return json({ skipped: "none" });
    const { data: h } = await db.from("date_handles").select("handle, name").eq("email", a.email).maybeSingle();
    const name = h?.name ?? a.name ?? "";
    const sent: string[] = [];
    if (["approved", "waitlisted", "rejected"].includes(a.status) && a.status_notified !== a.status) {
      const { data: took } = await db.from("date_applications").update({ status_notified: a.status }).eq("id", a.id).or(`status_notified.is.null,status_notified.neq.${a.status}`).select("id");
      if (took?.length) {
        const msg: Record<string, [string, string]> = {
          approved: ["You're in", `${name} —\n\nI read your /vibe twice. You're in.\n\nI've picked your three closest to start, with the reason for each. After that, your whole pool is open: everyone who'd want you back. Send a /hey, send a vibe, change your vibe whenever you like.\n\n${SITE}/pool/\n\n— Val`],
          waitlisted: ["You're on the list", `${name} —\n\nYour /vibe is good. I'm balancing the pool before I open more spots, and you're on the list. You'll hear from me first, and not before.\n\n— Val`],
          rejected: ["Not this season", `${name} —\n\nThanks for trusting me with your /vibe. It's not this season. I wish you well.\n\n— Val`],
        };
        const [subject, text] = msg[a.status];
        if (await send(a.email, subject, text)) sent.push(a.status);
        if (a.status === "approved") {
          await push(a.email, { title: "You're in", body: "Val picked your first three. Your pool is open.", url: `${SITE}/pool/`, tag: "status" });
          // Val keeps an eye out: tell people this newcomer fits well (at most weekly each).
          const { data: fits } = await db.rpc("date_new_fit_nudges", { p_app: a.id });
          for (const e of (fits as string[] | null) ?? []) {
            await tell(e, "Someone new fits you", `Someone new just joined who fits you well. Have a look.\n\n${SITE}/pool/\n\n— Val`,
              { title: "Someone new fits you", body: "Val spotted a good one in your pool.", url: `${SITE}/pool/`, tag: "newfit" }, "heys");
          }
        }
      }
    }
    if (a.verified && !a.verified_notified_at) {
      const { data: took } = await db.from("date_applications").update({ verified_notified_at: new Date().toISOString() }).eq("id", a.id).is("verified_notified_at", null).select("id");
      if (took?.length && await send(a.email, "Verified", `${name} —\n\nI checked your photos and your voice against each other. You're verified, and your /name${h?.handle ? ` /${h.handle}` : ""} now says so.\n\n— Val`)) sent.push("verified");
    }
    return json({ sent });
  }

  if (kind === "found") {
    // One of them tapped "We found each other". Tell the other, gently.
    const { data: k } = await db.from("date_couples").select("*").eq("id", body.id).maybeSingle();
    if (!k || (k.a_yes && k.b_yes)) return json({ skipped: "none" });
    const [to, from] = k.a_yes ? [k.b_email, k.a_handle] : [k.a_email, k.b_handle];
    await tell(to, `/${from} thinks you found each other`, `/${from} tapped "We found each other."\n\nIf you feel the same, tap it too and you both come off the market. Nothing is shared unless you both say so.\n\n${SITE}/chat/?c=${k.chat_id}\n\n— Val`,
      { title: `/${from} thinks you found each other`, body: "Tap it too and you're both off the market.", url: `${SITE}/chat/?c=${k.chat_id}`, tag: `found-${k.id}` }, "chats");
    return json({ ok: true });
  }

  if (kind === "drop") {
    // Friday, 6pm: everyone with fresh weekend picks hears at once. Lock screen first.
    const since = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const { data: rows } = await db.from("date_picks").select("email").eq("kind", "drop").is("notified_at", null).gte("created_at", since);
    const emails = Array.from(new Set((rows ?? []).map((r: { email: string }) => r.email)));
    let told = 0;
    for (const e of emails) {
      const { data: took } = await db.from("date_picks").update({ notified_at: new Date().toISOString() }).eq("email", e).eq("kind", "drop").is("notified_at", null).select("email");
      if (!took?.length) continue;
      await tell(e, "Your weekend picks are in", `Val here. Your weekend picks just dropped.\n\n${SITE}/pool/\n\n— Val`,
        { title: "Your weekend picks are in", body: "Val just dropped them. Go look.", url: `${SITE}/pool/`, tag: "drop" }, "heys");
      told++;
    }
    return json({ told });
  }

  if (kind === "vibe_new") {
    // Someone finished their /vibe. Nobody gets in until a person approves them.
    const { data: a } = await db.from("date_applications").select("id, name, age, status").eq("id", body.id).maybeSingle();
    if (!a || a.status !== "pending_review") return json({ skipped: "none" });
    const { data: admins } = await db.from("date_admins").select("email");
    const subj = `New /vibe to approve: ${a.name}, ${a.age}`;
    await Promise.all((admins ?? []).map(async (x: { email: string }) => {
      const pushed = await push(x.email, { title: subj, body: "Photos, voice, answers. Approve, waitlist or decline.", url: `${SITE}/console/?tab=Approve`, tag: `vibe-${a.id}` });
      if (!pushed) await send(x.email, subj, `${a.name}, ${a.age}, finished their /vibe.\n\nNobody can reach them, and they can't reach anyone, until you approve them.\n${SITE}/console/?tab=Approve`);
    }));
    return json({ ok: true });
  }

  if (kind === "spot_apply") {
    // A venue applied. Val's people hear first; the venue hears "a person reviews every spot".
    const { data: v } = await db.from("date_venues").select("*").eq("slug", body.slug).maybeSingle();
    if (!v || v.status !== "pending") return json({ skipped: "none" });
    const { data: rep } = v.rep_code ? await db.from("date_reps").select("name").eq("code", v.rep_code).maybeSingle() : { data: null };
    const { data: admins } = await db.from("date_admins").select("email");
    const subj = `New /spot: ${v.name}${v.area ? ` · ${v.area}` : ""}`;
    const text = [
      `${v.name} wants to be a /date spot.`,
      ``,
      `Type: ${v.kind ?? "other"}${v.area ? ` · ${v.area}` : ""}${v.address ? `\nAddress: ${v.address}` : ""}${v.website ? `\nWeb: ${v.website}` : ""}`,
      `Contact: ${v.contact_name}${v.contact_role ? ` (${v.contact_role})` : ""} · ${v.contact_email}${v.contact_phone ? ` · ${v.contact_phone}` : ""}`,
      v.perk ? `They'd offer: ${v.perk}` : "",
      v.pitch ? `Why: ${v.pitch}` : "",
      `Would host a /night: ${v.night_ok ? "yes" : "not yet"}`,
      rep ? `Brought in by: ${rep.name} (${v.rep_code})` : "Came in on its own",
      ``,
      `Nothing is public until you approve it. Check them out first.`,
      `${SITE}/console/?tab=Spots`,
    ].filter((l) => l !== "").join("\n");
    await Promise.all((admins ?? []).map(async (a: { email: string }) => {
      await send(a.email, subj, text);
      await push(a.email, { title: subj, body: "Waiting on your approval.", url: `${SITE}/console/?tab=Spots`, tag: `spot-${v.slug}` });
    }));
    await send(v.contact_email, `We got it: ${v.name}`,
      `${v.contact_name} —\n\nThanks for putting ${v.name} forward as a /date spot.\n\nA person looks at every spot before it goes live. We keep it to places we'd send our own friends. You'll hear back from us either way, usually within two days.\n\nQuestions: just reply.\n\n— Val, the /date matchmaker`);
    return json({ ok: true });
  }

  if (kind === "spot_status") {
    // Val approved, declined or paused a spot. Tell the venue once per status.
    const { data: v } = await db.from("date_venues").select("*").eq("slug", body.slug).maybeSingle();
    if (!v || !v.contact_email || v.status_notified === v.status || v.status === "pending") return json({ skipped: "none" });
    const { data: took } = await db.from("date_venues").update({ status_notified: v.status }).eq("slug", v.slug)
      .or(`status_notified.is.null,status_notified.neq.${v.status}`).select("slug");
    if (!took?.length) return json({ skipped: "claimed" });
    const note = v.review_note ? `\n\n${v.review_note}` : "";
    const msg: Record<string, [string, string]> = {
      approved: [`${v.name} is a /date spot`,
        `${v.contact_name} —\n\nYou're in. ${v.name} is now a /date spot.${note}\n\nYour page (this is what your QR opens):\n${SITE}/spot/${v.slug}/\n\nYour spot kit — print the poster and table cards, put them where people wait or sit:\n${SITE}/spot/${v.slug}/kit/\n\nHow it works: a guest scans in, and if someone else in the room is on /date and it's mutual, Val introduces them. Nobody has to walk over. Your staff don't have to do anything.\n\nWelcome aboard.\n\n— Val`],
      declined: [`About ${v.name}`,
        `${v.contact_name} —\n\nThank you for putting ${v.name} forward. We're not adding it as a /date spot right now.${note}\n\nWe keep the list small on purpose while we grow. If things change, we'll reach out.\n\n— Val`],
      paused: [`${v.name} is paused on /date`,
        `${v.contact_name} —\n\nWe've paused ${v.name} as a /date spot for now, so it won't show in the app and its QR won't check guests in.${note}\n\nQuestions: just reply.\n\n— Val`],
    };
    const m = msg[v.status];
    const sent = m ? await send(v.contact_email, m[0], m[1]) : false;
    return json({ sent });
  }

  if (kind === "swap") {
    // Both tapped "swap numbers". Once, to both. The numbers stay in the app, not the email.
    const { data: c } = await db.from("date_chats").select("*").eq("id", body.id).not("swapped_at", "is", null).is("swap_notified_at", null).maybeSingle();
    if (!c) return json({ skipped: "none" });
    const { data: took } = await db.from("date_chats").update({ swap_notified_at: new Date().toISOString() }).eq("id", c.id).is("swap_notified_at", null).select("id");
    if (!took?.length) return json({ skipped: "dupe" });
    for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
      await tell(email, `You and /${other} swapped numbers`, `You both said yes to that too. It's in your /chat.\n\n${SITE}/chat/?c=${c.id}\n\nFrom here it's yours. I'm still here if you need me. — Val`,
        { title: `You and /${other} swapped numbers`, body: "It's in your /chat.", url: `${SITE}/chat/?c=${c.id}`, tag: `swap-${c.id}` }, "chats");
    }
    return json({ ok: true });
  }

  if (kind === "hey") {
    const { data: h } = await db.from("date_heys").select("*").eq("to_handle", body.to_handle).eq("from_email", String(body.from_email).toLowerCase())
      .is("notified_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!h) return json({ skipped: "none" });
    const { data: to } = await db.from("date_handles").select("*").eq("handle", h.to_handle).maybeSingle();
    const { data: from } = await db.from("date_handles").select("*").eq("email", h.from_email).maybeSingle();
    if (!to || !from) return json({ skipped: "missing" });
    const what = h.vibe ? `/${h.vibe}` : "a /hey";
    const { sent: ok, pushed } = await tell(to.email, `/${from.handle} sent you ${what}`,
      `${to.name} —\n\n/${from.handle}${from.tag ? ` /${from.tag}` : ""} sent you ${what}.${h.note ? ` Their note: "${h.note}"` : ""}\n\nIt's in your inbox. Yes opens a /chat. No is silent — they never know.\n\n${SITE}/inbox/\n\n— Val`,
      { title: `/${from.handle} sent you ${what}`, body: h.note ? `"${String(h.note).slice(0, 80)}"` : "Yes opens a /chat. No is silent.", url: `${SITE}/inbox/`, tag: "hey" }, "heys");
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
    const wtitle = `/${winger?.handle ?? "a friend"} thinks you should meet /${w.subject_handle}`;
    const pre = w.to_handle ? await push(toEmail, { title: wtitle, body: "Have a look. It's still theirs to say yes.", url: `${SITE}/inbox/`, tag: "wing" }) : 0;
    const ok = pre > 0 ? false : await send(toEmail, wtitle,
      w.to_handle
        ? `/${winger?.handle} passed you a /name: /${w.subject_handle}.${w.note ? ` "${w.note}"` : ""}\n\nHave a look. If you're into it, send the /hey — it's still theirs to say yes.\n\n${SITE}/inbox/\n\n— Val`
        : `/${winger?.handle} is on /date, a matchmaking thing in Charleston, and thinks you should meet /${w.subject_handle}.${w.note ? ` "${w.note}"` : ""}\n\nClaim a /name (thirty seconds) and I'll show you.\n\n${SITE}/claim/\n\n— Val`, w.to_handle ? "heys" : null);
    const pushed = pre;
    await db.from("date_wings").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
    return json({ sent: ok, pushed });
  }

  if (kind === "chat") {
    const { data: c } = await db.from("date_chats").select("*").eq("id", body.id).is("notified_at", null).maybeSingle();
    if (!c) return json({ skipped: "none" });
    const results = await Promise.all([
      tell(c.a_email, `You and /${c.b_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`,
        { title: `You and /${c.b_handle}`, body: "You both said yes. Forty-eight hours to pick a time.", url: `${SITE}/chat/?c=${c.id}`, tag: `chat-${c.id}` }, "chats"),
      tell(c.b_email, `You and /${c.a_handle} — forty-eight hours`, `${c.val_note ?? "You both said yes."}\n\n${SITE}/chat/?c=${c.id}\n\n— Val`,
        { title: `You and /${c.a_handle}`, body: "You both said yes. Forty-eight hours to pick a time.", url: `${SITE}/chat/?c=${c.id}`, tag: `chat-${c.id}` }, "chats"),
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
    // Called every minute by pg_cron. Every job is idempotent: each claims its row first.
    const nowIso = new Date().toISOString();
    const results: Record<string, number> = { checks: 0, debriefs: 0 };

    // 1. Check-ins that are due: "All good?"
    const { data: due } = await db.from("date_chats").select("*").eq("check_status", "pending").lte("check_at", nowIso).limit(50);
    for (const c of due ?? []) {
      const { data: took } = await db.from("date_chats").update({ check_status: "asked" }).eq("id", c.id).eq("check_status", "pending").select("id");
      if (!took?.length) continue;
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
      const { data: took } = await db.from("date_chats").update({ debrief_asked_at: nowIso }).eq("id", c.id).is("debrief_asked_at", null).select("id");
      if (!took?.length) continue;
      for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
        await tell(email, `Worth a /second with /${other}?`, `Morning. How was it with /${other}?\n\nTell me here — it's private, they never see it. If you both say /second, I'll book it.\n\n${SITE}/chat/?c=${c.id}\n\n— Val`,
          { title: `Worth a /second with /${other}?`, body: "Morning. Tell me here. They never see it.", url: `${SITE}/chat/?c=${c.id}`, tag: `second-${c.id}` }, "dates");
      }
      results.debriefs++;
    }
    // 3. The 48-hour clock. One nudge at 24 hours, a warm close at 48.
    results.nudges = 0; results.closes = 0; results.benched = 0;
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: slow } = await db.from("date_chats").select("*").eq("status", "open").is("nudged_at", null).lte("created_at", dayAgo).gt("closes_at", nowIso).limit(50);
    for (const c of slow ?? []) {
      const { data: took } = await db.from("date_chats").update({ nudged_at: nowIso }).eq("id", c.id).is("nudged_at", null).select("id");
      if (!took?.length) continue;
      await db.from("date_messages").insert({ chat_id: c.id, from_email: "val", body: "Twenty-four hours left. Pick a time. — Val" });
      for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
        await tell(email, `24 hours left with /${other}`, `Halfway there. Pick a time with /${other}. At forty-eight hours the /chat closes, no hard feelings.\n\n${SITE}/chat/?c=${c.id}\n\n— Val`,
          { title: `24 hours left with /${other}`, body: "Pick a time before the /chat closes.", url: `${SITE}/chat/?c=${c.id}`, tag: `chat-${c.id}` }, "chats");
      }
      results.nudges++;
    }
    const { data: expired } = await db.from("date_chats").select("*").eq("status", "open").lte("closes_at", nowIso).limit(50);
    for (const c of expired ?? []) {
      const { data: took } = await db.from("date_chats").update({ status: "closed", closed_notified_at: nowIso }).eq("id", c.id).eq("status", "open").select("id");
      if (!took?.length) continue;
      await db.from("date_messages").insert({ chat_id: c.id, from_email: "val", body: "Time's up on this one. No hard feelings either way. I'm already looking. — Val" });
      for (const [email, other] of [[c.a_email, c.b_handle], [c.b_email, c.a_handle]]) {
        await tell(email, `Closed: you and /${other}`, `Forty-eight hours came and went, so I closed it. No hard feelings either way. Your pool's still open.\n\n${SITE}/pool/\n\n— Val`,
          { title: `Closed: you and /${other}`, body: "No hard feelings. Your pool's still open.", url: `${SITE}/pool/`, tag: `chat-${c.id}` }, "chats");
      }
      results.closes++;
    }

    // 4. Two no-shows: tell them once, plainly.
    const { data: benched } = await db.from("date_handles").select("*").not("benched_at", "is", null).is("benched_notified_at", null).limit(50);
    for (const h of benched ?? []) {
      const { data: took } = await db.from("date_handles").update({ benched_notified_at: nowIso }).eq("email", h.email).is("benched_notified_at", null).select("email");
      if (!took?.length) continue;
      await send(h.email, "About your last two /dates", `${h.name} —\n\nTwo people waited for you and you didn't come. That's two, and I can't keep you in the pool. Your /name is private for now.\n\nIf I've got this wrong, reply and a person will look at it.\n\n— Val`);
      results.benched++;
    }
    return json(results);
  }

  return json({ error: "unknown kind" }, 400);
});
