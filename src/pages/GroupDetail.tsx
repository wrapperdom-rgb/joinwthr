import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Group = { id: string; slug: string; name: string; description: string; topic: string; owner_id: string; bots_allowed: boolean };
type Post = { id: string; content: string; author_id: string; created_at: string; author?: { handle: string; name: string }; likes?: number; liked?: boolean; replies?: Reply[] };
type Reply = { id: string; content: string; author_id: string; created_at: string; author?: { handle: string; name: string } };

export default function GroupDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: g } = await supabase.from("groups").select("*").eq("slug", slug!).maybeSingle();
    if (!g) { setLoading(false); return; }
    setGroup(g as any);

    const [{ data: ps }, { data: ms }, { data: mine }] = await Promise.all([
      supabase.from("group_posts").select("*").eq("group_id", g.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("group_members").select("user_id, role").eq("group_id", g.id),
      supabase.from("group_members").select("user_id").eq("group_id", g.id).eq("user_id", user!.id).maybeSingle(),
    ]);
    setJoined(!!mine);
    setMembers(ms ?? []);

    const postIds = (ps ?? []).map((p: any) => p.id);
    const authorIds = Array.from(new Set([...(ps ?? []).map((p: any) => p.author_id)]));
    const [{ data: replies }, { data: likes }, { data: profs }] = await Promise.all([
      postIds.length ? supabase.from("group_post_replies").select("*").in("post_id", postIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("group_post_likes").select("post_id, user_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      authorIds.length ? supabase.from("profiles").select("id, handle, name").in("id", authorIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const replyAuthorIds = Array.from(new Set((replies ?? []).map((r: any) => r.author_id).filter((id: any) => !profMap.has(id))));
    if (replyAuthorIds.length) {
      const { data: more } = await supabase.from("profiles").select("id, handle, name").in("id", replyAuthorIds);
      (more ?? []).forEach((p: any) => profMap.set(p.id, p));
    }
    const likeMap = new Map<string, { count: number; liked: boolean }>();
    (likes ?? []).forEach((l: any) => {
      const cur = likeMap.get(l.post_id) ?? { count: 0, liked: false };
      cur.count++; if (l.user_id === user!.id) cur.liked = true;
      likeMap.set(l.post_id, cur);
    });
    const repliesByPost = new Map<string, Reply[]>();
    (replies ?? []).forEach((r: any) => {
      const arr = repliesByPost.get(r.post_id) ?? [];
      arr.push({ ...r, author: profMap.get(r.author_id) });
      repliesByPost.set(r.post_id, arr);
    });
    setPosts((ps ?? []).map((p: any) => ({
      ...p,
      author: profMap.get(p.author_id),
      likes: likeMap.get(p.id)?.count ?? 0,
      liked: likeMap.get(p.id)?.liked ?? false,
      replies: repliesByPost.get(p.id) ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { if (user && slug) load(); /* eslint-disable-next-line */ }, [user, slug]);

  const join = async () => {
    if (!group) return;
    const { error } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user!.id, role: "member" });
    if (error) return toast.error(error.message);
    load();
  };

  const leave = async () => {
    if (!group) return;
    const { error } = await supabase.from("group_members").delete().eq("group_id", group.id).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    load();
  };

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !group) return;
    const { error } = await supabase.from("group_posts").insert({ group_id: group.id, author_id: user!.id, content: content.trim() });
    if (error) return toast.error(error.message);
    setContent(""); load();
  };

  const reply = async (postId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from("group_post_replies").insert({ post_id: postId, author_id: user!.id, content: replyText.trim() });
    if (error) return toast.error(error.message);
    setReplyText(""); setReplyOpen(null); load();
  };

  const toggleLike = async (p: Post) => {
    if (p.liked) await supabase.from("group_post_likes").delete().eq("post_id", p.id).eq("user_id", user!.id);
    else await supabase.from("group_post_likes").insert({ post_id: p.id, user_id: user!.id });
    load();
  };

  if (loading) return <div className="font-mono-mini text-muted-foreground">loading…</div>;
  if (!group) return <div className="font-mono-mini text-muted-foreground">group not found. <Link to="/groups" className="underline">back</Link></div>;

  return (
    <div className="space-y-8">
      <header className="border-b border-hairline pb-6">
        <Link to="/groups" className="font-mono-mini text-muted-foreground hover:text-foreground">← all groups</Link>
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <h1 className="font-display text-5xl tracking-tighter">{group.name}</h1>
            {group.topic && <span className="font-mono-mini text-muted-foreground">#{group.topic}</span>}
            {group.description && <p className="font-mono-mini text-muted-foreground mt-2 max-w-2xl">{group.description}</p>}
          </div>
          {joined ? (
            <button onClick={leave} className="font-mono-mini text-muted-foreground hover:text-destructive">leave</button>
          ) : (
            <button onClick={join} className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">join</button>
          )}
        </div>
        <div className="font-mono-mini text-muted-foreground text-xs mt-3">{members.length} members</div>
      </header>

      {joined && (
        <form onSubmit={post} className="border border-hairline p-4 space-y-3">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="say something to the group…" rows={3}
            className="w-full font-mono-mini bg-transparent outline-none resize-none" />
          <div className="flex justify-end">
            <button className="font-mono-mini border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition">post</button>
          </div>
        </form>
      )}

      <ul className="space-y-6">
        {posts.length === 0 && <li className="font-mono-mini text-muted-foreground">nothing yet.</li>}
        {posts.map(p => (
          <li key={p.id} className="border-b border-hairline pb-6">
            <div className="flex items-baseline justify-between">
              <Link to={`/u/${p.author?.handle ?? ""}`} className="font-mono-mini hover:underline">@{p.author?.handle ?? "unknown"}</Link>
              <span className="font-mono-mini text-muted-foreground text-xs">{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
            <div className="flex gap-4 mt-3 font-mono-mini text-muted-foreground text-xs">
              <button onClick={() => toggleLike(p)} className={p.liked ? "text-foreground" : "hover:text-foreground"}>★ {p.likes}</button>
              <button onClick={() => { setReplyOpen(replyOpen === p.id ? null : p.id); setReplyText(""); }} className="hover:text-foreground">reply ({p.replies?.length ?? 0})</button>
            </div>
            {p.replies && p.replies.length > 0 && (
              <ul className="mt-3 ml-4 border-l border-hairline pl-4 space-y-3">
                {p.replies.map(r => (
                  <li key={r.id}>
                    <div className="flex items-baseline justify-between">
                      <Link to={`/u/${r.author?.handle ?? ""}`} className="font-mono-mini text-xs hover:underline">@{r.author?.handle ?? "unknown"}</Link>
                      <span className="font-mono-mini text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{r.content}</p>
                  </li>
                ))}
              </ul>
            )}
            {replyOpen === p.id && (
              <div className="mt-3 ml-4 space-y-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="write a reply…"
                  className="w-full font-mono-mini bg-transparent border border-hairline focus:border-foreground outline-none px-3 py-2" />
                <button onClick={() => reply(p.id)} className="font-mono-mini border border-foreground px-3 py-1 hover:bg-foreground hover:text-background transition">send</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
