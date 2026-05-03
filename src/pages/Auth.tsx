import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  invite: z.string().trim().min(3).max(64),
  name: z.string().trim().min(1).max(80),
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, _").min(2).max(30),
});

export default function AuthPage() {
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/feed");
      } else {
        const parsed = signupSchema.safeParse({ email, password, invite, name, handle });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);

        // Validate invite
        const { data: inv } = await supabase.from("invite_codes").select("*").eq("code", invite.trim()).maybeSingle();
        if (!inv) throw new Error("Invalid invite code.");
        if (inv.used_by) throw new Error("Invite already used.");

        // Check handle
        const { data: existing } = await supabase.from("profiles").select("id").eq("handle", handle).maybeSingle();
        if (existing) throw new Error("Handle taken.");

        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/feed`,
            data: { name, handle }
          }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("invite_codes").update({ used_by: data.user.id, used_at: new Date().toISOString() }).eq("code", invite.trim());
        }
        toast.success("Welcome to WTHR.");
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grain flex flex-col">
      <header className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl">WTHR</Link>
          <span className="font-mono-mini text-muted-foreground">{mode === "signin" ? "sign in" : "request access"}</span>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-12 border-r border-hairline">
          <p className="font-mono-mini text-muted-foreground">— manifesto</p>
          <div>
            <p className="font-script text-4xl text-muted-foreground mb-4">no noise.</p>
            <h2 className="font-display text-5xl tracking-tighter">Just signal.</h2>
            <p className="text-muted-foreground mt-6 max-w-sm">
              WTHR is a closed room of vetted operators. Find people who ship. Hire from a quieter pool.
            </p>
          </div>
          <span className="font-mono-mini text-muted-foreground">private network · invite only</span>
        </div>

        <div className="flex items-center justify-center p-8">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
            <div className="flex gap-1 border-hairline border w-fit">
              {(["signin","signup"] as const).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`font-mono-mini px-4 py-2 ${mode === m ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {mode === "signup" && (
              <>
                <Field label="Invite code" value={invite} onChange={setInvite} placeholder="WTHR-XXXX" />
                <Field label="Name" value={name} onChange={setName} placeholder="Jane Smith" />
                <Field label="Handle" value={handle} onChange={(v) => setHandle(v.toLowerCase())} placeholder="jane" />
              </>
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />

            <button disabled={loading} className="w-full bg-foreground text-background font-mono-mini py-3 hover:opacity-80 transition disabled:opacity-40">
              {loading ? "…" : mode === "signin" ? "Enter →" : "Create account →"}
            </button>

            {mode === "signup" && (
              <p className="font-mono-mini text-muted-foreground text-center pt-2">Try: WTHR-FOUNDER</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text", placeholder="" }:{
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono-mini text-muted-foreground">{label}</span>
      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg transition-colors"
      />
    </label>
  );
}
