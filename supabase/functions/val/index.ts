// Val's brain. Runs server-side so the Anthropic key never reaches the
// browser. Three jobs: an intro note for a pair, a two-line read of a
// person, and the five-section /brief for a set date.
import Anthropic from "npm:@anthropic-ai/sdk@^0.90";
import { createClient } from "npm:@supabase/supabase-js@2";
import { MANUAL } from "./manual.ts";

const MODEL = "claude-opus-5-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `${MANUAL}

You are Val. Write only what is asked, in Val's voice, plain text, no markdown, no headings unless the format below asks for them. Never invent facts about a person; use only what you're given. Sign with "— Val" exactly once at the end.`;

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

function person(p: Record<string, unknown>) {
  const a = (p.answers ?? {}) as Record<string, string>;
  return [
    `/${p.handle} — ${p.name}${p.age ? `, ${p.age}` : ""}${p.hood ? `, ${p.hood}` : ""}`,
    p.tag ? `/tag: /${p.tag}` : "",
    p.identity ? `${p.identity}, seeking ${p.seeking ?? "everyone"}` : "",
    a.conflict_impulse ? `Conflict: ${a.conflict_impulse}` : "",
    a.pull_away ? `When someone pulls away: ${a.pull_away}` : "",
    a.saturday ? `Saturday: ${a.saturday}` : "",
    a.life_stage ? `Life stage: ${a.life_stage}` : "",
    a.looking_for ? `Looking for: ${a.looking_for}` : "",
    a.commitment ? `Commitment, in their words: ${a.commitment}` : "",
    a.misread ? `People misread: ${a.misread}` : "",
    a.non_negotiables ? `Non-negotiables: ${a.non_negotiables}` : "",
    p.vibe ? `Bio: ${p.vibe}` : "",
  ].filter(Boolean).join("\n");
}

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
    const text = await ask(
      `Write Val's intro note that opens a /chat between these two. 2–4 short sentences: name them both, give the real reason in plain words (from the reasons below, not the numbers), mention the /spot and that the table's held, and that they have forty-eight hours to pick a time.

Person A:
${person(a)}

Person B:
${person(b)}

Why Val paired them: ${reasons.join(" ") || "gut call"}
Watch-outs (don't mention unless useful): ${flags.join(" ") || "none"}
Suggested /spot: ${spot}`,
      600,
    );
    return json({ text });
  }

  if (kind === "read") {
    if (!isAdmin) return json({ error: "admin" }, 403);
    const text = await ask(`Write Val's two-line read of this person for the console: who they actually are and what they need in a match. No flattery, no clinical words.\n\n${person(body.person)}`, 300);
    return json({ text });
  }

  if (kind === "preview") {
    // One line of Val's context for a /hey or /wing in the recipient's inbox.
    const { from, winger, note } = body;
    const text = await ask(
      `Write one or two sentences of Val's context for the person reading their inbox: why this /hey (or /wing) is worth a look. Plain, specific, no hype. ${winger ? `A friend, /${winger}, passed this /name along.` : "They sent a /hey."}${note ? ` Their note: "${note}".` : ""}\n\nThe sender:\n${person(from)}`,
      200,
    );
    return json({ text });
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
      return { ...hd, age: ap?.age, hood: ap?.neighborhood, identity: ap?.identity, seeking: ap?.seeking, answers: ap?.answers };
    };
    const [reader, other] = await Promise.all([load(forHandle), load(otherHandle)]);
    const { data: venue } = chat.spot_slug
      ? await service.from("date_venues").select("*").eq("slug", chat.spot_slug).maybeSingle()
      : { data: null };
    const text = await ask(
      `Write the /brief for the reader before their date. Five sections, each a heading on its own line exactly as written, then 1–3 short sentences:
WHERE TO GO
WHAT TO TALK ABOUT
WHAT MATTERS TO THEM
WHAT NOT TO DO
WHY THIS PAIRING

Reader (writing FOR this person, address them as "you"):
${person(reader)}

Their date:
${person(other)}

/spot: ${venue ? `${venue.name}, ${venue.area}. Perk: ${venue.perk}` : "not set yet"}
When: ${chat.date_at ?? "not set yet"}
Val's note when the chat opened: ${chat.val_note ?? ""}`,
      900,
    );
    if (!text) return json({ brief: null });
    const sections: Record<string, string> = {};
    let current = "";
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (/^(WHERE TO GO|WHAT TO TALK ABOUT|WHAT MATTERS TO THEM|WHAT NOT TO DO|WHY THIS PAIRING)$/.test(t)) { current = t; sections[current] = ""; continue; }
      if (current && t && !t.startsWith("— Val")) sections[current] = (sections[current] + " " + t).trim();
    }
    const brief = { for: forHandle, sections, text };
    await service.from("date_chats").update({ brief }).eq("id", chat.id);
    return json({ brief });
  }

  return json({ error: "unknown kind" }, 400);
});
