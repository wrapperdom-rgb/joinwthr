import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REVENUE = ["pre-revenue", "$1–10k MRR", "$10–50k MRR", "$50–250k MRR", "$250k+ MRR"];
const LOOKING = ["cofounder", "hires", "clients", "partners", "advisors"];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [building, setBuilding] = useState(profile?.building ?? "");
  const [revenue, setRevenue] = useState(profile?.revenue_stage ?? REVENUE[0]);
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [looking, setLooking] = useState<string[]>(profile?.looking_for ?? []);
  const [loading, setLoading] = useState(false);

  const toggle = (v: string) => setLooking(l => l.includes(v) ? l.filter(x => x !== v) : [...l, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      bio: bio.trim().slice(0, 240),
      building: building.trim().slice(0, 120),
      revenue_stage: revenue,
      skills: skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 12),
      looking_for: looking,
    }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    navigate("/feed");
  };

  return (
    <div className="min-h-screen grain">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono-mini text-muted-foreground mb-2">— step 01 / set the signal</p>
        <h1 className="font-display text-5xl tracking-tighter mb-2">Tell us what you ship.</h1>
        <p className="font-script text-2xl text-muted-foreground mb-12">no fluff.</p>

        <form onSubmit={submit} className="space-y-8">
          <Block label="What you're building">
            <input value={building} onChange={e => setBuilding(e.target.value)} maxLength={120}
              placeholder="One sentence. What & for whom."
              className="w-full bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg" />
          </Block>

          <Block label="Bio">
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={240} rows={3}
              placeholder="A sharp line about you."
              className="w-full bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 resize-none" />
          </Block>

          <Block label="Revenue / stage">
            <div className="flex flex-wrap gap-2 mt-2">
              {REVENUE.map(r => (
                <button key={r} type="button" onClick={() => setRevenue(r)}
                  className={`font-mono-mini px-3 py-2 border-hairline border ${revenue === r ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </Block>

          <Block label="Skills (comma separated)">
            <input value={skills} onChange={e => setSkills(e.target.value)}
              placeholder="growth, react, ai, design"
              className="w-full bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg" />
          </Block>

          <Block label="Looking for">
            <div className="flex flex-wrap gap-2 mt-2">
              {LOOKING.map(r => (
                <button key={r} type="button" onClick={() => toggle(r)}
                  className={`font-mono-mini px-3 py-2 border-hairline border ${looking.includes(r) ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </Block>

          <button disabled={loading} className="bg-foreground text-background font-mono-mini px-6 py-3 hover:opacity-80 transition">
            {loading ? "…" : "Enter network →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-mono-mini text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
