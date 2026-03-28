import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { register } from "../api/auth";
import { connectSocket } from "../socket/client";
import { useAuthStore } from "../store/auth.store";

/* ─── Reusable Ronin figure ─────────────────────────────────────────── */
export function RoninFigure({
  scale = 1,
  className = "",
}: {
  scale?: number;
  className?: string;
}) {
  const size = Math.round(120 * scale);
  return (
    <div
      className={`ronin-figure ronin-svg-float ${className}`}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        transformOrigin: "center center",
      }}
      aria-hidden="true"
    >
      <img
        src="/2_20260324_175834_0001.svg"
        alt=""
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          mixBlendMode: "multiply",
          filter: "drop-shadow(0 0 12px rgba(139,0,0,0.45))",
        }}
        draggable={false}
      />
    </div>
  );
}

/* ─── GDG Brand Logo ────────────────────────────────────────────────── */
export function GdgLogo({ dark = false }: { dark?: boolean }) {
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
        <span
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.01em",
            color: dark ? "#f5eaca" : "#1A1A1A",
            fontFamily: "'Cinzel', serif",
            textShadow: dark ? "0 1px 10px rgba(0,0,0,0.45)" : "none",
          }}
        >
          Google Developer Groups
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: dark ? "rgba(245,234,202,0.72)" : "rgba(26,26,26,0.55)",
          }}
        >
          VIT Mumbai
        </span>
      </div>
    </div>
  );
}

/* ─── Social Icons ──────────────────────────────────────────────────── */
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

/* ─── Video Intro ───────────────────────────────────────────────────── */
function VideoIntro({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [started, setStarted] = useState(false);

  const startExperience = () => {
    setStarted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const finish = () => {
    setFading(true);
    setTimeout(onDone, 700);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener("ended", finish);
    const t = setTimeout(finish, 60000);
    return () => {
      v.removeEventListener("ended", finish);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <video
          ref={videoRef}
          playsInline
          style={{
            width: "100%",
            height: "112%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        >
          <source src="/Video Project 6.mp4" type="video/mp4" />
        </video>
        {/* Hardware-accelerated overlay to darken video initially instead of applying a filter on the video tag, which kills framerate */}
        {!started && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
            }}
          />
        )}
      </div>

      {!started && (
        <div
          onClick={startExperience}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <p
            style={{
              color: "rgba(245,234,204,0.9)",
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(18px, 4vw, 24px)",
              letterSpacing: "0.10em",
              marginBottom: "30px",
              textAlign: "center",
              fontWeight: 600,
              textShadow: "0 4px 12px rgba(0,0,0,0.8)",
            }}
          >
            The Path Awaits… Will You Rise as a Ronin?
          </p>
          <button
            style={{
              background: "rgba(139,0,0,0.85)",
              border: "1px solid rgba(201,163,78,0.5)",
              color: "#f5eaca",
              padding: "16px 48px",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.25em",
              fontFamily: "'Cinzel', serif",
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(139,0,0,0.5)",
              transition: "transform 200ms, background 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "rgba(139,0,0,1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "rgba(139,0,0,0.85)";
            }}
          >
            WALK THE PATH
          </button>
        </div>
      )}

      {started && (
        <button
          onClick={finish}
          style={{
            position: "absolute",
            bottom: "32px",
            right: "32px",
            background: "rgba(245,234,204,0.12)",
            border: "1px solid rgba(201,163,78,0.40)",
            color: "rgba(245,234,204,0.90)",
            padding: "9px 24px",
            borderRadius: "999px",
            cursor: "pointer",
            fontSize: "13px",
            letterSpacing: "0.08em",
            fontFamily: "'Cinzel', serif",
            zIndex: 2,
            transition: "background 200ms, border-color 200ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(139,0,0,0.55)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(245,234,204,0.12)")
          }
        >
          Skip ›
        </button>
      )}
    </div>
  );
}

/* ─── Login Modal ───────────────────────────────────────────────────── */
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

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.06em",
              marginBottom: "4px",
            }}
          >
            Enter The Dojo
          </h2>
          <p
            style={{
              fontFamily: "'Yuji Boku', serif",
              fontSize: "13px",
              color: "rgba(26,26,26,0.55)",
            }}
          >
            武士の帰還 — Welcome back, Ronin.
          </p>
          {/* Red brush underline */}
          <div
            style={{
              width: "48px",
              height: "2px",
              background: "#8B0000",
              margin: "10px auto 0",
              borderRadius: "2px",
              opacity: 0.7,
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8B0000",
                marginBottom: "6px",
              }}
            >
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
            <label
              style={{
                display: "block",
                fontSize: "10px",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8B0000",
                marginBottom: "6px",
              }}
            >
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
            <p
              style={{
                fontSize: "12px",
                color: "#8B0000",
                background: "rgba(139,0,0,0.06)",
                borderRadius: "8px",
                padding: "8px 12px",
                border: "1px solid rgba(139,0,0,0.18)",
              }}
            >
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

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(26,26,26,0.50)",
            marginTop: "18px",
          }}
        >
          No account?{" "}
          <button
            onClick={() => navigate("/register")}
            style={{
              color: "#8B0000",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Create Warrior ID
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── Register Modal ────────────────────────────────────────────────── */
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

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.06em",
              marginBottom: "4px",
            }}
          >
            Create Ronin ID
          </h2>
          <p
            style={{
              fontFamily: "'Yuji Boku', serif",
              fontSize: "13px",
              color: "rgba(26,26,26,0.50)",
            }}
          >
            侍の誓い — Join the Ronin arena.
          </p>
          <div
            style={{
              width: "48px",
              height: "2px",
              background: "#8B0000",
              margin: "8px auto 0",
              borderRadius: "2px",
              opacity: 0.7,
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {(["Full Name", "College", "Email", "Password"] as const).map(
            (label) => {
              const fieldMap: Record<
                string,
                {
                  type: string;
                  placeholder: string;
                  value: string;
                  onChange: (v: string) => void;
                  autoComplete?: string;
                }
              > = {
                "Full Name": {
                  type: "text",
                  placeholder: "Enter warrior name",
                  value: name,
                  onChange: setName,
                },
                College: {
                  type: "text",
                  placeholder: "Your college",
                  value: college,
                  onChange: setCollege,
                },
                Email: {
                  type: "email",
                  placeholder: "your@email.com",
                  value: email,
                  onChange: setEmail,
                  autoComplete: "email",
                },
                Password: {
                  type: "password",
                  placeholder: "Min 6 characters",
                  value: password,
                  onChange: setPassword,
                  autoComplete: "new-password",
                },
              };
              const f = fieldMap[label];
              return (
                <div key={label}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#8B0000",
                      marginBottom: "5px",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    className="auth-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    required
                    autoComplete={f.autoComplete}
                  />
                </div>
              );
            },
          )}

          {message && (
            <p
              style={{
                fontSize: "12px",
                color: "#4a7c59",
                background: "rgba(74,124,89,0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
                border: "1px solid rgba(74,124,89,0.20)",
              }}
            >
              {message}
            </p>
          )}
          {error && (
            <p
              style={{
                fontSize: "12px",
                color: "#8B0000",
                background: "rgba(139,0,0,0.06)",
                borderRadius: "8px",
                padding: "8px 12px",
                border: "1px solid rgba(139,0,0,0.18)",
              }}
            >
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

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(26,26,26,0.50)",
            marginTop: "14px",
          }}
        >
          Already a warrior?{" "}
          <button
            onClick={() => navigate("/login")}
            style={{
              color: "#8B0000",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── LANDING PAGE ──────────────────────────────────────────────────── */
export function LandingPage({ onVideoIntroDone }: { onVideoIntroDone?: () => void } = {}) {
  const [videoDone, setVideoDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const showLogin = location.pathname === "/login";
  const showRegister = location.pathname === "/register";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
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

  return (
    <div
      className="contest-bg relative min-h-screen"
      style={{ color: "#1A1A1A" }}
    >
      {/* Video intro */}
      {!videoDone && <VideoIntro onDone={() => { setVideoDone(true); onVideoIntroDone?.(); }} />}

      {/* Background atmosphere */}
      <div
        className="contest-grid-overlay absolute inset-0"
        aria-hidden="true"
      />
      <div className="creepy-fog absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="contest-node contest-node-a" />
        <div className="contest-node contest-node-b" />
        <div className="contest-node contest-node-c" />
        <div className="contest-node contest-node-d" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="relative z-20 w-full px-4 pt-4 pb-2 md:px-8">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 landing-navbar px-5 py-3">
          <Link to="/" className="gdg-nav-brand">
            <GdgLogo />
          </Link>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/about"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#8B0000",
                border: "1px solid rgba(139,0,0,0.22)",
                backgroundColor: "rgba(139,0,0,0.05)",
                borderRadius: "999px",
                padding: "6px 16px",
                textDecoration: "none",
                transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139,0,0,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139,0,0,0.05)";
              }}
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
            <span
              className="block w-5 h-0.5 rounded"
              style={{ background: "#1A1A1A" }}
            />
            <span
              className="block w-5 h-0.5 rounded"
              style={{ background: "#1A1A1A" }}
            />
            <span
              className="block w-5 h-0.5 rounded"
              style={{ background: "#1A1A1A" }}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "menu-open" : "menu-closed"}`}>
        <button
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            color: "rgba(26,26,26,0.50)",
            fontSize: "22px",
            background: "transparent",
            border: 0,
            cursor: "pointer",
          }}
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
            Walk the Path
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

      {/* ── SECTION 1: HERO ── */}
      <section className="relative z-10 flex items-center justify-center px-4 py-8 mt-2 md:mt-4">
        <div className="hero-glass-card flex flex-col items-center text-center max-w-[640px] w-full pb-8">
          {/* Event badge */}
          <div className="contest-badge inline-flex items-center gap-2 rounded-full px-5 py-1.5 mb-5">
            ⚔ GDG VITM Event 2026 ⚔
          </div>

          {/* Main title — Cinzel, ink black */}
          <h1
            className="contest-title leading-[1.08] mb-2"
            style={{
              fontSize: "clamp(34px, 6vw, 64px)",
              transform: "rotate(-0.5deg)",
            }}
          >
            Last Standing <span className="ronin-red-word">Ronin</span>
          </h1>

          {/* Japanese subtitle — Yuji Boku */}
          <p
            className="jp-subtitle mb-5"
            style={{
              fontSize: "clamp(15px, 2vw, 20px)",
              transform: "rotate(-0.3deg)",
            }}
          >
            最後の浪人
          </p>

          {/* Brush stroke underline */}
          <div
            style={{
              width: "120px",
              height: "3px",
              background: "#8B0000",
              borderRadius: "2px",
              opacity: 0.65,
              marginBottom: "22px",
            }}
          />

          {/* Tagline */}
          <p className="hero-subtitle mb-5">
            <span>Code</span>
            <span className="hero-sep">·</span>
            <span>Duel</span>
            <span className="hero-sep">·</span>
            <span>Survive</span>
          </p>

          {/* Cinematic description */}
          <div
            className="hero-description"
            style={{ textAlign: "center", marginBottom: "20px" }}
          >
            <p style={{ fontWeight: 500, margin: 0 }}>
              In the arena of code, where logic is your blade and time your enemy… GDG VIT Mumbai summons you. Three trials await each deadlier than the last. Many will fall. Few will endure. Only one path remains -
              <br />
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "#8B0000", letterSpacing: "0.05em" }}>
                Become the Last Standing Ronin.
              </span>
            </p>
          </div>

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
              Enter the Dojo
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: ROADMAP ── */}
      <section className="roadmap-section relative px-4 md:px-8">
        <div className="scroll-wrapper">
          <div className="historic-japanese-border">
            {/* Corner ornaments */}
            <div className="corner top-left" aria-hidden="true" />
            <div className="corner top-right" aria-hidden="true" />
            <div className="corner bottom-left" aria-hidden="true" />
            <div className="corner bottom-right" aria-hidden="true" />

            <img
              src="/path_final.png"
              alt="Ronin Path"
              className="w-full h-auto block relative z-0"
            />
          </div>

          {/* Dragon Sketches (Top-Left & Bottom-Right) */}
          <div className="dragon-corner dragon-top-left">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#2b1a10"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 8px rgba(139,0,0,0.1))" }}
            >
              <path
                d="M40 160C30 140 30 110 50 90C70 70 120 70 140 50M140 50C160 30 180 40 170 80C160 120 120 140 110 160"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
              <path
                d="M140 50C130 50 120 40 120 20M140 50C150 40 160 50 170 50"
                strokeLinecap="round"
              />
              <circle cx="150" cy="40" r="2" fill="#2b1a10" />
              {/* Using a highly stylized minimal vector to represent brush strokes of a dragon */}
              <path
                d="M50 90C60 100 80 100 90 90C100 80 100 60 90 50"
                strokeLinecap="round"
              />
              <path
                d="M110 160C120 170 140 170 150 160C160 150 170 130 150 120"
                strokeLinecap="round"
              />
              <path
                d="M60 80L50 60M75 70L80 50"
                strokeLinecap="round"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <path
                d="M150 140L170 150M130 155L140 175"
                strokeLinecap="round"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </svg>
          </div>
          <div className="dragon-corner dragon-bottom-right">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#2b1a10"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 8px rgba(139,0,0,0.1))" }}
            >
              <path
                d="M160 40C140 30 110 30 90 50C70 70 70 120 50 140M50 140C30 160 40 180 80 170C120 160 140 120 160 110"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
              <path
                d="M50 140C50 130 40 120 20 120M50 140C40 150 50 160 50 170"
                strokeLinecap="round"
              />
              <circle cx="40" cy="150" r="2" fill="#2b1a10" />
              <path
                d="M90 50C100 60 100 80 90 90C80 100 60 100 50 90"
                strokeLinecap="round"
              />
              <path
                d="M160 110C170 120 170 140 160 150C150 160 130 170 120 150"
                strokeLinecap="round"
              />
              <path
                d="M80 60L60 50M70 75L50 80"
                strokeLinecap="round"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <path
                d="M140 150L150 170M155 130L175 140"
                strokeLinecap="round"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Bottom accent line */}
      <div
        className="contest-bottom-line pointer-events-none absolute bottom-8 left-1/2 h-px w-[85%] -translate-x-1/2"
        aria-hidden="true"
      />

      {/* Auth modals */}
      {showLogin && <LoginModal onClose={() => navigate("/")} />}
      {showRegister && <RegisterModal onClose={() => navigate("/")} />}
    </div>
  );
}
