import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Landing() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toUTCString().split(" ")[4] + " UTC");
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen grain vignette scanlines bg-background relative overflow-hidden">
      {/* Top transmission bar */}
      <div className="border-b border-hairline bg-background relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-9 flex items-center justify-between font-mono-mini text-muted-foreground">
          <span className="flicker">▓ TRANSMISSION OPEN</span>
          <span className="hidden sm:inline">CH.07 / ENCRYPTED</span>
          <span>{time}</span>
        </div>
      </div>

      <header className="border-b border-hairline relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl glitch-text not-italic font-light tracking-tight">W·T·H·R</span>
            <span className="font-script text-sm text-muted-foreground hidden sm:inline">whisper network</span>
          </div>
          <Link to="/auth" className="font-mono-mini border-hairline border px-4 py-2 hover:bg-foreground hover:text-background transition">
            Knock →
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-28 relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <span className="w-2 h-2 bg-destructive rounded-full breathe" />
          <p className="font-mono-mini text-muted-foreground">classified · invite only · vetted operators</p>
        </div>

        <h1 className="font-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.82] tracking-tighter italic">
          You weren't<br/>
          supposed<br/>
          <span className="not-italic font-light">to find </span>
          <span className="font-script not-italic text-muted-foreground">us.</span>
        </h1>

        <div className="mt-20 grid md:grid-cols-3 gap-10 max-w-5xl">
          <p className="font-sans-ui text-base text-muted-foreground leading-relaxed md:col-span-2">
            A room behind a door behind a name. No follower counts. No public profiles. No algorithm.
            Just founders who already know what silence is worth.
          </p>
          <div className="flex md:justify-end items-end gap-4">
            <Link to="/auth" className="font-mono-mini bg-foreground text-background px-6 py-3 hover:opacity-80 transition group">
              Enter the room <span className="inline-block group-hover:translate-x-1 transition">→</span>
            </Link>
          </div>
        </div>

        {/* Whispered ticker */}
        <div className="mt-20 border-t border-b border-hairline py-4 marquee-fade overflow-hidden">
          <div className="font-mono-mini text-muted-foreground whitespace-nowrap flex gap-12 animate-[marquee_40s_linear_infinite]">
            {Array.from({length:2}).map((_,i)=>(
              <span key={i} className="flex gap-12">
                <span>· 1,247 operators inside</span>
                <span>· $42M MRR represented</span>
                <span>· 0 public posts</span>
                <span>· 14 invites issued this week</span>
                <span>· don't tell anyone</span>
                <span>· silence is a feature</span>
                <span>· no screenshots</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* THREE TENETS */}
      <section className="border-t border-hairline relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-3 divide-hairline md:divide-y-0">
          {[
            { k: "I", t: "Vetted only", d: "Each member is opened by another. The door does not unlock for strangers." },
            { k: "II", t: "No witnesses", d: "No likes. No counts. No public feed. What you say here, stays in the room." },
            { k: "III", t: "Real reach", d: "DM any operator. Find collaborators, hires, clients — without the cold game." },
          ].map((b, i) => (
            <div key={b.k} className={`md:px-10 py-10 md:py-0 ${i > 0 ? "md:border-l md:border-hairline" : ""}`}>
              <span className="font-display text-5xl text-muted-foreground italic">{b.k}</span>
              <h3 className="font-display text-3xl mt-4 italic">{b.t}</h3>
              <p className="font-sans-ui text-muted-foreground mt-3 text-sm leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHISPER */}
      <section className="border-t border-hairline relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-32 flex flex-col items-start">
          <p className="font-script text-3xl text-muted-foreground mb-6 breathe">they said it doesn't exist.</p>
          <h2 className="font-display text-5xl md:text-8xl tracking-tighter max-w-4xl italic leading-[0.9]">
            Built for those who already know the door.
          </h2>
          <div className="mt-16 flex flex-wrap gap-4 items-center">
            <Link to="/auth" className="font-mono-mini border-hairline border px-6 py-3 hover:bg-foreground hover:text-background transition">
              I have a code →
            </Link>
            <span className="font-script text-muted-foreground text-xl">or wait to be asked.</span>
          </div>
        </div>
      </section>

      {/* TRANSMISSION LOG */}
      <section className="border-t border-hairline bg-elevated relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="font-mono-mini text-muted-foreground mb-6">— last transmissions / redacted</p>
          <div className="space-y-3 font-mono-mini text-muted-foreground/70 text-xs">
            <p>04:12:08  ▓▓▓▓▓ joined the room  ·  invited by ▓▓▓▓▓</p>
            <p>04:18:33  ▓▓▓▓▓ posted opportunity  ·  hire / sr engineer / remote</p>
            <p>04:22:01  ▓▓▓▓▓ → ▓▓▓▓▓  ·  message  ·  end-to-end</p>
            <p>04:29:47  ▓▓▓▓▓ left the room. no trace.</p>
            <p className="text-foreground">04:31:00  · you are reading this. why are you reading this.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap justify-between items-center gap-4">
          <span className="font-mono-mini text-muted-foreground">WTHR · whisper network · est. mmxxvi</span>
          <span className="font-script text-muted-foreground text-lg">don't tell anyone.</span>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
