// Val's brain. Runs server-side so the Anthropic key never reaches the
// browser. Jobs: intro, read, preview, brief, parse. Every word she writes is
// checked against her own rules (prompts.ts) before anyone sees it: broken
// once → she rewrites with the exact fix; broken twice → the app falls back
// to her hand-written template. A bad line never reaches a member.
import Anthropic from "npm:@anthropic-ai/sdk@^0.90";
import { createClient } from "npm:@supabase/supabase-js@2";
import { MANUAL } from "./manual.ts";
import { RULES, prompts, polish, violations } from "./prompts.ts";

const MODEL = "claude-opus-5-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `${MANUAL}\n\n${RULES}`;

const url = Deno.env.get("SUPABASE_URL")!;
const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// The Anthropic key: function secret, else Vault via date_secret() (service
// role only). Cached per instance.
let cachedKey: string | undefined;
async function apiKey(): Promise<string> {
  const env = Deno.env.get("ANTHROPIC_API_KEY");
  if (env) return env;
  if (cachedKey !== undefined) return cachedKey;
  const { data } = await service.rpc("date_secret", { p_name: "ANTHROPIC_API_KEY" });
  cachedKey = typeof data === "string" ? data : "";
  return cachedKey;
}

async function ask(prompt: string, maxTokens = 1200): Promise<string> {
  const key = await apiKey();
  if (!key) return "";
  const client = new Anthropic({ apiKey: key });
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") return "";
  return res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
}

// Write, check, fix once, or hand back nothing (the app uses the template).
async function say(job: string, prompt: string, maxTokens: number, names: string[] = []): Promise<string> {
  let out = polish(await ask(prompt, maxTokens));
  if (!out) return "";
  let v = violations(out, job, names);
  if (v.length) {
    out = polish(await ask(`${prompt}\n\nYour last draft broke Val's rules (${v.join(", ")}). Rewrite it and fix exactly that.`, maxTokens));
    v = violations(out, job, names);
  }
  if (v.length) console.warn(`val:${job} fell back to template`, v);
  return v.length ? "" : out;
}

const first = (p: Record<string, unknown>) => String(p?.name ?? p?.handle ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") ?? "";
  const { data: { user } } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  }).auth.getUser();
  if (!user?.email) return json({ error: "login" }, 401);
  const me = user.email.toLowerCase();
  const { data: adminRow } = await service.from("date_admins").select("email").eq("email", me).maybeSingle();
  const isAdmin = Boolean(adminRow);

  const body = await req.json().catch(() => ({}));
  const kind = body.kind as string;

  if (kind === "intro") {
    if (!isAdmin) return json({ error: "admin" }, 403);
    const { a, b, reasons = [], flags = [], spot = "the /spot" } = body;
    return json({ text: await say("intro", prompts.intro(a, b, reasons, flags, spot), 600, [first(a), first(b)]) });
  }

  if (kind === "read") {
    if (!isAdmin) return json({ error: "admin" }, 403);
    return json({ text: await say("read", prompts.read(body.person), 300) });
  }

  if (kind === "parse") {
    // The voice interview: which option did they mean? JSON only, never a guess.
    const { question, options = [], said = "" } = body;
    if (!Array.isArray(options) || !options.length || typeof said !== "string" || !said.trim()) return json({ index: null, confidence: 0 });
    const raw = await ask(prompts.parse(String(question ?? ""), options, said), 60);
    const m = raw.match(/\{[^}]*\}/);
    try {
      const j = m ? JSON.parse(m[0]) : null;
      const idx = typeof j?.index === "number" && j.index >= 0 && j.index < options.length ? j.index : null;
      return json({ index: idx, confidence: typeof j?.confidence === "number" ? j.confidence : 0 });
    } catch { return json({ index: null, confidence: 0 }); }
  }

  if (kind === "preview") {
    const { from, winger, note } = body;
    return json({ text: await say("preview", prompts.preview(from, winger ?? null, note ?? null), 200) });
  }

  if (kind === "brief") {
    const { data: chat } = await service.from("date_chats").select("*").eq("id", body.chat_id).maybeSingle();
    if (!chat) return json({ error: "no chat" }, 404);
    if (chat.a_email !== me && chat.b_email !== me && !isAdmin) return json({ error: "not yours" }, 403);
    if (chat.brief) return json({ brief: chat.brief });
    const forHandle = chat.a_email === me ? chat.a_handle : chat.b_handle;
    const otherHandle = chat.a_email === me ? chat.b_handle : chat.a_handle;
    const load = async (h: string) => {
      const { data: hd } = await service.from("date_handles").select("*").eq("handle", h).maybeSingle();
      const { data: ap } = await service.from("date_applications").select("*").eq("email", hd?.email ?? "").maybeSingle();
      return { ...hd, tags: hd?.tags, age: ap?.age, hood: ap?.neighborhood, identity: ap?.identity, seeking: ap?.seeking, answers: ap?.answers };
    };
    const [reader, other] = await Promise.all([load(forHandle), load(otherHandle)]);
    const { data: venue } = chat.spot_slug
      ? await service.from("date_venues").select("*").eq("slug", chat.spot_slug).maybeSingle()
      : { data: null };
    const text = await say("brief", prompts.brief(reader, other,
      venue ? `${venue.name}, ${venue.area}. Perk: ${venue.perk}` : "not set yet", chat.date_at ?? "not set yet", chat.val_note ?? ""), 900);
    if (!text) return json({ brief: null });
    const sections: Record<string, string> = {};
    let current = "";
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (/^(WHERE TO GO|WHAT TO TALK ABOUT|WHAT MATTERS TO THEM|WHAT NOT TO DO|WHY THIS PAIRING)$/.test(t)) { current = t; sections[current] = ""; continue; }
      if (current && t) sections[current] = (sections[current] + " " + t.replace(/\s*— Val$/, "")).trim();
    }
    if (Object.keys(sections).length < 5) return json({ brief: null });
    const brief = { for: forHandle, sections, text };
    await service.from("date_chats").update({ brief }).eq("id", chat.id);
    return json({ brief });
  }

  return json({ error: "unknown kind" }, 400);
});
