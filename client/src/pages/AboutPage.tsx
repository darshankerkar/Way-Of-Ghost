import { Link } from "react-router-dom";
import { GdgLogo } from "./LandingPage";

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
function IconSword() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 10.5l-9.4 9.4a2.1 2.1 0 0 1-3-3L11.5 7.5" />
      <path d="M20 4L14 10" />
      <path d="M20 4h-4v4" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .5 6.199A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.5 6.199A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ─── Round Data ─────────────────────────────────────────────────────────── */
const rounds = [
  {
    number: 1,
    name: "Shrine Of Wisdom",
    subtitle: "Debugging Compiler Sprint",
    icon: <IconBrain />,
    accentColor: "rgba(59,130,246,.18)",
    borderColor: "rgba(59,130,246,.28)",
    dotColor: "#3b82f6",
    desc: "Put your Java debugging skills to the ultimate test. Code snippets with subtle bugs are presented — identify and fix them in a live compiler faster than your opponent. This round tests your deep understanding of language semantics, runtime behaviour, and common developer pitfalls under time pressure.",
    rules: [
      "Java-based debugging questions in a live compiler",
      "Time-pressured rapid-fire bug fixing",
      "Each correct submission earns Bits currency",
      "Highest total Bits advances to Round 2",
    ],
  },
  {
    number: 2,
    name: "Shadow Tactics",
    subtitle: "1v1 Coding Duel",
    icon: <IconSword />,
    accentColor: "rgba(239,68,68,.18)",
    borderColor: "rgba(239,68,68,.28)",
    dotColor: "#ef4444",
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
    subtitle: "MVP Strategy Auction",
    icon: <IconTrophy />,
    accentColor: "rgba(234,179,8,.15)",
    borderColor: "rgba(234,179,8,.28)",
    dotColor: "#eab308",
    desc: "The grand finale. Surviving participants receive a problem statement and must bid their earned Bits to acquire resources, hints, and time extensions. Build the best working prototype within the limit — strategy, coding mastery, and resource management determine the last ghost standing.",
    rules: [
      "Bits earned in previous rounds power your bids",
      "Auction resources that help build your MVP",
      "Final score: working product + remaining Bits",
      "Grand prize goes to the last ghost standing",
    ],
  },
];

/* ─── About Page ─────────────────────────────────────────────────────────── */
export function AboutPage() {
  return (
    <div className="contest-bg min-h-screen text-white relative">
      {/* Background */}
      <div className="absolute inset-0 contest-grid-overlay pointer-events-none" aria-hidden="true" />
      <div className="creepy-fog absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="contest-radial-glow absolute -left-20 top-10 h-72 w-72 rounded-full pointer-events-none" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="contest-node contest-node-a" />
        <div className="contest-node contest-node-b" />
        <div className="contest-node contest-node-c" />
        <div className="contest-node contest-node-d" />
      </div>

      {/* Navbar */}
      <header className="relative z-20 w-full px-4 pt-4 pb-2 md:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[rgba(9,13,22,.90)] px-5 py-3">
          <Link to="/" className="gdg-nav-brand">
            <GdgLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/register" className="contest-btn-primary rounded-lg px-5 py-2 text-sm font-semibold">
              Register Now
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1200px] px-4 py-10 md:px-8">

        {/* ── Event Overview ── */}
        <section className="contest-glass-panel rounded-[28px] border border-white/10 p-8 md:p-12 mb-10">
          <div className="contest-badge inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[.2em] mb-5">
            GDG VITM Event 2026
          </div>
          <h1 className="contest-title text-3xl md:text-5xl mb-6">Way Of Ghost</h1>
          <p className="max-w-3xl text-[15px] leading-[1.85] text-gray-300">
            <strong className="text-white">Way of Ghost</strong> is a high-stakes, multi-round competitive programming
            event organised by <span className="text-ghost-gold font-semibold">Google Developer Groups VIT Mumbai</span>.
            Designed for precision coders, it pits participants against each other in a brutal three-round elimination
            bracket — starting with live 1v1 DSA duels, moving through a timed Java debugging sprint, and culminating in
            a strategic resource-auction finale. Across all rounds, participants earn <span className="text-ghost-gold font-medium">Bits</span> —
            the in-event currency that doubles as your bid power in the grand finale. Only the most adaptive and
            algorithmically sharp contestant claims the throne.
          </p>
        </section>

        {/* ── Roadmap ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold uppercase tracking-[.14em] text-ghost-gold mb-8 text-center"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Event Roadmap
          </h2>

          {/* Desktop timeline */}
          <div className="hidden md:grid grid-cols-3 gap-0 relative">
            {/* connector line */}
            <div className="absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {rounds.map((r, i) => (
              <div key={r.number} className="flex flex-col items-center text-center px-6">
                {/* dot + number */}
                <div className="relative flex flex-col items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 mb-3 relative z-10"
                    style={{ background: r.accentColor, borderColor: r.borderColor, color: r.dotColor }}
                  >
                    {r.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[.15em] text-gray-500">Round {r.number}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {r.name}
                </h3>
                <p className="text-xs text-ghost-gold">{r.subtitle}</p>
                {i < rounds.length - 1 && (
                  <div className="absolute top-8 mt-0" style={{ right: `calc(${(rounds.length - 1 - i) / rounds.length * 100}% - 8px)` }}>
                    <IconChevron />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile timeline */}
          <div className="md:hidden flex flex-col gap-0 pl-8 relative">
            <div className="absolute left-[28px] top-4 bottom-4 w-px bg-white/10" />
            {rounds.map((r) => (
              <div key={r.number} className="relative flex items-start gap-5 pb-8 last:pb-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border shrink-0 -translate-x-[22px] mt-1"
                  style={{ background: r.accentColor, borderColor: r.borderColor, color: r.dotColor }}
                >
                  {r.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-[.12em] mb-0.5">Round {r.number}</p>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>{r.name}</h3>
                  <p className="text-xs text-ghost-gold">{r.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Round Detail Cards ── */}
        <section>
          <h2 className="text-lg font-bold uppercase tracking-[.14em] text-ghost-gold mb-6 text-center"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Round Details
          </h2>
          <div className="space-y-5">
            {rounds.map((r) => (
              <div
                key={r.number}
                className="about-round-card rounded-2xl p-6 md:p-8 border"
                style={{ borderColor: r.borderColor, background: `linear-gradient(135deg, ${r.accentColor}, transparent)` }}
              >
                <div className="flex flex-wrap items-start gap-6">
                  {/* Icon badge */}
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border shrink-0"
                    style={{ background: r.accentColor, borderColor: r.borderColor, color: r.dotColor }}
                  >
                    {r.icon}
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">R{r.number}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {r.name}
                      </h3>
                      <span
                        className="text-xs font-semibold rounded-full px-3 py-1 border"
                        style={{ color: r.dotColor, background: r.accentColor, borderColor: r.borderColor }}
                      >
                        {r.subtitle}
                      </span>
                    </div>
                    <p className="text-[14px] text-gray-300 leading-[1.8] mb-5">{r.desc}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {r.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span style={{ color: r.dotColor }} className="mt-0.5 shrink-0">
                            <IconChevron />
                          </span>
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
        <div className="mt-8 contest-info-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-ghost-gold"><IconCoins /></span>
            <h3 className="text-sm font-bold text-ghost-gold uppercase tracking-[.1em]"
                style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Bits — The Currency of the Arena
            </h3>
          </div>
          <p className="text-[14px] text-gray-300 leading-[1.8]">
            Bits are the scoring and bidding currency used throughout the event. Correct submissions, quiz answers,
            and round victories earn Bits. In Round 3 (Khan's Ultimatum), your accumulated Bits power your auction bids —
            so every point earned earlier directly fuels your final shot at the throne. The global leaderboard tracks
            Bits in real time for the duration of the event.
          </p>
        </div>

        {/* ── Eligibility + Stack ── */}
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <div className="contest-info-card rounded-2xl p-6">
            <h3 className="text-xs font-bold text-ghost-gold mb-4 uppercase tracking-widest">Who Can Participate</h3>
            <ul className="space-y-2 text-[14px] text-gray-300">
              {[
                "Students of VIT Mumbai",
                "Basic DSA knowledge required",
                "Java or any language for coding rounds",
                "Registration subject to admin approval",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-ghost-gold mt-0.5 shrink-0"><IconChevron /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="contest-info-card rounded-2xl p-6">
            <h3 className="text-xs font-bold text-ghost-gold mb-4 uppercase tracking-widest">Platform Stack</h3>
            <ul className="space-y-2 text-[14px] text-gray-300">
              {[
                "React + Vite + TypeScript frontend",
                "Express + Socket.io real-time backend",
                "PostgreSQL + Prisma ORM",
                "Piston API for live code execution",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-ghost-gold mt-0.5 shrink-0"><IconChevron /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link className="contest-btn-primary rounded-xl px-8 py-3.5 font-bold text-base" to="/register">
            Register &amp; Begin Your Journey →
          </Link>
        </div>
      </main>

      <div className="contest-bottom-line pointer-events-none absolute bottom-6 left-1/2 h-px w-4/5 -translate-x-1/2" aria-hidden="true" />
    </div>
  );
}
