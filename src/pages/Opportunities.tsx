import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const KINDS = ["Hiring", "Cofounder", "Partnership", "Client"];

type Opp = {
  id: string; title: string; description: string; kind: string; tags: string[]; cta: string;
  created_at: string; author_id: string;
  profiles: { handle: string; name: string } | null;
};

export default function Opportunities() {
  const { user } = useAuth();
  const [items, setItems] = useState<Opp[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("opportunities")
      .select("*, profiles!opportunities_author_id_fkey(handle, name)")
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "All" ? items : items.filter(i => i.kind === filter);

  return (
    <div>
      <header className="flex flex-wrap justify-between items-end gap-6 mb-10">
        <div>
          <p className="font-mono-mini text-muted-foreground">— the board</p>
          <h1 className="font-display text-5xl tracking-tighter mt-2">Opportunities <span className="font-script text-muted-foreground italic">in the room.</span></h1>
        </div>
        <button onClick={() => setOpen(true)} className="bg-foreground text-background font-mono-mini px-4 py-2">+ Post opportunity</button>
      </header>

      <div className="flex gap-2 mb-8 flex-wrap">
        {["All", ...KINDS].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`font-mono-mini px-3 py-2 border-hairline border ${filter === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            {k}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-hairline border-hairline border">
        {filtered.map(o => (
          <article key={o.id} className="bg-card p-6 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <span className="font-mono-mini text-muted-foreground">{o.kind}</span>
              <span className="font-mono-mini text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="font-display text-2xl tracking-tight">{o.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{o.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {o.tags?.map(t => <span key={t} className="font-mono-mini text-muted-foreground border-hairline border px-2 py-1">{t}</span>)}
            </div>
            <div className="mt-auto pt-4 flex justify-between items-center border-t border-hairline">
              <Link to={`/u/${o.profiles?.handle}`} className="font-mono-mini text-muted-foreground hover:text-foreground">@{o.profiles?.handle}</Link>
              <Link to={`/messages/${o.author_id}`} className="font-mono-mini border-hairline border px-3 py-1 hover:bg-foreground hover:text-background transition">{o.cta} →</Link>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="bg-card p-12 text-center text-muted-foreground font-mono-mini md:col-span-2">no posts yet.</div>}
      </div>

      {open && <Composer onClose={() => { setOpen(false); load(); }} userId={user!.id} />}
    </div>
  );
}

function Composer({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("opportunities").insert({
      author_id: userId,
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 800),
      kind,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 6),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-card border-hairline border w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-baseline">
          <h3 className="font-display text-2xl">Post an opportunity</h3>
          <button type="button" onClick={onClose} className="font-mono-mini text-muted-foreground">close ×</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(k => (
            <button type="button" key={k} onClick={() => setKind(k)}
              className={`font-mono-mini px-3 py-2 border-hairline border ${kind === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>
              {k}
            </button>
          ))}
        </div>
        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
          className="w-full bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg" />
        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={5}
          placeholder="Describe the opportunity. Be specific."
          className="w-full bg-transparent border border-hairline focus:border-foreground outline-none p-3 resize-none" />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tags, comma, separated"
          className="w-full bg-transparent border-b border-hairline focus:border-foreground outline-none py-2" />
        <button disabled={loading} className="w-full bg-foreground text-background font-mono-mini py-3">{loading ? "…" : "Publish →"}</button>
      </form>
    </div>
  );
}
