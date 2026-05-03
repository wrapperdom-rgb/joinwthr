import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen grain bg-background">
      <header className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl">WTHR</span>
            <span className="font-script text-sm text-muted-foreground">private network</span>
          </div>
          <Link to="/auth" className="font-mono-mini border-hairline border px-4 py-2 hover:bg-foreground hover:text-background transition">Enter</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-28 pb-24 relative z-10">
        <p className="font-mono-mini text-muted-foreground mb-8">— invite only · vetted founders</p>
        <h1 className="font-display text-[clamp(3rem,9vw,9rem)] leading-[0.85] tracking-tighter">
          A private<br/>
          network for<br/>
          <span className="font-script font-normal text-muted-foreground italic">serious </span>
          founders.
        </h1>
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl">
          <p className="text-lg text-muted-foreground leading-snug">
            No likes. No followers. No noise. Just builders shipping work that compounds.
          </p>
          <div className="md:col-start-3 flex md:justify-end items-end gap-4">
            <Link to="/auth" className="font-mono-mini bg-foreground text-background px-6 py-3 hover:opacity-80 transition">Request access →</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 divide-hairline md:divide-x-0">
          {[
            { k: "01", t: "Vetted only", d: "Profitable or high-potential founders. Invite codes required. No exceptions." },
            { k: "02", t: "High signal", d: "Opportunities, insights, wins. We hide the dopamine, you keep the focus." },
            { k: "03", t: "Real reach", d: "DM any founder. Find collaborators, hires, clients — without the cold game." },
          ].map(b => (
            <div key={b.k} className="md:px-10 py-6 md:py-0">
              <span className="font-mono-mini text-muted-foreground">{b.k}</span>
              <h3 className="font-display text-3xl mt-3">{b.t}</h3>
              <p className="text-muted-foreground mt-3">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-start">
          <p className="font-script text-3xl text-muted-foreground mb-4">a quiet room.</p>
          <h2 className="font-display text-5xl md:text-7xl tracking-tighter max-w-3xl">Built for founders who already know what they're doing.</h2>
          <Link to="/auth" className="mt-12 font-mono-mini border-hairline border px-6 py-3 hover:bg-foreground hover:text-background transition">Enter with invite →</Link>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between">
          <span className="font-mono-mini text-muted-foreground">WTHR · private network</span>
          <span className="font-script text-muted-foreground">est. mmxxvi</span>
        </div>
      </footer>
    </div>
  );
}
