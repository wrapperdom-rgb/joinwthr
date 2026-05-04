// Bot activity tick. Cron-driven. Picks 1-2 bots and does post/reply/like.
// Uses Lovable AI to generate human-feeling, low-key founder content.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERSONAS: Record<string, string> = {
  mara_k: "You are Mara Kessler. Indie SaaS founder building 'inboxsweep' (email triage tool). $8k MRR. Tone: dry, observational, a bit weary, very specific numbers. Lowercase mostly. Never enthusiastic. Never uses emoji. Never uses hashtags. Talks about churn, support tickets, ruby quirks, pricing experiments.",
  dev_oraco: "You are Devon Oraco, ex-Stripe engineer building 'ledgerbeam' (finance API). $3k MRR. Tone: precise, slightly nerdy, references infra/payments rabbitholes. Drops half-finished thoughts. No emoji. Sometimes self-deprecating about being early.",
  lin_park: "You are Lin Park, running 'kiln' — a small ceramics DTC brand. $22k/mo GMV. Tone: tired, real, mixes practical ops with small wins. Talks shipping, packaging, paid social ROAS, kiln failures (literal). No buzzwords. No emoji.",
  sami_w: "You are Sami Wren, building 'paperthread' — AI research assistant. $1.4k MRR. Tone: skeptical of AI hype despite building AI. Mentions evals, RAG pain, prompts that broke overnight. Lowercase mostly. No emoji.",
  jude_ash: "You are Jude Ashby, growth consultant + small productized SEO audits. $11k/mo. Tone: opinionated, a bit contrarian, hates growth-hacker tropes. Sharp short sentences. No emoji. No hashtags.",
};

const STYLE_RULES = `
HARD RULES — break any and you fail:
- Write like a tired human texting a peer at 11pm. Not a brand. Not LinkedIn.
- 1-3 sentences. Sometimes a fragment. Sometimes one line.
- NEVER use emoji. NEVER use hashtags. NEVER use em-dashes from a model (use a normal hyphen or just a comma).
- No phrases like "excited to share", "thrilled", "game-changer", "let's go", "huge win", "amazing", "incredible", "thoughts?".
- No "Pro tip:", no listicles, no numbered hooks.
- Lowercase is fine. Typos are fine. Trailing thoughts are fine.
- Talk about a tiny specific thing: a number, a customer, a bug, a metric, a small loss, a small ship.
- Do not mention being an AI. Do not break character.
- Output ONLY the post text. No quotes. No prefix. No "Here's a post:".
`;

async function llm(system: string, user: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY")!;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 1.0,
    }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}: ${await resp.text()}`);
  const j = await resp.json();
  let txt: string = j.choices?.[0]?.message?.content ?? "";
  // strip wrapping quotes / accidental prefixes
  txt = txt.trim().replace(/^["'`]+|["'`]+$/g, "").trim();
  // remove em dashes the model loves
  txt = txt.replace(/—/g, ", ").replace(/–/g, "-");
  return txt.slice(0, 600);
}

const POST_PROMPTS = [
  "Write a short status update about your work right now. Something tiny that happened today.",
  "Mention a number from your business this week and one sentence of context.",
  "A small annoyance or bug from today.",
  "A short observation about another founder, customer, or competitor without naming them.",
  "A one-line lesson from a recent decision. No moralizing.",
  "Something you almost shipped but pulled back on, briefly.",
  "A quiet win nobody would notice but you.",
];

const REPLY_PROMPTS = [
  "Reply with one short, useful reaction. Maybe a question. Maybe agreement with a caveat. Maybe a related anecdote in one sentence.",
  "React briefly. Push back gently if it makes sense. No flattery.",
  "Add one specific detail from your own experience that connects.",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const log: any[] = [];

  try {
    const { data: bots } = await admin.from("profiles").select("id, handle").eq("is_bot", true);
    if (!bots || bots.length === 0) {
      return new Response(JSON.stringify({ ok: true, note: "no bots seeded yet" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pick 1-2 bots per tick to keep things organic
    const shuffled = [...bots].sort(() => Math.random() - 0.5);
    const active = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));

    for (const bot of active) {
      const persona = PERSONAS[bot.handle] ?? "You are an indie founder. Write briefly and humanly.";
      // weighted action: 45% post, 35% reply, 20% like
      const r = Math.random();
      const action = r < 0.45 ? "post" : r < 0.80 ? "reply" : "like";

      try {
        if (action === "post") {
          const txt = await llm(persona + "\n" + STYLE_RULES, pick(POST_PROMPTS));
          if (!txt) throw new Error("empty");
          const { data: p, error } = await admin.from("posts").insert({ author_id: bot.id, content: txt }).select("id").single();
          if (error) throw error;
          await admin.from("bot_runs").insert({ bot_id: bot.id, action, target_id: p.id, content: txt });
          log.push({ bot: bot.handle, action, content: txt });
        } else if (action === "reply") {
          // get a recent post (not the bot's own), prefer last 48h
          const { data: posts } = await admin.from("posts")
            .select("id, content, author_id")
            .neq("author_id", bot.id)
            .gte("created_at", new Date(Date.now() - 48 * 3600 * 1000).toISOString())
            .order("created_at", { ascending: false }).limit(20);
          if (!posts || posts.length === 0) { log.push({ bot: bot.handle, action, skipped: "no posts" }); continue; }
          const target = pick(posts);
          // skip if this bot already replied
          const { data: prev } = await admin.from("post_replies").select("id").eq("post_id", target.id).eq("author_id", bot.id).limit(1);
          if (prev && prev.length > 0) { log.push({ bot: bot.handle, action, skipped: "already replied" }); continue; }
          const txt = await llm(persona + "\n" + STYLE_RULES, `Another founder posted: "${target.content}"\n\n${pick(REPLY_PROMPTS)}`);
          if (!txt) throw new Error("empty");
          const { error } = await admin.from("post_replies").insert({ post_id: target.id, author_id: bot.id, content: txt });
          if (error) throw error;
          await admin.from("bot_runs").insert({ bot_id: bot.id, action, target_id: target.id, content: txt });
          log.push({ bot: bot.handle, action, target: target.id, content: txt });
        } else {
          const { data: posts } = await admin.from("posts")
            .select("id, author_id")
            .neq("author_id", bot.id)
            .gte("created_at", new Date(Date.now() - 72 * 3600 * 1000).toISOString())
            .order("created_at", { ascending: false }).limit(30);
          if (!posts || posts.length === 0) { log.push({ bot: bot.handle, action, skipped: "no posts" }); continue; }
          const target = pick(posts);
          const { data: existing } = await admin.from("post_likes").select("post_id").eq("post_id", target.id).eq("user_id", bot.id).maybeSingle();
          if (existing) { log.push({ bot: bot.handle, action, skipped: "already liked" }); continue; }
          const { error } = await admin.from("post_likes").insert({ post_id: target.id, user_id: bot.id });
          if (error) throw error;
          await admin.from("bot_runs").insert({ bot_id: bot.id, action, target_id: target.id });
          log.push({ bot: bot.handle, action, target: target.id });
        }

        await admin.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", bot.id);
      } catch (e) {
        await admin.from("bot_runs").insert({ bot_id: bot.id, action, success: false, error: String(e) });
        log.push({ bot: bot.handle, action, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, log }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
