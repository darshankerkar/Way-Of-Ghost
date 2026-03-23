import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { register } from "../api/auth";
import { connectSocket } from "../socket/client";
import { useAuthStore } from "../store/auth.store";

/* ─── Reusable Ronin figure (Samurai style) ──────────────────────────────── */
export function RoninFigure({
  scale = 1,
  className = "",
}: {
  scale?: number;
  className?: string;
}) {
  return (
    <div
      className={`ronin-figure ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center top",
        display: "inline-block",
      }}
      aria-hidden="true"
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ghost-gold"
      >
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="m13 19 6-6" />
        <path d="M16 16 20 20" />
        <path d="M19 21 21 19" />
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        <line x1="5" x2="9" y1="14" y2="10" />
        <line x1="17" x2="11" y1="11" y2="17" />
        <line x1="2" x2="4" y1="20" y2="22" />
      </svg>
    </div>
  );
}

/* ─── GDG Brand Logo (<> chevron SVG style) ─────────────────────────────── */
export function GdgLogo() {
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <svg
        width="52"
        height="30"
        viewBox="0 0 56 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path
          d="M21 5.5L6.5 16"
          stroke="#ea4335"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
        <path
          d="M21 26.5L6.5 16"
          stroke="#4285f4"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
        <path
          d="M35 5.5L49.5 16"
          stroke="#34a853"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
        <path
          d="M35 26.5L49.5 16"
          stroke="#fbbc04"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-start leading-[1.15] ml-0.5 pt-[1px]">
        <span className="text-[14px] font-[800] tracking-[0.01em] text-white">
          Google Developer Groups
        </span>
        <span className="text-[12px] font-[600] tracking-[0.04em] text-white/60">
          VIT Mumbai
        </span>
      </div>
    </div>
  );
}

/* ─── Social Icons ─────────────────────────────────────────────────────── */
function IconInstagram() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

/* ─── Creepy floating particles (GPU-only: transform + opacity) ──── */
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${12 + i * 11}%`,
  size: `${2 + (i % 2)}px`,
  delay: `${i * 1.2}s`,
  duration: `${9 + i * 1.5}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (20 + i * 5)}px`,
}));

function CreepyParticles() {
  return (
    <div className="creepy-particles" aria-hidden="true">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="c-particle"
          style={{
            left: p.left,
            bottom: "-6px",
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}

/* ─── INTRO OVERLAY ──────────────────────────────────────────────────── */
function IntroOverlay({
  visible,
  showGhost,
  doStrike,
}: {
  visible: boolean;
  showGhost: boolean;
  doStrike: boolean;
}) {
  return (
    <>
      {/* Black intro bg */}
      <div
        className={`contest-intro-overlay ${visible ? "contest-intro-visible" : "contest-intro-hidden"}`}
        aria-hidden={!visible}
      >
        <div className="contest-intro-stars" />
        <div className="contest-intro-core">
          {/* Ghost + tagline */}
          <div
            className={`contest-ghost-wrap ${showGhost ? "ghost-on" : "ghost-off"}`}
          >
            <RoninFigure scale={1.3} />
            <p className="ghost-tagline">Your Destiny Awaits</p>
          </div>
        </div>
      </div>

      {/* Strike overlay (separate z-layer, on top) */}
      <div
        className={`strike-overlay ${doStrike ? "strike-active" : ""}`}
        aria-hidden="true"
      >
        <div className="strike-slash" />
        <div className="strike-shockwave" />
        <div className="strike-vignette" />
      </div>
    </>
  );
}

/* ─── Login Modal ────────────────────────────────────────────────────── */
function LoginModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ email, password });
      setSession(data.token, data.user);
      connectSocket(data.token);
      navigate(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal-card">
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="flex justify-center mb-5" style={{ height: "70px" }}>
          <div style={{ position: "relative", top: "-10px" }}>
            <RoninFigure scale={0.65} />
          </div>
        </div>
        <h2
          className="text-xl font-bold text-white text-center"
          style={{ fontFamily: "'Orbitron',sans-serif" }}
        >
          Enter The Dojo
        </h2>
        <p className="text-xs text-gray-400 text-center mt-1 mb-6">
          Welcome back, Ronin.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1.5">
              Email
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1.5">
              Password
            </label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-xs text-ghost-red bg-ghost-red/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="contest-btn-primary w-full rounded-xl py-3 font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Entering…" : "Enter Arena"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-5">
          No account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-ghost-gold hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs"
          >
            Create Warrior ID
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── Register Modal ─────────────────────────────────────────────────── */
function RegisterModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await register({ name, college, email, password });
      setMessage(
        "Registration submitted! An admin will approve your account. You can then log in.",
      );
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal-card">
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="flex justify-center mb-4" style={{ height: "60px" }}>
          <div style={{ position: "relative", top: "-10px" }}>
            <RoninFigure scale={0.6} />
          </div>
        </div>
        <h2
          className="text-lg font-bold text-white text-center"
          style={{ fontFamily: "'Orbitron',sans-serif" }}
        >
          Create Ronin ID
        </h2>
        <p className="text-xs text-gray-400 text-center mt-1 mb-5">
          Join the Ronin arena.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1">
              Full Name
            </label>
            <input
              className="auth-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1">
              College
            </label>
            <input
              className="auth-input"
              placeholder="Your college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1">
              Email
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ghost-gold mb-1">
              Password
            </label>
            <input
              className="auth-input"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {message && (
            <p className="text-xs text-ghost-green bg-ghost-green/10 rounded-lg px-3 py-2">
              {message}
            </p>
          )}
          {error && (
            <p className="text-xs text-ghost-red bg-ghost-red/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !!message}
            className="contest-btn-primary w-full rounded-xl py-3 font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Register"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          Already a warrior?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-ghost-gold hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── LANDING PAGE ───────────────────────────────────────────────────── */
export function LandingPage() {
  // Intro stages: "ghost" → show ghost for ~1s → "strike" → play strike → "done"
  const [introStage, setIntroStage] = useState<"ghost" | "strike" | "done">(
    "ghost",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const strikeRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const showLogin = location.pathname === "/login";
  const showRegister = location.pathname === "/register";

  useEffect(() => {
    // After 1.1s show ghost → trigger strike animation
    const t1 = window.setTimeout(() => {
      if (!strikeRef.current) {
        strikeRef.current = true;
        setIntroStage("strike");
      }
    }, 1100);
    // After 1.7s end intro (strike plays 0.55s, give it time + buffer)
    const t2 = window.setTimeout(() => {
      setIntroStage("done");
    }, 1750);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const socialItems = [
    {
      label: "Instagram",
      icon: <IconInstagram />,
      href: "https://www.instagram.com/gdg_vit/",
    },
    {
      label: "GDG Website",
      icon: <IconGlobe />,
      href: "https://gdgsite.vercel.app/",
    },
    {
      label: "LinkedIn",
      icon: <IconLinkedIn />,
      href: "https://www.linkedin.com/company/google-developer-groups-vit-mumbai/posts/?feedView=all",
    },
    {
      label: "GitHub",
      icon: <IconGitHub />,
      href: "https://github.com/GDGVITM/",
    },
  ];

  const showIntroOverlay = introStage !== "done";
  const showGhost = introStage === "ghost" || introStage === "strike";
  const doStrike = introStage === "strike";

  return (
    <div className="contest-bg relative min-h-screen text-white">
      {/* Intro + strike */}
      <IntroOverlay
        visible={showIntroOverlay}
        showGhost={showGhost}
        doStrike={doStrike}
      />

      {/* Creepy background */}
      <div
        className="contest-grid-overlay absolute inset-0"
        aria-hidden="true"
      />
      <div className="creepy-fog absolute inset-0" aria-hidden="true" />
      <div className="creepy-blob-center" aria-hidden="true" />
      <CreepyParticles />
      <div
        className="contest-radial-glow absolute -left-24 -top-16 h-80 w-80 rounded-full"
        aria-hidden="true"
      />
      <div
        className="contest-radial-glow-alt contest-radial-glow absolute -right-24 bottom-8 h-96 w-96 rounded-full"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="contest-node contest-node-a" />
        <div className="contest-node contest-node-b" />
        <div className="contest-node contest-node-c" />
        <div className="contest-node contest-node-d" />
      </div>

      {/* ── NAVBAR: Brand | (nothing in center) | About pill + socials ── */}
      <header
        className={`relative z-20 w-full px-4 pt-4 pb-2 md:px-8 transition-all duration-500 ${
          showIntroOverlay
            ? "-translate-y-2 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[rgba(9,13,22,.90)] px-5 py-3 landing-navbar">
          {/* LEFT: GDG Brand */}
          <Link to="/" className="gdg-nav-brand">
            <GdgLogo />
          </Link>

          {/* RIGHT: About Event + Socials (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/about"
              className="rounded-full border border-ghost-gold/22 bg-ghost-gold/8 px-4 py-1.5 text-xs font-semibold text-ghost-gold hover:bg-ghost-gold/14 transition-colors"
            >
              About the Event
            </Link>
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="contest-social-chip"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1 bg-transparent border-0 cursor-pointer"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="block w-5 h-0.5 bg-gray-400 rounded" />
            <span className="block w-5 h-0.5 bg-gray-400 rounded" />
            <span className="block w-5 h-0.5 bg-gray-400 rounded" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "menu-open" : "menu-closed"}`}>
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-white text-2xl bg-transparent border-0 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
        <Link
          to="/about"
          className="mobile-menu-link"
          onClick={() => setMenuOpen(false)}
        >
          About Event
        </Link>
        <div className="flex items-center gap-3 mt-2">
          {socialItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="contest-social-chip"
              aria-label={item.label}
            >
              {item.icon}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-3 mt-5 w-full max-w-xs px-6">
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/login");
            }}
            className="contest-btn-primary rounded-xl px-6 py-3 text-sm font-semibold text-center"
          >
            Enter Arena
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/register");
            }}
            className="contest-btn-secondary rounded-xl px-6 py-3 text-sm font-semibold text-center"
          >
            Create Warrior ID
          </button>
        </div>
      </div>

      {/* ── SECTION 1: HERO ──────────────────────────────────────────── */}
      <section
        className={`relative z-10 flex items-center justify-center min-h-[calc(100vh-90px)] px-4 pb-8 pt-4 transition-all duration-500 ${
          showIntroOverlay
            ? "translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {/* Glass card box */}
        <div className="hero-glass-card flex flex-col items-center text-center max-w-[680px] w-full">
          {/* Event badge */}
          <div className="contest-badge inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-[.2em] mb-6">
            GDG VITM Event 2026
          </div>

          {/* Title */}
          <h1 className="contest-title text-6xl leading-[1.05] md:text-7xl mb-4">
            Last Standing Ronin
          </h1>

          {/* Tagline subtitle */}
          <p className="hero-subtitle mb-5">
            <span>Code</span>
            <span className="hero-sep">·</span>
            <span>Duel</span>
            <span className="hero-sep">·</span>
            <span>Survive</span>
          </p>

          {/* Event description */}
          <p className="hero-description mb-10">
            A high-stakes, multi-round DSA battleground organised by{" "}
            <span className="text-[#38bdf8] font-semibold">
              Google Developer Groups VIT Mumbai
            </span>
            . Duel opponents head-to-head, survive the quiz sprint, and
            strategise your way to the throne in a three-round elimination
            tournament built for precision coders.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              className="contest-btn-primary rounded-xl px-9 py-3.5 text-sm font-bold"
              to="/register"
            >
              Register Now →
            </Link>
            <Link
              className="contest-btn-secondary rounded-xl px-9 py-3.5 text-sm font-semibold"
              to="/login"
            >
              Already Registered? Login
            </Link>
          </div>

          {/* scroll hint */}
          <div className="scroll-hint mt-12" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CREEPY ROADMAP ─────────────────────────────────── */}
      <section className="roadmap-section relative z-10 w-full px-4 pb-24 pt-10">
        {/* Section label */}
        <p className="roadmap-eyebrow text-center mb-2">Your Path</p>
        <h2 className="roadmap-heading text-center mb-16">Survive All Three</h2>

        {/* Road SVG */}
        <div className="roadmap-canvas mx-auto">
          <svg
            viewBox="0 0 1000 340"
            preserveAspectRatio="xMidYMid meet"
            className="roadmap-svg"
            aria-hidden="true"
          >
            <defs>
              {/* Road gradient — dark asphalt */}
              <linearGradient id="road-fill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="50%" stopColor="#16213e" />
                <stop offset="100%" stopColor="#0f0f1e" />
              </linearGradient>

              {/* Node glow — lightweight blur only (3px, not 6) */}
              <filter
                id="node-glow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Clip to viewbox */}
              <clipPath id="road-clip">
                <rect x="0" y="0" width="1000" height="340" />
              </clipPath>
            </defs>

            {/* ── Road body (thick stroke acts as asphalt) ── */}
            {/* The winding S-curve centerline */}
            <path
              id="road-center"
              d="M 30,280 C 120,280 160,200 260,175 S 420,120 500,115 S 660,95 760,80 S 900,60 980,55"
              fill="none"
              stroke="url(#road-fill)"
              strokeWidth="72"
              strokeLinecap="round"
              clipPath="url(#road-clip)"
            />

            {/* Road edge highlights (kerb lines) */}
            <path
              d="M 30,280 C 120,280 160,200 260,175 S 420,120 500,115 S 660,95 760,80 S 900,60 980,55"
              fill="none"
              stroke="rgba(56,189,248,0.12)"
              strokeWidth="74"
              strokeLinecap="round"
              clipPath="url(#road-clip)"
            />

            {/* White dashed center line — animated to "drive" */}
            <path
              className="road-dash"
              d="M 30,280 C 120,280 160,200 260,175 S 420,120 500,115 S 660,95 760,80 S 900,60 980,55"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="24 28"
            />

            {/* Creepy fog wisps — no SVG filter, plain ellipses to avoid scroll repaint */}
            <ellipse
              cx="300"
              cy="190"
              rx="80"
              ry="18"
              fill="rgba(30,180,100,0.09)"
            />
            <ellipse
              cx="560"
              cy="128"
              rx="95"
              ry="22"
              fill="rgba(80,40,140,0.10)"
            />
            <ellipse
              cx="820"
              cy="88"
              rx="70"
              ry="16"
              fill="rgba(30,180,100,0.08)"
            />

            {/* ── NODE 1 — Round 1 ──────────────────────── */}
            {/* connector stem */}
            <line
              x1="235"
              y1="175"
              x2="235"
              y2="100"
              stroke="rgba(231,76,60,0.5)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="node-stem"
            />
            {/* outer ring */}
            <circle
              cx="235"
              cy="175"
              r="18"
              fill="rgba(231,76,60,0.15)"
              stroke="rgba(231,76,60,0.7)"
              strokeWidth="1.5"
              filter="url(#node-glow)"
              className="road-node"
            />
            {/* inner dot */}
            <circle
              cx="235"
              cy="175"
              r="7"
              fill="#e74c3c"
              filter="url(#node-glow)"
            />
            {/* label box */}
            <g className="node-label-group">
              <rect
                x="170"
                y="52"
                width="130"
                height="46"
                rx="8"
                fill="rgba(14,18,30,0.92)"
                stroke="rgba(231,76,60,0.45)"
                strokeWidth="1"
              />
              <text
                x="235"
                y="72"
                textAnchor="middle"
                className="node-round-num"
                fill="rgba(231,76,60,0.9)"
                fontSize="9"
                fontFamily="Orbitron, sans-serif"
                letterSpacing="2"
                fontWeight="700"
              >
                ROUND 1
              </text>
              <text
                x="235"
                y="88"
                textAnchor="middle"
                className="node-label-text"
                fontSize="10.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
              >
                Shadow Tactics
              </text>
            </g>

            {/* ── NODE 2 — Round 2 ──────────────────────── */}
            <line
              x1="510"
              y1="115"
              x2="510"
              y2="38"
              stroke="rgba(56,189,248,0.5)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="node-stem"
              style={{ animationDelay: "0.3s" }}
            />
            <circle
              cx="510"
              cy="115"
              r="18"
              fill="rgba(56,189,248,0.15)"
              stroke="rgba(56,189,248,0.7)"
              strokeWidth="1.5"
              filter="url(#node-glow)"
              className="road-node"
              style={{ animationDelay: "0.4s" }}
            />
            <circle
              cx="510"
              cy="115"
              r="7"
              fill="#38bdf8"
              filter="url(#node-glow)"
            />
            <g className="node-label-group" style={{ animationDelay: "0.4s" }}>
              <rect
                x="445"
                y="-10"
                width="130"
                height="46"
                rx="8"
                fill="rgba(14,18,30,0.92)"
                stroke="rgba(56,189,248,0.45)"
                strokeWidth="1"
              />
              <text
                x="510"
                y="10"
                textAnchor="middle"
                fill="rgba(56,189,248,0.9)"
                fontSize="9"
                fontFamily="Orbitron, sans-serif"
                letterSpacing="2"
                fontWeight="700"
              >
                ROUND 2
              </text>
              <text
                x="510"
                y="26"
                textAnchor="middle"
                className="node-label-text"
                fontSize="10.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
              >
                Shrine of Wisdom
              </text>
            </g>

            {/* ── NODE 3 — Round 3 ──────────────────────── */}
            <line
              x1="790"
              y1="80"
              x2="790"
              y2="260"
              stroke="rgba(251,191,36,0.5)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="node-stem"
              style={{ animationDelay: "0.6s" }}
            />
            <circle
              cx="790"
              cy="80"
              r="18"
              fill="rgba(251,191,36,0.15)"
              stroke="rgba(251,191,36,0.7)"
              strokeWidth="1.5"
              filter="url(#node-glow)"
              className="road-node"
              style={{ animationDelay: "0.7s" }}
            />
            <circle
              cx="790"
              cy="80"
              r="7"
              fill="#fbbf24"
              filter="url(#node-glow)"
            />
            <g className="node-label-group" style={{ animationDelay: "0.7s" }}>
              <rect
                x="725"
                y="218"
                width="130"
                height="46"
                rx="8"
                fill="rgba(14,18,30,0.92)"
                stroke="rgba(251,191,36,0.45)"
                strokeWidth="1"
              />
              <text
                x="790"
                y="238"
                textAnchor="middle"
                fill="rgba(251,191,36,0.9)"
                fontSize="9"
                fontFamily="Orbitron, sans-serif"
                letterSpacing="2"
                fontWeight="700"
              >
                ROUND 3
              </text>
              <text
                x="790"
                y="254"
                textAnchor="middle"
                className="node-label-text"
                fontSize="10.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
              >
                Khan's Ultimatum
              </text>
            </g>

            {/* Finish flag glow */}
            <circle
              cx="975"
              cy="55"
              r="10"
              fill="rgba(251,191,36,0.2)"
              stroke="rgba(251,191,36,0.6)"
              strokeWidth="1"
              filter="url(#node-glow)"
              className="road-node finish-node"
            />
            <text
              x="975"
              y="59"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="10"
              fontFamily="sans-serif"
            >
              🏁
            </text>
          </svg>
        </div>
      </section>

      <div
        className="contest-bottom-line pointer-events-none absolute bottom-8 left-1/2 h-px w-[85%] -translate-x-1/2"
        aria-hidden="true"
      />
      <div
        className="contest-scan-line pointer-events-none absolute inset-x-0 top-0 h-24"
        aria-hidden="true"
      />

      {/* Auth modals */}
      {showLogin && <LoginModal onClose={() => navigate("/")} />}
      {showRegister && <RegisterModal onClose={() => navigate("/")} />}
    </div>
  );
}
