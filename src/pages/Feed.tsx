import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Post = {
  id: string; content: string; created_at: string; author_id: string;
  profiles: { handle: string; name: string } | null;
  likes: number; reply_count: number; liked_by_me: boolean;
};

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: rows } = await supabase
      .from("posts")
      .select("id, content, created_at, author_id, profiles!posts_author_profile_fk(handle, name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!rows) return;
    const ids = rows.map(r => r.id);
    const [{ data: likes }, { data: replies }] = await Promise.all([
      supabase.from("post_likes").select("post_id, user_id").in("post_id", ids),
      supabase.from("post_replies").select("post_id").in("post_id", ids),
    ]);
    const likeMap = new Map<string, { c: number; me: boolean }>();
    likes?.forEach(l => {
      const cur = likeMap.get(l.post_id) ?? { c: 0, me: false };
      cur.c++; if (l.user_id === user?.id) cur.me = true;
      likeMap.set(l.post_id, cur);
    });
    const replyMap = new Map<string, number>();
    replies?.forEach(r => replyMap.set(r.post_id, (replyMap.get(r.post_id) ?? 0) + 1));
    setPosts(rows.map((r: any) => ({
      ...r,
      likes: likeMap.get(r.id)?.c ?? 0,
      liked_by_me: likeMap.get(r.id)?.me ?? false,
      reply_count: replyMap.get(r.id) ?? 0,
    })));
  };

  useEffect(() => { load(); }, [user?.id]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("posts").insert({ author_id: user.id, content: content.trim().slice(0, 600) });
    setLoading(false);
    if (error) return toast.error(error.message);
    setContent("");
    load();
  };

  const toggleLike = async (p: Post) => {
    if (!user) return;
    if (p.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: p.id, user_id: user.id });
    }
    setPosts(ps => ps.map(x => x.id === p.id ? { ...x, liked_by_me: !p.liked_by_me, likes: p.likes + (p.liked_by_me ? -1 : 1) } : x));
  };

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-8 md:gap-12">
      <section>
        <header className="mb-10">
          <p className="font-mono-mini text-muted-foreground">— the feed</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tighter mt-2">Signal <span className="font-script text-muted-foreground italic">only.</span></h1>
        </header>

        <form onSubmit={post} className="border-hairline border p-5 mb-10 bg-card">
          <textarea
            value={content} onChange={e => setContent(e.target.value)} maxLength={600} rows={3}
            placeholder="A win. An insight. An opportunity. Be brief."
            className="w-full bg-transparent outline-none resize-none text-lg"
          />
          <div className="flex justify-between items-center pt-2 border-t border-hairline">
            <span className="font-mono-mini text-muted-foreground">{content.length}/600</span>
            <button disabled={loading || !content.trim()} className="bg-foreground text-background font-mono-mini px-4 py-2 disabled:opacity-30">Post →</button>
          </div>
        </form>

        <div className="divide-hairline border-t border-b border-hairline">
          {posts.length === 0 && (
            <div className="py-16 text-center text-muted-foreground font-mono-mini">silence. for now.</div>
          )}
          {posts.map(p => (
            <article key={p.id} className="py-6 group">
              <div className="flex justify-between items-baseline mb-2">
                <Link to={`/u/${p.profiles?.handle}`} className="font-display text-lg hover:underline underline-offset-4">
                  {p.profiles?.name} <span className="text-muted-foreground font-mono-mini">@{p.profiles?.handle}</span>
                </Link>
                <span className="font-mono-mini text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{p.content}</p>
              <div className="mt-3 flex gap-6">
                <button onClick={() => toggleLike(p)} className={`font-mono-mini ${p.liked_by_me ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.liked_by_me ? "★" : "☆"} {p.likes}
                </button>
                <span className="font-mono-mini text-muted-foreground">{p.reply_count} replies</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="hidden md:block">
        <div className="border-hairline border p-5 sticky top-20">
          <p className="font-mono-mini text-muted-foreground mb-2">— principles</p>
          <p className="font-script text-2xl mb-3">be quiet. be useful.</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>· Wins, losses, lessons.</li>
            <li>· Opportunities, not pitches.</li>
            <li>· No engagement bait.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
