import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Msg = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string };
type Conv = { other_id: string; handle: string; name: string; last: string; at: string };

export default function Messages() {
  const { user } = useAuth();
  const { otherId } = useParams();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [other, setOther] = useState<{ handle: string; name: string } | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Build conversation list
  const loadConvs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, content, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data) return;
    const map = new Map<string, Msg>();
    for (const m of data as Msg[]) {
      const other_id = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!map.has(other_id)) map.set(other_id, m);
    }
    const ids = Array.from(map.keys());
    if (ids.length === 0) { setConvs([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, handle, name").in("id", ids);
    const profMap = new Map(profs?.map(p => [p.id, p]) ?? []);
    setConvs(ids.map(id => {
      const m = map.get(id)!;
      const p = profMap.get(id);
      return { other_id: id, handle: p?.handle ?? "—", name: p?.name ?? "Founder", last: m.content, at: m.created_at };
    }));
  };

  useEffect(() => { loadConvs(); }, [user?.id]);

  // Load thread
  useEffect(() => {
    if (!user || !otherId) { setMsgs([]); setOther(null); return; }
    supabase.from("profiles").select("handle, name").eq("id", otherId).maybeSingle().then(({ data }) => setOther(data as any));
    supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMsgs((data as Msg[]) ?? []));

    const ch = supabase.channel(`dm-${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user.id && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === user.id)) {
          setMsgs(prev => [...prev, m]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, otherId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otherId || !text.trim()) return;
    const content = text.trim().slice(0, 1000);
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, recipient_id: otherId, content });
    loadConvs();
  };

  return (
    <div>
      <header className="mb-8">
        <p className="font-mono-mini text-muted-foreground">— private messages</p>
        <h1 className="font-display text-5xl tracking-tighter mt-2">Quiet <span className="font-script text-muted-foreground italic">conversations.</span></h1>
      </header>

      <div className="grid md:grid-cols-[280px_1fr] gap-px bg-hairline border-hairline border min-h-[60vh]">
        <aside className="bg-card overflow-y-auto">
          {convs.length === 0 && <div className="p-6 text-muted-foreground font-mono-mini">no threads.</div>}
          {convs.map(c => (
            <button key={c.other_id} onClick={() => navigate(`/messages/${c.other_id}`)}
              className={`w-full text-left p-4 border-b border-hairline hover:bg-accent transition ${otherId === c.other_id ? "bg-accent" : ""}`}>
              <div className="flex justify-between items-baseline">
                <span className="font-display">{c.name}</span>
                <span className="font-mono-mini text-muted-foreground">{new Date(c.at).toLocaleDateString()}</span>
              </div>
              <span className="font-mono-mini text-muted-foreground">@{c.handle}</span>
              <p className="text-sm text-muted-foreground truncate mt-1">{c.last}</p>
            </button>
          ))}
        </aside>

        <section className="bg-card flex flex-col">
          {!otherId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono-mini">select a thread, or open a profile to start one.</div>
          ) : (
            <>
              <div className="border-b border-hairline p-4 flex justify-between items-baseline">
                <Link to={`/u/${other?.handle}`} className="font-display text-lg">{other?.name} <span className="font-mono-mini text-muted-foreground">@{other?.handle}</span></Link>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {msgs.map(m => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-3 ${mine ? "bg-foreground text-background" : "bg-accent"}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <span className={`block font-mono-mini mt-1 ${mine ? "opacity-60" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-hairline p-3 flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} maxLength={1000}
                  placeholder="Type. Send."
                  className="flex-1 bg-transparent outline-none px-2" />
                <button className="bg-foreground text-background font-mono-mini px-4 py-2">Send →</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
