import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type P = {
  id: string; handle: string; name: string; bio: string | null; building: string | null;
  revenue_stage: string | null; skills: string[] | null; looking_for: string[] | null; created_at: string;
};

export default function Profile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState<P | null>(null);
  const [posts, setPosts] = useState<{ id: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!handle) return;
    supabase.from("profiles").select("*").eq("handle", handle).maybeSingle().then(async ({ data }) => {
      setP(data as P);
      if (data) {
        const { data: ps } = await supabase.from("posts").select("id, content, created_at").eq("author_id", data.id).order("created_at", { ascending: false }).limit(20);
        setPosts(ps ?? []);
      }
    });
  }, [handle]);

  if (!p) return <div className="font-mono-mini text-muted-foreground">loading…</div>;
  const isMe = user?.id === p.id;

  return (
    <div className="max-w-3xl">
      <header className="border-b border-hairline pb-10 mb-10">
        <p className="font-mono-mini text-muted-foreground">— founder file</p>
        <h1 className="font-display text-6xl tracking-tighter mt-2">{p.name}</h1>
        <p className="font-script text-2xl text-muted-foreground mt-1">@{p.handle}</p>

        {p.bio && <p className="text-lg mt-6 max-w-xl leading-relaxed">{p.bio}</p>}

        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <Item label="Building">{p.building || "—"}</Item>
          <Item label="Stage">{p.revenue_stage || "—"}</Item>
          <Item label="Skills">
            <div className="flex flex-wrap gap-1">
              {(p.skills ?? []).map(s => <span key={s} className="font-mono-mini border-hairline border px-2 py-0.5">{s}</span>)}
            </div>
          </Item>
          <Item label="Looking for">
            <div className="flex flex-wrap gap-1">
              {(p.looking_for ?? []).map(s => <span key={s} className="font-mono-mini border-hairline border px-2 py-0.5">{s}</span>)}
            </div>
          </Item>
        </div>

        <div className="mt-8 flex gap-3">
          {isMe ? (
            <Link to="/onboarding" className="font-mono-mini border-hairline border px-4 py-2 hover:bg-foreground hover:text-background">Edit profile →</Link>
          ) : (
            <Link to={`/messages/${p.id}`} className="font-mono-mini bg-foreground text-background px-4 py-2">Message →</Link>
          )}
        </div>
      </header>

      <h2 className="font-mono-mini text-muted-foreground mb-6">— recent posts</h2>
      <div className="divide-hairline border-t border-b border-hairline">
        {posts.length === 0 && <div className="py-12 text-center text-muted-foreground font-mono-mini">no posts.</div>}
        {posts.map(p => (
          <article key={p.id} className="py-5">
            <span className="font-mono-mini text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{p.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono-mini text-muted-foreground mb-2">{label}</p>
      <div>{children}</div>
    </div>
  );
}
