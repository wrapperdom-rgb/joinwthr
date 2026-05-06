import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const nav = [
  { to: "/feed", label: "Feed" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/discover", label: "Discover" },
  { to: "/groups", label: "Groups" },
  { to: "/messages", label: "Messages" },
];

export default function Shell() {
  const { user, loading, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    // Hard paywall: admins and bots bypass
    if (profile && !profile.paid && !isAdmin && !profile.is_bot) {
      navigate("/paywall", { replace: true });
    }
  }, [loading, user, profile, isAdmin, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono-mini">loading…</div>;
  }

  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/feed" className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tighter">WTHR</span>
            <span className="font-script text-sm text-muted-foreground">private network</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {nav.map(n => (
              <NavLink key={n.to} to={n.to}
                className={({isActive}) => `font-mono-mini transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {n.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin"
                className={({isActive}) => `font-mono-mini transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Link to={`/u/${profile?.handle ?? ''}`} className="font-mono-mini text-muted-foreground hover:text-foreground">@{profile?.handle}</Link>
            <button onClick={() => signOut().then(() => navigate("/"))} className="font-mono-mini text-muted-foreground hover:text-foreground">Sign out</button>
          </div>
        </div>
        <nav className="md:hidden flex justify-around border-t border-hairline">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({isActive}) => `flex-1 text-center py-3 font-mono-mini ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <Outlet />
      </main>
      <footer className="border-t border-hairline mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
          <span className="font-mono-mini text-muted-foreground">WTHR — No noise. Just signal.</span>
          <span className="font-script text-muted-foreground">est. mmxxvi</span>
        </div>
      </footer>
    </div>
  );
}
