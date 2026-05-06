import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function Paywall() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (params.get("paid") === "1") {
      // Poll profile a few times, webhook may take a moment
      let n = 0;
      const t = setInterval(async () => {
        n++;
        await refreshProfile();
        if (n >= 8) clearInterval(t);
      }, 1500);
      return () => clearInterval(t);
    }
    if (params.get("canceled") === "1") toast.error("Payment canceled");
  }, [params, refreshProfile]);

  useEffect(() => {
    if (profile?.paid) navigate("/feed", { replace: true });
  }, [profile?.paid, navigate]);

  const checkout = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("dodo-create-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (e: any) {
      toast.error(e.message || "Failed to start checkout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grain flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-hairline p-6 sm:p-10 bg-background/50 backdrop-blur">
        <div className="font-mono-mini text-muted-foreground mb-2">— membership</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tighter mb-4">One signal. Lifetime.</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          WTHR is a closed network for founders. A one-time $10 covers your seat for life — no renewals, no upsells.
        </p>
        <div className="border-t border-hairline pt-4 mb-6">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-5xl tracking-tighter">$10</span>
            <span className="font-mono-mini text-muted-foreground">lifetime · once</span>
          </div>
        </div>
        <button
          onClick={checkout}
          disabled={busy}
          className="w-full bg-foreground text-background py-3 font-mono-mini hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "opening checkout…" : "pay & enter"}
        </button>
        <button
          onClick={() => signOut().then(() => navigate("/"))}
          className="w-full mt-3 font-mono-mini text-muted-foreground hover:text-foreground"
        >
          sign out
        </button>
      </div>
    </div>
  );
}
