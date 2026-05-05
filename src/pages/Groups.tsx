import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Group = {
  id: string; slug: string; name: string; description: string;
  topic: string; owner_id: string; bots_allowed: boolean; created_at: string;
  member_count?: number; joined?: boolean;
};

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", topic: "" });

  const load = async () => {
    setLoading(true);
    const { data: gs } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    const { data: mems } = await supabase.from("group_members").select("group_id, user_id");
    const counts = new Map<string, number>();
    const mine = new Set<string>();
    (mems ?? []).forEach((m: any) => {
      counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
      if (m.user_id === user?.id) mine.add(m.group_id);
    });
    setGroups((gs ?? []).map((g: any) => ({ ...g, member_count: counts.get(g.id) ?? 0, joined: mine.has(g.id) })));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const join = async (g: Group) => {
    const { error } = await supabase.from("group_members").insert({ group_id: g.id, user_id: user!.id, role: "member" });
    if (error) return toast.error(error.message);
    load();
  };

  const leave = async (g: Group) => {
    const { error } = await supabase.from("group_members").delete().eq("group_id", g.id).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `g-${Date.now()}`;
    const { data, error } = await supabase.from("groups").insert({
      slug, name: form.name, description: form.description, topic: form.topic,
      owner_id: user!.id, bots_allowed: true,
    }).select("id").single();
    if (error) return toast.error(error.message);
    await supabase.from("group_members").insert({ group_id: data.id, user_id: user!.id, role: "owner" });
    setForm({ name: "", description: "", topic: "" });
    setCreating(false);
    load();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter">Groups</h1>
          <p className="font-script text-muted-foreground mt-1">small rooms. real people.</p>
        </div>
        <button onClick={() => setCreating(v => !v)} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition self-start sm:self-auto">
          {creating ? "cancel" : "+ new group"}
        </button>
      </header>

      {creating && (
        <form onSubmit={create} className="border border-hairline p-6 space-y-3">
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="name" className="w-full font-mono-mini bg-transparent border-b border-hairline focus:border-foreground outline-none px-1 py-2" />
          <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="topic (e.g. saas, dtc, ai)" className="w-full font-mono-mini bg-transparent border-b border-hairline focus:border-foreground outline-none px-1 py-2" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="what this group is for…" rows={3} className="w-full font-mono-mini bg-transparent border border-hairline focus:border-foreground outline-none px-3 py-2" />
          <button className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">create</button>
        </form>
      )}

      {loading ? (
        <div className="font-mono-mini text-muted-foreground">loading…</div>
      ) : groups.length === 0 ? (
        <div className="font-mono-mini text-muted-foreground">no groups yet. start one.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(g => (
            <li key={g.id} className="border border-hairline p-5 hover:border-foreground transition group">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/groups/${g.slug}`} className="flex-1 min-w-0">
                  <h3 className="font-display text-2xl tracking-tight truncate">{g.name}</h3>
                  {g.topic && <span className="font-mono-mini text-muted-foreground">#{g.topic}</span>}
                </Link>
                {g.joined ? (
                  <button onClick={() => leave(g)} className="font-mono-mini text-muted-foreground hover:text-destructive">leave</button>
                ) : (
                  <button onClick={() => join(g)} className="font-mono-mini border border-foreground px-3 py-1 hover:bg-foreground hover:text-background transition">join</button>
                )}
              </div>
              {g.description && <p className="font-mono-mini text-muted-foreground mt-2 line-clamp-2">{g.description}</p>}
              <div className="font-mono-mini text-muted-foreground mt-3 text-xs">{g.member_count} members</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
