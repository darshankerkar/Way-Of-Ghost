import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { useAuthStore } from "../store/auth.store";
import { getSocket } from "../socket/client";
import type { EventState, LeaderboardEntry } from "../types";
import { GhostFigure } from "./LandingPage";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [eventState, setEventState]   = useState<EventState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    http.get<EventState>("/round/event-state").then(({ data }) => setEventState(data)).catch(() => null);
    http.get<LeaderboardEntry[]>("/round/leaderboard/global").then(({ data }) => setLeaderboard(data)).catch(() => null);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { roundNumber: number; eventState: EventState }) => { setEventState(data.eventState); };
    socket.on("round:started", handler);
    return () => { socket.off("round:started", handler); };
  }, []);

  const roundNames = ["", "Shadow Tactics", "Shrine Of Wisdom", "Khan's Ultimatum"];
  const roundDescs = [
    "",
    "1v1 Coding Duel — Solve algorithmic problems head-to-head",
    "1v1 Debugging MCQ — Find bugs in Java code faster than your opponent",
    "MVP Building — Build a working prototype from a problem statement",
  ];
  const roundIcons = ["", "⚔️", "🧠", "👑"];

  const myEntry = leaderboard.find((e) => e.id === user?.id);

  return (
    <div className="app-shell min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ghost-gold md:text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Dashboard
            </h1>
            <p className="mt-1 text-gray-400 text-sm">
              Welcome back, <span className="text-white font-semibold">{user?.name ?? "participant"}</span>
            </p>
          </div>
          {/* Ghost badge */}
          <div className="flex items-center gap-3">
            <div style={{ width: "36px", height: "42px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-6px", left: "-10px" }}>
                <GhostFigure scale={0.4} />
              </div>
            </div>
            <div className="text-right">
              <div className="rounded-full border border-ghost-gold/22 bg-ghost-gold/8 px-3 py-1 text-xs font-semibold text-ghost-gold">
                Way Of Ghost
              </div>
            </div>
          </div>
        </div>

        {/* User stats */}
        {myEntry && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Your Bits", value: myEntry.bits, color: "text-ghost-gold" },
              { label: "Rank", value: `#${leaderboard.findIndex((e) => e.id === user?.id) + 1}`, color: "text-ghost-gold" },
              { label: "Status", value: myEntry.eliminated ? "Eliminated" : "Active", color: myEntry.eliminated ? "text-ghost-red" : "text-ghost-green" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active round banner */}
        {eventState && eventState.roundStatus === "LIVE" && eventState.currentRound > 0 && (
          <div className="glass-card border-ghost-gold/30 p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-ghost-gold uppercase tracking-widest mb-1">🔴 Round {eventState.currentRound} is LIVE</p>
                <p className="text-xl font-bold">{roundNames[eventState.currentRound]}</p>
                <p className="text-sm text-gray-300 mt-1">{roundDescs[eventState.currentRound]}</p>
              </div>
              <Link to={`/round/${eventState.currentRound}`} className="contest-btn-primary rounded-xl px-7 py-3 text-sm font-bold">
                Enter Round →
              </Link>
            </div>
          </div>
        )}

        {(!eventState || eventState.roundStatus !== "LIVE") && (
          <div className="glass-card p-6 text-center mb-6">
            <div className="flex justify-center mb-3" style={{ height: "60px" }}>
              <div style={{ position: "relative", top: "-10px" }}>
                <GhostFigure scale={0.55} />
              </div>
            </div>
            <p className="text-gray-400">No round is currently active.</p>
            <p className="mt-1 text-sm text-gray-500">Wait for the admin to start a round.</p>
          </div>
        )}

        {/* Round cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[1, 2, 3].map((r) => {
            const isLive = eventState?.currentRound === r && eventState.roundStatus === "LIVE";
            return (
              <Link
                key={r}
                to={`/round/${r}`}
                className={`glass-card p-5 group transition-all duration-200 hover:-translate-y-1 hover:border-ghost-gold/25 ${isLive ? "border-ghost-gold/35" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{roundIcons[r]}</span>
                  {isLive && <span className="contest-live-dot text-xs text-ghost-green font-semibold">LIVE</span>}
                </div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Round {r}</p>
                <p className="text-base font-bold mt-1 text-white group-hover:text-ghost-gold transition-colors">{roundNames[r]}</p>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">{roundDescs[r]}</p>
              </Link>
            );
          })}
        </div>

        {/* Leaderboard */}
        <section className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/7">
            <h2 className="font-semibold text-ghost-gold" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", letterSpacing: ".1em" }}>
              🏆 Leaderboard
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry.id} className={`flex items-center justify-between px-5 py-3 text-sm transition-colors ${entry.id === user?.id ? "bg-ghost-gold/6" : "hover:bg-white/3"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`font-bold tabular-nums w-6 flex-shrink-0 ${i === 0 ? "text-ghost-gold text-base" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>
                    #{i + 1}
                  </span>
                  <span className={`truncate ${entry.eliminated ? "text-gray-500 line-through" : "text-white"}`}>{entry.name}</span>
                  <span className="text-xs text-gray-600 hidden sm:block truncate">{entry.college}</span>
                </div>
                <span className="font-mono font-bold text-ghost-gold flex-shrink-0">{entry.bits}</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-500 text-center">No participants yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
