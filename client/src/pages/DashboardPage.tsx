import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuthStore } from "../store/auth.store";
import { getSocket } from "../socket/client";
import type { EventState, LeaderboardEntry } from "../types";
import { JapaneseBorder } from "../components/JapaneseBorder";

/* ─── Small helpers ───────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "rgba(139,0,0,0.55)",
        marginBottom: "4px",
      }}
    >
      {children}
    </p>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const myEntry = leaderboard.find((e) => e.id === user?.id);
  const currentBits = myEntry?.bits ?? user?.bits ?? 0;
  const isRound2Locked = currentBits < 100;
  const isRound3Locked = currentBits < 200;

  const navState = location.state as {
    r2Locked?: boolean;
    r3Locked?: boolean;
  } | null;
  const r2Locked = navState?.r2Locked === true;
  const r3Locked = navState?.r3Locked === true;

  const enterRound = async (roundNumber: number) => {
    if (roundNumber === 2 && isRound2Locked) {
      navigate("/dashboard", { replace: true, state: { r2Locked: true } });
      return;
    }
    if (roundNumber === 3 && isRound3Locked) {
      navigate("/dashboard", { replace: true, state: { r3Locked: true } });
      return;
    }
    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (typeof el.requestFullscreen === "function")
        await el.requestFullscreen();
      else if (typeof el.webkitRequestFullscreen === "function")
        await el.webkitRequestFullscreen();
    } catch {
      /* browser may block */
    }
    navigate(`/round/${roundNumber}`);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [{ data: event }, { data: board }] = await Promise.all([
          http.get<EventState>("/round/event-state"),
          http.get<LeaderboardEntry[]>("/round/leaderboard/global"),
        ]);
        setEventState(event);
        setLeaderboard(board);
      } catch {
        /* Keep current UI on transient errors */
      }
    };
    void loadDashboardData();

    const socket = getSocket();
    if (!socket) return;
    const refreshOnRoundChange = () => {
      void loadDashboardData();
    };
    socket.on("round:started", refreshOnRoundChange);
    socket.on("round:reset", refreshOnRoundChange);
    return () => {
      socket.off("round:started", refreshOnRoundChange);
      socket.off("round:reset", refreshOnRoundChange);
    };
  }, []);

  const roundNames = [
    "",
    "Shrine Of Wisdom",
    "Shadow Tactics",
    "Khan's Ultimatum",
  ];
  const roundJp = ["", "知恵の聖地", "影の戦術", "汗の最後通牒"];
  const roundDescs = [
    "",
    "1v1 Debugging Compiler — Find and fix bugs in code faster than your opponent",
    "1v1 Coding Duel — Solve algorithmic problems head-to-head",
    "MVP Building — Build a working prototype from a problem statement",
  ];

  const cardStyle = {
    position: "relative" as const,
    background: "rgba(255, 250, 240, 0.8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(139,0,0,0.2)",
    borderRadius: "0px",
    boxShadow:
      "0 8px 32px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(201,163,78,0.3)",
  };

  return (
    <div className="app-shell min-h-screen" style={{ color: "#1A1A1A" }}>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {/* ── Header ── */}
        <div
          className="mb-6 px-6 py-5"
          style={cardStyle}
        >
          <JapaneseBorder />
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
            <div>
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(24px,4vw,36px)",
                fontWeight: 800,
                color: "#1A1A1A",
                letterSpacing: "0.08em",
                marginBottom: "8px",
                textShadow: "0 0 15px rgba(139,0,0,0.2)",
              }}
            >
              Warrior Dashboard
            </h1>
            <p
              style={{
                fontFamily: "'Yuji Boku', serif",
                fontSize: "16px",
                color: "rgba(26,26,26,0.85)",
              }}
            >
              Welcome back,{" "}
              <span
                style={{ color: "#8B0000", fontWeight: 700, fontSize: "18px" }}
              >
                {user?.name ?? "participant"}
              </span>
              &nbsp;— 侍の帰還
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(139,0,0,0.22)",
                background: "rgba(139,0,0,0.06)",
                padding: "4px 14px",
                fontSize: "11px",
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#8B0000",
              }}
            >
              Last Standing Ronin
            </div>
          </div>
          </div>
        </div>

        {/* ── User stats ── */}
        {myEntry && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Your Bits",
                value: myEntry.bits,
                valueColor: "#C9A34E",
              },
              {
                label: "Rank",
                value: `#${leaderboard.findIndex((e) => e.id === user?.id) + 1}`,
                valueColor: "#8B0000",
              },
              {
                label: "Status",
                value: myEntry.eliminated ? "Eliminated" : "Active",
                valueColor: myEntry.eliminated ? "#8B0000" : "#4a7c59",
              },
            ].map(({ label, value, valueColor }) => (
              <div
                key={label}
                className="p-4 text-center"
                style={{ ...cardStyle, borderLeft: "4px solid #8B0000" }}
              >
                <JapaneseBorder />
                <div style={{ position: "relative", zIndex: 10 }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: "rgba(26,26,26,0.70)",
                    marginBottom: "8px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    fontFamily: "'Cinzel', serif",
                    color: valueColor,
                    textShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  }}
                >
                  {value}
                </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Lock warnings ── */}
        {r3Locked && (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(139,0,0,0.28)",
              background: "rgba(139,0,0,0.06)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#8B0000",
              textAlign: "center",
              marginBottom: "16px",
              fontFamily: "'Noto Serif JP', serif",
            }}
          >
            🔒 You need at least <strong>200 Bits</strong> to access Khan's
            Ultimatum (Round 3). Keep earning!
          </div>
        )}
        {r2Locked && (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(139,0,0,0.28)",
              background: "rgba(139,0,0,0.06)",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#8B0000",
              textAlign: "center",
              marginBottom: "16px",
              fontFamily: "'Noto Serif JP', serif",
            }}
          >
            🔒 You need at least <strong>100 Bits</strong> to access Shadow
            Tactics (Round 2).
          </div>
        )}

        {/* ── Active Round Banner ── */}
        {eventState &&
          eventState.roundStatus === "LIVE" &&
          eventState.currentRound > 0 && (
            <div
              className="p-5 mb-6"
              style={{
                ...cardStyle,
                border: "1px solid rgba(139,0,0,0.35)",
                background:
                  "linear-gradient(135deg, rgba(255,252,243,0.98) 0%, rgba(250,238,218,0.94) 100%)",
                position: "relative",
              }}
            >
              <JapaneseBorder />
              <div style={{ position: "relative", zIndex: 10 }}>
              {/* top accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "8%",
                  right: "8%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(139,0,0,0.55), transparent)",
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#8B0000",
                      marginBottom: "4px",
                    }}
                  >
                    ⚔ Round {eventState.currentRound} is LIVE
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1A1A1A",
                      marginBottom: "2px",
                    }}
                  >
                    {roundNames[eventState.currentRound]}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Yuji Boku', serif",
                      fontSize: "13px",
                      color: "rgba(139,0,0,0.60)",
                      marginBottom: "6px",
                    }}
                  >
                    {roundJp[eventState.currentRound]}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(26,26,26,0.55)",
                      fontFamily: "'Noto Serif JP', serif",
                    }}
                  >
                    {roundDescs[eventState.currentRound]}
                  </p>
                </div>
                <button
                  onClick={() => void enterRound(eventState.currentRound)}
                  disabled={
                    (eventState.currentRound === 2 && isRound2Locked) ||
                    (eventState.currentRound === 3 && isRound3Locked)
                  }
                  className="contest-btn-primary rounded-xl px-7 py-3 text-sm font-bold disabled:opacity-50"
                >
                  Enter Round →
                </button>
              </div>
              </div>
            </div>
          )}

        {/* ── No Round Active ── */}
        {(!eventState || eventState.roundStatus !== "LIVE") && (
          <div className="p-6 text-center mb-6" style={cardStyle}>
            <JapaneseBorder />
            <div style={{ position: "relative", zIndex: 10 }}>
            <div
              className="flex justify-center mb-3"
              style={{ height: "60px" }}
            >
              <img
                src="/logo_app.png"
                alt="Last Standing Ronin logo"
                width={120}
                height={58}
                style={{
                  width: "120px",
                  height: "58px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.18))",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "13px",
                color: "rgba(26,26,26,0.50)",
                marginBottom: "4px",
              }}
            >
              No round is currently active.
            </p>
            <p
              style={{
                fontFamily: "'Yuji Boku', serif",
                fontSize: "13px",
                color: "rgba(26,26,26,0.38)",
              }}
            >
              待機中 — Wait for the admin to start a round.
            </p>
            </div>
          </div>
        )}

        {/* ── Round Cards ── */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map((r) => {
            const isLive =
              eventState?.currentRound === r &&
              eventState.roundStatus === "LIVE";
            const isLocked =
              (r === 2 && isRound2Locked) || (r === 3 && isRound3Locked);
            return (
              <button
                key={r}
                disabled={isLocked}
                onClick={() => void enterRound(r)}
                className="relative overflow-hidden group"
                style={{
                  ...cardStyle,
                  background: isLive
                    ? "linear-gradient(135deg, rgba(255,250,230,0.9) 0%, rgba(250,235,210,0.95) 100%)"
                    : "rgba(255, 250, 240, 0.8)",
                  padding: "24px",
                  textAlign: "left",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.6 : 1,
                  transition: "all 300ms cubic-bezier(0.25, 1, 0.5, 1)",
                  border: isLive
                    ? "2px solid #8B0000"
                    : "1px solid rgba(139,0,0,0.3)",
                  boxShadow: isLive
                    ? "0 10px 40px rgba(139,0,0,0.2), inset 0 0 15px rgba(201,163,78,0.4)"
                    : cardStyle.boxShadow,
                  transform: "translateZ(0)",
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-6px) scale(1.02)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 15px 40px rgba(139,0,0,0.25), inset 0 0 0 1px rgba(201,163,78,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#8B0000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0) scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      isLive
                        ? "0 10px 40px rgba(139,0,0,0.2), inset 0 0 15px rgba(201,163,78,0.4)"
                        : (cardStyle.boxShadow as string);
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      isLive ? "#8B0000" : "rgba(139,0,0,0.3)";
                  }
                }}
              >
                <JapaneseBorder />
                {/* Dynamic hover overlay effect */}
                {!isLocked && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(139,0,0,0.05) 0%, transparent 60%)",
                    }}
                  />
                )}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span
                    style={{
                      display: "inline-flex",
                      height: "34px",
                      minWidth: "34px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      border: "1px solid #8B0000",
                      padding: "0 10px",
                      fontSize: "12px",
                      fontWeight: 800,
                      fontFamily: "'Cinzel', serif",
                      letterSpacing: "0.10em",
                      color: "#f5e6c8",
                      background: "#5c0000",
                      boxShadow: "0 2px 8px rgba(139,0,0,0.4)",
                    }}
                  >
                    R{r}
                  </span>
                  {isLive && (
                    <span
                      className="animate-pulse"
                      style={{
                        fontSize: "12px",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        color: "#8B0000",
                        textShadow: "0 0 10px rgba(139,0,0,0.3)",
                      }}
                    >
                      ● LIVE
                    </span>
                  )}
                  {isLocked && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 800,
                        color: "rgba(26,26,26,0.6)",
                      }}
                    >
                      {r === 2 ? "🔒 100 Bits" : "🔒 200 Bits"}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: "rgba(26,26,26,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  Round {r}
                </p>
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#1A1A1A",
                    marginBottom: "4px",
                  }}
                >
                  {roundNames[r]}
                </p>
                <p
                  style={{
                    fontFamily: "'Yuji Boku', serif",
                    fontSize: "14px",
                    color: "#8B0000",
                    marginBottom: "10px",
                  }}
                >
                  {roundJp[r]}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(26,26,26,0.85)",
                    lineHeight: 1.6,
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {roundDescs[r]}
                </p>
                {!isLocked && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(139,0,0,0.15)",
                      textAlign: "right",
                    }}
                  >
                    <span
                      className="contest-btn-primary"
                      style={{
                        borderRadius: "8px",
                        padding: "6px 16px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      Enter Round →
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Leaderboard ── */}
        <section style={{ ...cardStyle }}>
          <JapaneseBorder />
          <div style={{ position: "relative", zIndex: 10 }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(201,163,78,0.15)",
            }}
          >
            <SectionLabel>⚔ Leaderboard</SectionLabel>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              Warriors Ranking
            </h2>
          </div>
          <div className="divide-y divide-[rgba(201,163,78,0.15)]">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 20px",
                  fontSize: "13px",
                  background:
                    entry.id === user?.id
                      ? "rgba(139,0,0,0.04)"
                      : "transparent",
                  borderBottom: "1px solid rgba(201,163,78,0.10)",
                  transition: "background 150ms",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "'Cinzel', serif",
                      fontSize: i === 0 ? "16px" : "13px",
                      width: "24px",
                      flexShrink: 0,
                      color:
                        i === 0
                          ? "#C9A34E"
                          : i === 1
                            ? "rgba(26,26,26,0.60)"
                            : i === 2
                              ? "#8B0000"
                              : "rgba(26,26,26,0.35)",
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      color: entry.eliminated
                        ? "rgba(26,26,26,0.35)"
                        : "#1A1A1A",
                      textDecoration: entry.eliminated
                        ? "line-through"
                        : "none",
                      fontFamily: "'Noto Serif JP', serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.name}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(26,26,26,0.35)",
                      display: "none",
                    }}
                    className="sm:block"
                  >
                    {entry.college}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    color: "#C9A34E",
                    flexShrink: 0,
                  }}
                >
                  {entry.bits}
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p
                style={{
                  padding: "24px 20px",
                  fontSize: "13px",
                  color: "rgba(26,26,26,0.40)",
                  textAlign: "center",
                  fontFamily: "'Yuji Boku', serif",
                }}
              >
                No warriors yet — the arena awaits.
              </p>
            )}
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}
