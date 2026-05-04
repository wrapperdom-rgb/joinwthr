// Seeds bot founder accounts. Admin-only. Idempotent by handle.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOTS = [
  { handle: "mara_k", name: "Mara Kessler", bio: "shipping small. compounding monthly.", building: "inboxsweep — email triage for solo ops", revenue_stage: "$8k MRR", skills: ["ruby","postgres","dx"], looking_for: ["design feedback","first 10 ent customers"] },
  { handle: "dev_oraco", name: "Devon Oraco", bio: "ex-stripe. now writing code in a barn.", building: "ledgerbeam — finance api for indie saas", revenue_stage: "$3k MRR", skills: ["typescript","infra","fintech"], looking_for: ["design partners","beta testers"] },
  { handle: "lin_park", name: "Lin Park", bio: "half-engineer half-merchant. mostly tired.", building: "kiln — ceramics dtc, 4 skus", revenue_stage: "$22k/mo gmv", skills: ["shopify","paid social","supply chain"], looking_for: ["fulfillment ops","wholesale leads"] },
  { handle: "sami_w", name: "Sami Wren", bio: "AI tools that arent slop. trying.", building: "paperthread — research assistant for analysts", revenue_stage: "$1.4k MRR", skills: ["python","llms","rag"], looking_for: ["enterprise pilots","technical cofounder vibe"] },
  { handle: "jude_ash", name: "Jude Ashby", bio: "growth for builders who hate growth content.", building: "consulting + small productized seo audits", revenue_stage: "$11k/mo", skills: ["seo","copy","positioning"], looking_for: ["saas founders pre-PMF","referral partners"] },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // verify caller is admin
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, PUBLISHABLE, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r: any) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const results: any[] = [];

    for (const bot of BOTS) {
      // skip if profile exists
      const { data: existing } = await admin.from("profiles").select("id").eq("handle", bot.handle).maybeSingle();
      if (existing) { results.push({ handle: bot.handle, status: "exists" }); continue; }

      const email = `${bot.handle}@bots.wthr.local`;
      const password = crypto.randomUUID() + crypto.randomUUID();
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { handle: bot.handle, name: bot.name },
      });
      if (cErr || !created.user) { results.push({ handle: bot.handle, status: "auth_error", error: cErr?.message }); continue; }

      // upsert profile (handle_new_user trigger may have inserted a default)
      const { error: pErr } = await admin.from("profiles").upsert({
        id: created.user.id,
        handle: bot.handle, name: bot.name, bio: bot.bio,
        building: bot.building, revenue_stage: bot.revenue_stage,
        skills: bot.skills, looking_for: bot.looking_for,
        is_bot: true,
      }, { onConflict: "id" });
      results.push({ handle: bot.handle, status: pErr ? "profile_error" : "created", error: pErr?.message });
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
