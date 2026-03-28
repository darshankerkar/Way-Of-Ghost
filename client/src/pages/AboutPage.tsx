import { Link } from "react-router-dom";
import { GdgLogo } from "./LandingPage";
import { JapaneseBorder } from "../components/JapaneseBorder";

/* ─── Icons ──────────────────────────────────────────────────────────── */
function IconSword() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 10.5l-9.4 9.4a2.1 2.1 0 0 1-3-3L11.5 7.5" />
      <path d="M20 4L14 10" />
      <path d="M20 4h-4v4" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .5 6.199A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.5 6.199A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IconCoins() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ─── Round Data ─────────────────────────────────────────────────────── */
const rounds = [
  {
    number: 1,
    name: "Shrine Of Wisdom",
    jpName: "知恵の聖地",
    subtitle: "Debugging Compiler Sprint",
    icon: <IconBrain />,
    accent: "#8B0000",
    accentBg: "rgba(139,0,0,0.07)",
    accentBorder: "rgba(139,0,0,0.22)",
    desc: "Put your debugging skills to the ultimate test. Code snippets with subtle bugs are presented — identify and fix them in a live compiler faster than your opponent. This round tests your deep understanding of language semantics, runtime behaviour, and common developer pitfalls under time pressure.",
    rules: [
      "Debugging questions in a live compiler",
      "Time-pressured rapid-fire bug fixing",
      "Each correct submission earns Bits currency",
      "Highest total Bits advances to Round 2",
    ],
  },
  {
    number: 2,
    name: "Shadow Tactics",
    jpName: "影の戦術",
    subtitle: "1v1 Coding Duel",
    icon: <IconSword />,
    accent: "#8B0000",
    accentBg: "rgba(139,0,0,0.07)",
    accentBorder: "rgba(139,0,0,0.22)",
    desc: "Face your opponent head-to-head in a live coding duel. Both contestants receive the same algorithmic problem — solve it faster and more accurately to advance. Topics span greedy algorithms, dynamic programming, graphs, and data structures. Every second counts in this brutal elimination round.",
    rules: [
      "Both opponents get the same DSA problem simultaneously",
      "First correct submission wins the duel",
      "Eliminated contestants exit the bracket",
      "Round continues until a semifinal pool remains",
    ],
  },
  {
    number: 3,
    name: "Khan's Ultimatum",
    jpName: "汗の最後通牒",
    subtitle: "MVP Strategy Auction",
    icon: <IconTrophy />,
    accent: "#8B0000",
    accentBg: "rgba(139,0,0,0.07)",
    accentBorder: "rgba(139,0,0,0.22)",
    desc: "The grand finale. Surviving participants receive a problem statement and must bid their earned Bits to acquire resources, hints, and time extensions. Build the best working prototype within the limit — strategy, coding mastery, and resource management determine the last ghost standing.",
    rules: [
      "Bits earned in previous rounds power your bids",
      "Auction resources that help build your MVP",
      "Final score: working product + remaining Bits",
      "Grand prize goes to the last ghost standing",
    ],
  },
];

/* ─── About Page ─────────────────────────────────────────────────────── */
export function AboutPage() {
  return (
    <div className="contest-bg min-h-screen relative" style={{ color: "#1A1A1A" }}>
      {/* Background */}
      <div className="absolute inset-0 contest-grid-overlay pointer-events-none" aria-hidden="true" />
      <div className="creepy-fog absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="contest-node contest-node-a" />
        <div className="contest-node contest-node-b" />
        <div className="contest-node contest-node-c" />
        <div className="contest-node contest-node-d" />
      </div>

      {/* Navbar */}
      <header className="relative z-20 w-full px-4 pt-4 pb-2 md:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 landing-navbar px-5 py-3">
          <Link to="/" className="gdg-nav-brand">
            <GdgLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="contest-btn-primary rounded-lg px-5 py-2 text-sm font-semibold"
            >
              Register Now
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1200px] px-4 py-10 md:px-8">

        {/* ── Event Overview ── */}
        <section
          className="rounded-[28px] p-8 md:p-12"
          style={{
            background: "linear-gradient(160deg, rgba(255,252,243,0.94) 0%, rgba(248,238,215,0.90) 100%)",
            border: "1px solid rgba(201,163,78,0.25)",
            boxShadow: "0 8px 32px rgba(26,26,26,0.08), inset 0 1px 0 rgba(255,255,255,0.80)",
            position: "relative", overflow: "hidden", maxWidth: "1400px", margin: "0 auto 80px auto",
          }}
        >
          {/* Top accent line */}
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(139,0,0,0.40), transparent)" }} />

          <div style={{ position: "relative", zIndex: 10 }}>
            <div style={{ maxWidth: "1040px" }}>
              <div className="contest-badge inline-flex items-center gap-2 rounded-full px-4 py-1 mb-4">
                ⚔ GDG VITM Event 2026 ⚔
              </div>

              <h1
                className="contest-title mb-1"
                style={{ fontSize: "clamp(28px, 4.3vw, 50px)", transform: "rotate(-0.4deg)" }}
              >
                Last Standing{" "}
                <span style={{ color: "#8B0000", textShadow: "0 0 12px rgba(139,0,0,0.30)" }}>Ronin</span>
              </h1>
              <p style={{ fontFamily: "'Yuji Boku', serif", fontSize: "17px", color: "rgba(26,26,26,0.85)", marginBottom: "14px", transform: "rotate(-0.3deg)" }}>
                最後の浪人
              </p>
              <div style={{ width: "80px", height: "3px", background: "#8B0000", borderRadius: "2px", opacity: 0.60, marginBottom: "16px" }} />

              <p style={{ fontSize: "15px", lineHeight: 1.78, color: "#1A1A1A", fontFamily: "'Noto Serif JP', serif", margin: 0 }}>
                <strong style={{ color: "#1A1A1A" }}>Last Standing Ronin</strong> is a high-stakes coding trial forged by{" "}
                <strong style={{ color: "#1A1A1A" }}>GDG VIT Mumbai</strong>, where warriors of logic walk the path of the Ronin.
                Participants must endure three relentless trials—beginning with precise debugging, advancing into intense 1v1 DSA duels,
                and culminating in a strategic final battle of wit and resource. With each victory, they earn{" "}
                <span style={{ color: "#b08d43", fontWeight: 600 }}>Bits</span>, the currency of survival, shaping their fate in the
                final stage. Many will step onto the path, but only those who adapt, endure, and master their blade of logic will rise
                as the Last Standing Ronin.
              </p>
            </div>
          </div>
        </section>


        <section className="mb-10">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", letterSpacing: "0.20em", textTransform: "uppercase", color: "#5f0000", marginBottom: "6px", fontWeight: 800 }}>
              Event Roadmap
            </h2>
            <p style={{ fontFamily: "'Yuji Boku', serif", fontSize: "13px", color: "rgba(26,26,26,0.96)", fontWeight: 700 }}>
              三つの試煉
            </p>
            <div style={{ width: "60px", height: "2px", background: "#6f0000", borderRadius: "2px", opacity: 0.8, margin: "10px auto 0" }} />
          </div>

          {/* Desktop timeline */}
          <div className="hidden md:grid grid-cols-3 gap-0 relative">
            <div style={{ position: "absolute", top: "32px", left: "16.67%", right: "16.67%", height: "1px", background: "linear-gradient(90deg, rgba(95,0,0,0.34), rgba(176,141,67,0.44), rgba(95,0,0,0.34))" }} />
            {rounds.map((r) => (
              <div key={r.number} className="flex flex-col items-center text-center px-6">
                <div className="relative flex flex-col items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 mb-3 relative z-10"
                    style={{ background: r.accentBg, borderColor: r.accentBorder, color: r.accent, boxShadow: "0 4px 18px rgba(95,0,0,0.10)" }}
                  >
                    {r.icon}
                  </div>
                  <span style={{ fontSize: "10px", fontFamily: "'Cinzel', serif", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(26,26,26,0.92)" }}>
                    Round {r.number}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", fontWeight: 800, color: "#111111", marginBottom: "3px" }}>
                  {r.name}
                </h3>
                <p style={{ fontFamily: "'Yuji Boku', serif", fontSize: "13px", color: r.accent, marginBottom: "2px", fontWeight: 700 }}>{r.jpName}</p>
                <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.96)", fontWeight: 600 }}>{r.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Mobile timeline */}
          <div className="md:hidden flex flex-col gap-0 pl-8 relative">
            <div style={{ position: "absolute", left: "28px", top: "16px", bottom: "16px", width: "1px", background: "rgba(95,0,0,0.30)" }} />
            {rounds.map((r) => (
              <div key={r.number} className="relative flex items-start gap-5 pb-8 last:pb-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border shrink-0 -translate-x-[22px] mt-1"
                  style={{ background: r.accentBg, borderColor: r.accentBorder, color: r.accent }}
                >
                  {r.icon}
                </div>
                <div>
                  <p style={{ fontSize: "10px", fontFamily: "'Cinzel', serif", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(26,26,26,0.92)", marginBottom: "2px" }}>
                    Round {r.number}
                  </p>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 800, color: "#111111" }}>{r.name}</h3>
                  <p style={{ fontSize: "12px", color: r.accent, fontWeight: 700 }}>{r.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Round Detail Cards ── */}
        <section>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", letterSpacing: "0.20em", textTransform: "uppercase", color: "#8B0000" }}>
              Round Details
            </h2>
          </div>
          <div className="space-y-5">
            {rounds.map((r) => (
              <div
                key={r.number}
                className="about-round-card p-6 md:p-8"
                style={{ borderColor: r.accentBorder, position: "relative", borderRadius: "0px" }}
              >
                <JapaneseBorder />
                <div className="flex flex-wrap items-start gap-6" style={{ position: "relative", zIndex: 10 }}>
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border shrink-0"
                    style={{ background: r.accentBg, borderColor: r.accentBorder, color: r.accent }}
                  >
                    {r.icon}
                    <span style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", fontWeight: 800, letterSpacing: "0.1em", marginTop: "3px", opacity: 0.85 }}>R{r.number}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 800, color: "#1A1A1A" }}>
                        {r.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "10px", fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em",
                          borderRadius: "999px", padding: "3px 10px", border: `1px solid ${r.accentBorder}`,
                          color: r.accent, background: r.accentBg,
                        }}
                      >
                        {r.subtitle}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Yuji Boku', serif", fontSize: "13px", color: r.accent, marginBottom: "12px", fontWeight: 600 }}>{r.jpName}</p>
                    <p style={{ fontSize: "15px", color: "#1d1d1d", lineHeight: 1.80, marginBottom: "18px", fontFamily: "'Noto Serif JP', serif" }}>
                      {r.desc}
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {r.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ fontSize: "13px", color: "#2b2b2b" }}>
                          <span style={{ color: r.accent, marginTop: "1px", flexShrink: 0 }}><IconChevron /></span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bits Economy ── */}
        <div
          className="mt-8 p-6 md:p-8"
          style={{
            background: "linear-gradient(160deg, rgba(250,243,228,.92), rgba(240,228,200,.88))",
            border: "1px solid rgba(201,163,78,0.22)",
            position: "relative",
            borderRadius: "0px",
          }}
        >
          <JapaneseBorder />
          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ color: "#b08d43" }}><IconCoins /></span>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 800, color: "#b08d43", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Bits — The Currency of the Arena
              </h3>
            </div>
            <p style={{ fontSize: "15px", color: "#1d1d1d", lineHeight: 1.80, fontFamily: "'Noto Serif JP', serif" }}>
              Bits are the scoring and bidding currency used throughout the event.
              Correct submissions, quiz answers, and round victories earn Bits. In
              Round 3 (Khan's Ultimatum), your accumulated Bits power your auction
              bids — so every point earned earlier directly fuels your final shot
              at the throne. The global leaderboard tracks Bits in real time.
            </p>
          </div>
        </div>

        {/* ── Eligibility + Stack ── */}
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          {[
            {
              title: "Who Can Participate",
              items: [
                "Students of VIT Mumbai",
                "Basic DSA knowledge required",
                "Java or any language for coding rounds",
                "Registration subject to admin approval",
              ],
            },
            {
              title: "Platform Stack",
              items: [
                "React + Vite + TypeScript frontend",
                "Express + Socket.io real-time backend",
                "PostgreSQL + Prisma ORM",
                "Piston API for live code execution",
              ],
            },
          ].map((block) => (
            <div
              key={block.title}
              className="p-6"
              style={{
                background: "linear-gradient(160deg, rgba(250,243,228,.92), rgba(240,228,200,.88))",
                border: "1px solid rgba(201,163,78,0.20)",
                position: "relative",
                borderRadius: "0px",
              }}
            >
              <JapaneseBorder />
              <div style={{ position: "relative", zIndex: 10 }}>
                <h3 style={{ fontSize: "12px", fontFamily: "'Cinzel', serif", fontWeight: 800, color: "#8B0000", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "16px" }}>
                  {block.title}
                </h3>
                <ul className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2" style={{ fontSize: "14px", color: "#1d1d1d", fontFamily: "'Noto Serif JP', serif" }}>
                      <span style={{ color: "#b08d43", marginTop: "2px", flexShrink: 0 }}><IconChevron /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            className="contest-btn-primary rounded-xl px-8 py-3.5 font-bold text-base"
            to="/register"
          >
            Register &amp; Begin Your Journey →
          </Link>
        </div>
      </main>

      <div className="contest-bottom-line pointer-events-none absolute bottom-6 left-1/2 h-px w-4/5 -translate-x-1/2" aria-hidden="true" />
    </div>
  );
}

