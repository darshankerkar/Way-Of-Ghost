import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { disconnectSocket } from "../socket/client";
import { getSocket } from "../socket/client";
import { http } from "../api/http";
import { RoninFigure, GdgLogo } from "../pages/LandingPage";
import type { EventState } from "../types";

type NavLinkItem = {
  to: string;
  label: string;
  disabled: boolean;
};

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventState, setEventState] = useState<EventState | null>(null);

  function handleLogout() {
    disconnectSocket();
    clearSession();
    navigate("/login");
  }

  const isActive = (path: string) => location.pathname === path;
  const inRound = location.pathname.startsWith("/round/");
  const activeRoundPath =
    eventState && eventState.roundStatus === "LIVE" && eventState.currentRound > 0
      ? `/round/${eventState.currentRound}`
      : null;

  useEffect(() => {
    if (!user || user.role === "ADMIN") return;

    let mounted = true;
    void http.get<EventState>("/round/event-state").then(({ data }) => {
      if (mounted) setEventState(data);
    }).catch(() => {});

    const socket = getSocket();
    if (!socket) {
      return () => {
        mounted = false;
      };
    }

    const refreshEventState = () => {
      void http.get<EventState>("/round/event-state").then(({ data }) => {
        if (mounted) setEventState(data);
      }).catch(() => {});
    };

    socket.on("round:started", refreshEventState);
    socket.on("round:reset", refreshEventState);

    return () => {
      mounted = false;
      socket.off("round:started", refreshEventState);
      socket.off("round:reset", refreshEventState);
    };
  }, [user]);

  if (!user) return null;

  const navLinks: NavLinkItem[] =
    user.role === "ADMIN"
      ? [
          { to: "/dashboard", label: "Dashboard", disabled: false },
          { to: "/admin", label: "Admin", disabled: false },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", disabled: false },
          {
            to: "/round/1",
            label: "Round 1",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/1",
          },
          {
            to: "/round/2",
            label: "Round 2",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/2",
          },
          {
            to: "/round/3",
            label: "Round 3",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/3",
          },
        ];

  return (
    <>
      <nav className={`sticky top-0 z-40 w-full px-3 pt-3 pb-2 md:px-6 ${inRound ? "bg-black" : ""}`}>
        <div className={`navbar-shell flex items-center justify-between px-4 py-2.5 ${inRound ? "!bg-[#0a0a0a] !border-gray-800" : ""}`}>
          {/* Brand: GDG Logo */}
          <Link to="/dashboard" className="gdg-nav-brand">
            <GdgLogo dark={inRound} />
          </Link>

          {/* Center: nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.disabled ? (
                <span
                  key={link.to}
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 opacity-50"
                  title="Unavailable while another round is live"
                >
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-4 py-1.5 text-[15px] font-bold tracking-wide transition-all duration-200 font-['Cinzel',serif] border ${
                    isActive(link.to)
                      ? inRound
                        ? "bg-[rgba(201,163,78,0.15)] text-[#c9a34e] shadow-[0_0_10px_rgba(201,163,78,0.2)] border-[rgba(201,163,78,0.3)]"
                        : "bg-[rgba(139,0,0,0.06)] text-[#8B0000] shadow-[0_2px_10px_rgba(139,0,0,0.05)] border-[rgba(139,0,0,0.25)]"
                      : inRound
                        ? "text-[rgba(255,255,255,0.55)] hover:text-[#c9a34e] hover:bg-[rgba(201,163,78,0.08)] border-transparent"
                        : "text-[rgba(26,26,26,0.55)] hover:text-[#8B0000] hover:bg-[rgba(139,0,0,0.06)] border-transparent hover:border-[rgba(139,0,0,0.15)]"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* Right: user + admin badge + logout */}
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex mr-1 items-center justify-center overflow-hidden rounded-md"
              style={{ width: "92px", height: "44px" }}
            >
              <img
                src="/logo_app.png"
                alt="Last Standing Ronin logo"
                width={118}
                height={54}
                style={{ width: "118px", height: "54px", objectFit: "contain", transform: "scale(1.12)", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.18))" }}
              />
            </div>
            <span className={`hidden sm:block text-[13px] font-bold font-['Cinzel',serif] max-w-[110px] truncate ${inRound ? "text-[rgba(255,255,255,0.7)]" : "text-[#1A1A1A]"}`}>
              {user.name}
            </span>

            <button
              onClick={handleLogout}
              className={`rounded border px-4 py-1.5 text-xs font-bold tracking-widest font-['Cinzel',serif] transition-all uppercase ${inRound ? "border-[rgba(201,163,78,0.5)] text-[#c9a34e] hover:bg-[rgba(201,163,78,0.15)]" : "border-[rgba(139,0,0,0.5)] text-[#8B0000] hover:bg-[rgba(139,0,0,0.08)] hover:shadow-md"}`}
            >
              Logout
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1 p-1 bg-transparent border-0 cursor-pointer"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "menu-open" : "menu-closed"}`}>
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-white text-2xl bg-transparent border-0 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
        {/* Ronin in mobile menu */}
        <div
          className="mb-2 ghost-on"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RoninFigure scale={0.75} />
        </div>
        {navLinks.map((link) =>
          link.disabled ? (
            <span
              key={link.to}
              aria-disabled="true"
              className="mobile-menu-link cursor-not-allowed opacity-50"
            >
              {link.label}
            </span>
          ) : (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-menu-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ),
        )}
        <button
          onClick={() => {
            setMenuOpen(false);
            handleLogout();
          }}
          className="mt-4 rounded-lg border border-ghost-gold/50 px-6 py-2 text-ghost-gold font-semibold text-sm hover:bg-ghost-gold/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </>
  );
}
