import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email("Valid email required").max(255),
  building: z.string().trim().min(2, "Tell us what you're building").max(160),
  url: z.string().trim().max(255).optional().or(z.literal("")),
  revenue_stage: z.string().trim().min(1, "Pick one"),
  why: z.string().trim().min(20, "At least 20 chars").max(800),
  referrer: z.string().trim().max(160).optional().or(z.literal("")),
});

const STAGES = [
  "Pre-revenue",
  "$1–10k MRR",
  "$10–50k MRR",
  "$50k+ MRR",
  "Bootstrapped, profitable",
  "Funded",
];

type Form = z.infer<typeof schema>;

const STEPS: { key: keyof Form; label: string; hint: string; type?: "text"|"email"|"textarea"|"select"|"url" }[] = [
  { key: "name", label: "What's your name?", hint: "Real name. We're not LinkedIn — but we're not anonymous either.", type: "text" },
  { key: "email", label: "Where can we reach you?", hint: "Used to send your invite if approved.", type: "email" },
  { key: "building", label: "What are you building?", hint: "One sentence. The thing you ship every day.", type: "text" },
  { key: "url", label: "Link to it.", hint: "Website, app, or X. Optional but helps.", type: "url" },
  { key: "revenue_stage", label: "Where are you?", hint: "Be honest. We vet for signal, not vanity.", type: "select" },
  { key: "why", label: "Why WTHR?", hint: "What do you want from a private room of operators?", type: "textarea" },
  { key: "referrer", label: "Anyone refer you?", hint: "Optional. Handle or name.", type: "text" },
];

export default function RequestAccess() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>({
    name: "", email: "", building: "", url: "", revenue_stage: "", why: "", referrer: "",
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const value = form[current.key] ?? "";

  const next = () => {
    // per-field soft validation
    if (current.key === "email" && !z.string().email().safeParse(value).success) {
      return toast.error("Enter a valid email");
    }
    if (["url", "referrer"].includes(current.key) === false && !String(value).trim()) {
      return toast.error("Required");
    }
    if (current.key === "why" && String(value).trim().length < 20) {
      return toast.error("At least 20 characters");
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const payload: any = {
      ...parsed.data,
      url: parsed.data.url || null,
      referrer: parsed.data.referrer || null,
    };
    const { error } = await (supabase.from("access_requests") as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen grain bg-background flex flex-col">
      <header className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl">WTHR</Link>
          <span className="font-mono-mini text-muted-foreground">request access</span>
        </div>
      </header>

      {done ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg text-center space-y-6">
            <p className="font-mono-mini text-muted-foreground">— received</p>
            <p className="font-script text-4xl text-muted-foreground">thank you.</p>
            <h2 className="font-display text-5xl tracking-tighter">We'll be in touch.</h2>
            <p className="text-muted-foreground">
              Every request is read by a human. If you're a fit, we'll send an invite to your email.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Link to="/" className="font-mono-mini border border-hairline px-5 py-3 hover:bg-foreground hover:text-background transition">← Home</Link>
              <Link to="/auth" className="font-mono-mini bg-foreground text-background px-5 py-3 hover:opacity-80 transition">Already have an invite?</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between p-12 border-r border-hairline">
            <p className="font-mono-mini text-muted-foreground">— vetting</p>
            <div>
              <p className="font-script text-4xl text-muted-foreground mb-4">we read every one.</p>
              <h2 className="font-display text-5xl tracking-tighter">Make it count.</h2>
              <p className="text-muted-foreground mt-6 max-w-sm">
                WTHR stays small on purpose. Tell us what you're shipping and why this room matters to you.
              </p>
            </div>
            <span className="font-mono-mini text-muted-foreground">step {step + 1} of {STEPS.length}</span>
          </div>

          <div className="flex flex-col p-8 md:p-12">
            <div className="h-px bg-hairline w-full relative mb-12">
              <div className="absolute left-0 top-0 h-px bg-foreground transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto md:mx-0">
              <p className="font-mono-mini text-muted-foreground mb-3">
                {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </p>
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-3">{current.label}</h1>
              <p className="text-muted-foreground mb-8">{current.hint}</p>

              {current.type === "textarea" ? (
                <textarea
                  autoFocus
                  value={value as string}
                  onChange={(e) => setForm(f => ({ ...f, [current.key]: e.target.value }))}
                  rows={5}
                  className="bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg resize-none"
                  placeholder="Type here…"
                />
              ) : current.type === "select" ? (
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, revenue_stage: s }))}
                      className={`font-mono-mini border px-4 py-2 transition ${form.revenue_stage === s ? "bg-foreground text-background border-foreground" : "border-hairline text-muted-foreground hover:text-foreground hover:border-foreground"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  autoFocus
                  type={current.type ?? "text"}
                  value={value as string}
                  onChange={(e) => setForm(f => ({ ...f, [current.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isLast ? submit() : next(); } }}
                  placeholder="Type here…"
                  className="bg-transparent border-b border-hairline focus:border-foreground outline-none py-2 text-lg"
                />
              )}

              <div className="flex justify-between items-center mt-12">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  className="font-mono-mini text-muted-foreground hover:text-foreground transition disabled:opacity-30"
                >
                  ← back
                </button>
                {isLast ? (
                  <button
                    onClick={submit}
                    disabled={busy}
                    className="font-mono-mini bg-foreground text-background px-6 py-3 hover:opacity-80 transition disabled:opacity-40"
                  >
                    {busy ? "sending…" : "Submit request →"}
                  </button>
                ) : (
                  <button
                    onClick={next}
                    className="font-mono-mini bg-foreground text-background px-6 py-3 hover:opacity-80 transition"
                  >
                    Continue →
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="font-mono-mini text-muted-foreground hover:text-foreground transition mt-12 text-left"
              >
                Already have an invite? Sign in →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
