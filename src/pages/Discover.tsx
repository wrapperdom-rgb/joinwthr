import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type P = {
  id: string; handle: string; name: string; bio: string | null; building: string | null;
  revenue_stage: string | null; skills: string[] | null; looking_for: string[] | null;
};

export default function Discover() {
  const [profiles, setProfiles] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("");

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setProfiles((data as any) ?? []);
    });
  }, []);

  const stages = useMemo(() => Array.from(new Set(profiles.map(p => p.revenue_stage).filter(Boolean))) as string[], [profiles]);

  const filtered = profiles.filter(p => {
    if (stage && p.revenue_stage !== stage) return false;
    if (!q) return true;
    const hay = `${p.name} ${p.handle} ${p.bio} ${p.building} ${(p.skills ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <header className="mb-10">
        <p className="font-mono-mini text-muted-foreground">— the room</p>
        <h1 className="font-display text-5xl tracking-tighter mt-2">Discover <span className="font-script text-muted-foreground italic">founders.</span></h1>
      </header>

      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="search name, skill, project…"
          className="flex-1 min-w-[200px] bg-transparent border-b border-hairline focus:border-foreground outline-none py-2" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStage("")} className={`font-mono-mini px-3 py-2 border-hairline border ${!stage ? "bg-foreground text-background" : "text-muted-foreground"}`}>All</button>
          {stages.map(s => (
            <button key={s} onClick={() => setStage(s)} className={`font-mono-mini px-3 py-2 border-hairline border ${stage === s ? "bg-foreground text-background" : "text-muted-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border-hairline border">
        {filtered.map(p => (
          <Link to={`/u/${p.handle}`} key={p.id} className="bg-card p-5 hover:bg-accent transition group">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-xl">{p.name}</h3>
              <span className="font-mono-mini text-muted-foreground">@{p.handle}</span>
            </div>
            <p className="font-script text-muted-foreground text-lg mt-1">{p.revenue_stage || "—"}</p>
            <p className="mt-3 text-sm">{p.building || <span className="text-muted-foreground">building in stealth.</span>}</p>
            <div className="flex flex-wrap gap-1 mt-4">
              {(p.skills ?? []).slice(0, 4).map(s => (
                <span key={s} className="font-mono-mini text-muted-foreground border-hairline border px-2 py-0.5">{s}</span>
              ))}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="bg-card p-12 text-center text-muted-foreground font-mono-mini lg:col-span-3 sm:col-span-2">no founders match.</div>}
      </div>
    </div>
  );
}
