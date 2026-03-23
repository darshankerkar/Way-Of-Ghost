import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { disconnectSocket } from "../socket/client";
import { RoninFigure, GdgLogo } from "../pages/LandingPage";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  function handleLogout() {
    disconnectSocket();
    clearSession();
    navigate("/login");
  }

  const isActive = (path: string) => location.pathname === path;

  const navLinks =
    user.role === "ADMIN"
      ? [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/admin", label: "Admin" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/round/1", label: "Round 1" },
          { to: "/round/2", label: "Round 2" },
          { to: "/round/3", label: "Round 3" },
        ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full px-3 pt-3 pb-2 md:px-6">
        <div className="navbar-shell flex items-center justify-between px-4 py-2.5">
          {/* Brand: GDG Logo */}
          <Link to="/dashboard" className="gdg-nav-brand">
            <GdgLogo />
          </Link>

          {/* Center: nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-ghost-gold/14 text-ghost-gold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Ronin icon + user + logout */}
          <div className="flex items-center gap-2">
            {/* Tiny Ronin avatar */}
            <div
              className="hidden sm:flex items-center justify-center mr-1"
              style={{
                width: "32px",
                height: "32px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: "-4px", left: "-14px" }}>
                <RoninFigure scale={0.65} />
              </div>
            </div>
            <span className="hidden sm:block text-xs text-gray-400 max-w-[110px] truncate">
              {user.name}
            </span>
            {user.role === "ADMIN" && (
              <span className="rounded-full bg-ghost-gold/14 px-2 py-0.5 text-xs font-bold text-ghost-gold border border-ghost-gold/22">
                ADMIN
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-ghost-gold/50 px-3 py-1.5 text-xs text-ghost-gold hover:border-ghost-gold hover:text-ghost-gold hover:bg-ghost-gold/10 transition-colors"
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
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="mobile-menu-link"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
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
