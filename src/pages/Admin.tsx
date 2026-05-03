import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "users" | "posts" | "opportunities" | "messages" | "invites" | "roles";

const TABS: Tab[] = ["users", "posts", "opportunities", "messages", "invites", "roles"];

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/feed", { replace: true });
  }, [loading, user, isAdmin, navigate]);

  const load = async () => {
    setBusy(true);
    const map: Record<Tab, string> = {
      users: "profiles",
      posts: "posts",
      opportunities: "opportunities",
      messages: "messages",
      invites: "invite_codes",
      roles: "user_roles",
    };
    const { data, error } = await supabase
      .from(map[tab] as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setBusy(false);
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [tab, isAdmin]);

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

  if (loading || !isAdmin) {
    return <div className="text-muted-foreground font-mono-mini">checking access…</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between border-b border-hairline pb-6">
        <div>
          <h1 className="font-display text-5xl tracking-tighter">Admin</h1>
          <p className="font-script text-muted-foreground mt-1">control room</p>
        </div>
        <span className="font-mono-mini text-muted-foreground">your id: {user?.id}</span>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-hairline">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono-mini px-4 py-2 border-b-2 -mb-px transition ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </nav>

      {tab === "invites" && (
        <button onClick={createInvite} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">+ new invite code</button>
      )}
      {tab === "roles" && (
        <button onClick={grantAdmin} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">+ grant admin</button>
      )}

      <div className="overflow-x-auto border border-hairline">
        {busy ? (
          <div className="p-6 font-mono-mini text-muted-foreground">loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 font-mono-mini text-muted-foreground">no rows</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-hairline">
              <tr>
                {Object.keys(rows[0]).map(k => (
                  <th key={k} className="text-left font-mono-mini px-3 py-2 text-muted-foreground whitespace-nowrap">{k}</th>
                ))}
                <th className="font-mono-mini px-3 py-2 text-muted-foreground">actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id ?? r.code ?? i} className="border-b border-hairline/50 hover:bg-muted/20">
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
                  <td className="px-3 py-2 whitespace-nowrap">
                    {tab === "invites" ? (
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
