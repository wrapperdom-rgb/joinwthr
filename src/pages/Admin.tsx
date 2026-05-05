import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "requests" | "users" | "posts" | "opportunities" | "messages" | "invites" | "roles" | "groups" | "bots";

const TABS: Tab[] = ["requests", "users", "posts", "opportunities", "messages", "invites", "roles", "groups", "bots"];

const TABLE_MAP: Record<Tab, string> = {
  requests: "access_requests",
  users: "profiles",
  posts: "posts",
  opportunities: "opportunities",
  messages: "messages",
  invites: "invite_codes",
  roles: "user_roles",
  groups: "groups",
  bots: "bot_runs",
};

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("requests");
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all"); // tab-specific filter

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/feed", { replace: true });
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => { setQuery(""); setFilter("all"); }, [tab]);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from(TABLE_MAP[tab] as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setBusy(false);
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [tab, isAdmin]);

  const filtered = useMemo(() => {
    let out = rows;
    // tab-specific filter
    if (tab === "users" && filter !== "all") {
      if (filter === "banned") out = out.filter(r => r.banned);
      else if (filter === "active") out = out.filter(r => !r.banned);
    }
    if (tab === "opportunities" && filter !== "all") {
      out = out.filter(r => r.kind === filter);
    }
    if (tab === "invites" && filter !== "all") {
      if (filter === "used") out = out.filter(r => r.used_by);
      else if (filter === "unused") out = out.filter(r => !r.used_by);
    }
    if (tab === "roles" && filter !== "all") {
      out = out.filter(r => r.role === filter);
    }
    if (tab === "requests" && filter !== "all") {
      out = out.filter(r => r.status === filter);
    }
    // free-text search across all string fields
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(r =>
        Object.values(r).some(v => {
          if (v == null) return false;
          if (Array.isArray(v)) return v.join(" ").toLowerCase().includes(q);
          if (typeof v === "object") return JSON.stringify(v).toLowerCase().includes(q);
          return String(v).toLowerCase().includes(q);
        })
      );
    }
    return out;
  }, [rows, query, filter, tab]);

  const del = async (table: string, match: Record<string, any>) => {
    if (!confirm("Delete this row?")) return;
    let q = supabase.from(table as any).delete();
    Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v); });
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const updateField = async (table: string, id: string, field: string, value: any) => {
    const { error } = await supabase.from(table as any).update({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const toggleBan = async (id: string, current: boolean) => {
    const action = current ? "unban" : "ban";
    if (!confirm(`${action} this user?`)) return;
    const { error } = await supabase.from("profiles").update({ banned: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(current ? "Unbanned" : "Banned");
    load();
  };

  const createInvite = async () => {
    const code = prompt("Invite code (e.g. WTHR-XXXX):");
    if (!code) return;
    const { error } = await supabase.from("invite_codes").insert({ code, created_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("Created");
    load();
  };

  const grantAdmin = async () => {
    const uid = prompt("User UUID to grant admin:");
    if (!uid) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Granted");
    load();
  };

  const generateUniqueCode = async (): Promise<string> => {
    for (let i = 0; i < 8; i++) {
      const code = `WTHR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { data } = await supabase.from("invite_codes").select("code").eq("code", code).maybeSingle();
      if (!data) return code;
    }
    return `WTHR-${Date.now().toString(36).toUpperCase()}`;
  };

  const approveRequest = async (req: any) => {
    if (!confirm(`Approve ${req.email}? An invite code will be generated automatically.`)) return;
    const code = await generateUniqueCode();
    const { error: e1 } = await (supabase.from("invite_codes") as any).insert({ code, created_by: user!.id });
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await (supabase.from("access_requests") as any)
      .update({ status: "approved", notes: `invite: ${code}`, reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq("id", req.id);
    if (e2) return toast.error(e2.message);
    try { await navigator.clipboard.writeText(code); } catch {}
    toast.success(`Approved. Code ${code} copied — send to ${req.email}`);
    load();
  };

  const rejectRequest = async (req: any) => {
    if (!confirm(`Reject request from ${req.email}?`)) return;
    const { error } = await (supabase.from("access_requests") as any)
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq("id", req.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    load();
  };

  if (loading || !isAdmin) {
    return <div className="text-muted-foreground font-mono-mini">checking access…</div>;
  }

  const filterOptions: { value: string; label: string }[] = (() => {
    if (tab === "requests") return [
      { value: "all", label: "all" },
      { value: "pending", label: "pending" },
      { value: "approved", label: "approved" },
      { value: "rejected", label: "rejected" },
    ];
    if (tab === "users") return [{ value: "all", label: "all" }, { value: "active", label: "active" }, { value: "banned", label: "banned" }];
    if (tab === "opportunities") {
      const kinds = Array.from(new Set(rows.map(r => r.kind).filter(Boolean)));
      return [{ value: "all", label: "all kinds" }, ...kinds.map(k => ({ value: k, label: k }))];
    }
    if (tab === "invites") return [{ value: "all", label: "all" }, { value: "unused", label: "unused" }, { value: "used", label: "used" }];
    if (tab === "roles") return [{ value: "all", label: "all" }, { value: "admin", label: "admin" }];
    return [];
  })();

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter">Admin</h1>
          <p className="font-script text-muted-foreground mt-1">control room</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={async () => {
              setBusy(true);
              const { data, error } = await supabase.functions.invoke("seed-bots");
              setBusy(false);
              if (error) toast.error(error.message);
              else toast.success(`bots: ${(data?.results ?? []).map((r: any) => `${r.handle}:${r.status}`).join(", ")}`);
            }}
            className="font-mono-mini border border-hairline px-3 py-2 hover:border-foreground transition"
          >seed bots</button>
          <button
            onClick={async () => {
              const { data, error } = await supabase.functions.invoke("bot-tick");
              if (error) toast.error(error.message);
              else toast.success(`tick: ${(data?.log ?? []).length} actions`);
            }}
            className="font-mono-mini border border-hairline px-3 py-2 hover:border-foreground transition"
          >run bot tick</button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-hairline">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono-mini px-4 py-2 border-b-2 -mb-px transition ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`search ${tab}…`}
          className="font-mono-mini bg-transparent border border-hairline focus:border-foreground outline-none px-3 py-2 flex-1 min-w-[200px]"
        />
        {filterOptions.length > 0 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="font-mono-mini bg-background border border-hairline focus:border-foreground outline-none px-3 py-2"
          >
            {filterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <span className="font-mono-mini text-muted-foreground">{filtered.length}/{rows.length}</span>
        {tab === "invites" && (
          <button onClick={createInvite} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">+ invite</button>
        )}
        {tab === "roles" && (
          <button onClick={grantAdmin} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">+ admin</button>
        )}
      </div>

      {tab === "bots" && <BotSettingsPanel />}

      <div className="overflow-x-auto border border-hairline">

        {busy ? (
          <div className="p-6 font-mono-mini text-muted-foreground">loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 font-mono-mini text-muted-foreground">no rows</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-hairline">
              <tr>
                {Object.keys(filtered[0]).map(k => (
                  <th key={k} className="text-left font-mono-mini px-3 py-2 text-muted-foreground whitespace-nowrap">{k}</th>
                ))}
                <th className="font-mono-mini px-3 py-2 text-muted-foreground">actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id ?? r.code ?? i} className={`border-b border-hairline/50 hover:bg-muted/20 ${r.banned ? "opacity-50" : ""}`}>
                  {Object.entries(r).map(([k, v]) => (
                    <td key={k} className="px-3 py-2 align-top max-w-[280px] truncate font-mono-mini" title={String(v ?? "")}>
                      {tab === "users" && (k === "name" || k === "handle" || k === "bio" || k === "building" || k === "revenue_stage") ? (
                        <input
                          defaultValue={v as any ?? ""}
                          className="bg-transparent border-b border-hairline focus:border-foreground outline-none w-full"
                          onBlur={(e) => e.target.value !== v && updateField("profiles", r.id, k, e.target.value)}
                        />
                      ) : Array.isArray(v) ? `[${v.join(", ")}]`
                        : typeof v === "object" && v !== null ? JSON.stringify(v)
                        : String(v ?? "")}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap space-x-3">
                    {tab === "users" && (
                      <button
                        onClick={() => toggleBan(r.id, !!r.banned)}
                        className={`font-mono-mini hover:underline ${r.banned ? "text-foreground" : "text-destructive"}`}
                      >
                        {r.banned ? "unban" : "ban"}
                      </button>
                    )}
                    {tab === "requests" ? (
                      <>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => approveRequest(r)} className="font-mono-mini hover:underline">approve</button>
                            <button onClick={() => rejectRequest(r)} className="font-mono-mini text-destructive hover:underline">reject</button>
                          </>
                        )}
                        <button onClick={() => del("access_requests", { id: r.id })} className="font-mono-mini text-destructive hover:underline">delete</button>
                      </>
                    ) : tab === "invites" ? (
                      <button onClick={() => del("invite_codes", { code: r.code })} className="font-mono-mini text-destructive hover:underline">delete</button>
                    ) : tab === "messages" ? (
                      <button onClick={() => del("messages", { id: r.id })} className="font-mono-mini text-destructive hover:underline">delete</button>
                    ) : tab === "roles" ? (
                      <button onClick={() => del("user_roles", { id: r.id })} className="font-mono-mini text-destructive hover:underline">revoke</button>
                    ) : tab === "users" ? (
                      <button onClick={() => del("profiles", { id: r.id })} className="font-mono-mini text-destructive hover:underline">delete</button>
                    ) : tab === "posts" ? (
                      <button onClick={() => del("posts", { id: r.id })} className="font-mono-mini text-destructive hover:underline">delete</button>
                    ) : (
                      <button onClick={() => del("opportunities", { id: r.id })} className="font-mono-mini text-destructive hover:underline">delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BotSettingsPanel() {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("bot_settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => setS(data ?? null));
  }, []);

  if (!s) return <div className="font-mono-mini text-muted-foreground border border-hairline p-6">loading bot settings…</div>;

  const set = (k: string, v: any) => setS({ ...s, [k]: v });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("bot_settings").update({
      enabled: s.enabled,
      weight_post: s.weight_post, weight_reply: s.weight_reply, weight_like: s.weight_like,
      max_bots_per_tick: s.max_bots_per_tick, max_posts_per_day: s.max_posts_per_day,
      allow_self_reply: s.allow_self_reply, self_reply_chance: s.self_reply_chance,
      allow_group_posts: s.allow_group_posts, group_post_chance: s.group_post_chance,
      tick_minutes: s.tick_minutes,
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("settings saved. cron uses live values on next tick.");
  };

  const total = (s.weight_post ?? 0) + (s.weight_reply ?? 0) + (s.weight_like ?? 0);

  const Row = ({ label, k, min, max, hint }: any) => (
    <label className="grid grid-cols-[180px_1fr_60px] gap-3 items-center">
      <span className="font-mono-mini text-muted-foreground">{label}</span>
      <input type="range" min={min} max={max} value={s[k] ?? 0} onChange={e => set(k, Number(e.target.value))} className="accent-foreground" />
      <span className="font-mono-mini text-right">{s[k]}{hint ? hint : ""}</span>
    </label>
  );

  return (
    <div className="border border-hairline p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl tracking-tight">Bot controls</h3>
          <p className="font-mono-mini text-muted-foreground text-xs mt-1">live settings the cron tick reads on every run</p>
        </div>
        <label className="flex items-center gap-2 font-mono-mini">
          <input type="checkbox" checked={!!s.enabled} onChange={e => set("enabled", e.target.checked)} />
          {s.enabled ? "enabled" : "paused"}
        </label>
      </div>

      <div className="space-y-3">
        <div className="font-mono-mini text-muted-foreground text-xs">action weights (relative, total {total})</div>
        <Row label="post weight" k="weight_post" min={0} max={100} />
        <Row label="reply weight" k="weight_reply" min={0} max={100} />
        <Row label="like weight" k="weight_like" min={0} max={100} />
      </div>

      <div className="space-y-3 pt-3 border-t border-hairline">
        <Row label="bots per tick" k="max_bots_per_tick" min={1} max={5} />
        <Row label="max posts/day per bot" k="max_posts_per_day" min={1} max={50} />
        <Row label="tick frequency" k="tick_minutes" min={5} max={360} hint=" min" />
      </div>

      <div className="space-y-3 pt-3 border-t border-hairline">
        <label className="flex items-center gap-2 font-mono-mini">
          <input type="checkbox" checked={!!s.allow_self_reply} onChange={e => set("allow_self_reply", e.target.checked)} />
          allow bots to reply to their own messages
        </label>
        <Row label="self-reply chance" k="self_reply_chance" min={0} max={100} hint="%" />
      </div>

      <div className="space-y-3 pt-3 border-t border-hairline">
        <label className="flex items-center gap-2 font-mono-mini">
          <input type="checkbox" checked={!!s.allow_group_posts} onChange={e => set("allow_group_posts", e.target.checked)} />
          allow bots to post inside groups
        </label>
        <Row label="group activity chance" k="group_post_chance" min={0} max={100} hint="%" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-hairline">
        <span className="font-mono-mini text-muted-foreground text-xs">
          tick frequency change requires updating the cron schedule manually for now
        </span>
        <button onClick={save} disabled={saving} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition disabled:opacity-50">
          {saving ? "saving…" : "save settings"}
        </button>
      </div>
    </div>
  );
}
