import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useExamMode } from "../hooks/useExamMode";
import { useAuthStore } from "../store/auth.store";
import type { Problem, LeaderboardEntry } from "../types";

const BITS_REQUIRED = 200;

export function Round3Page() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    fullscreenLockActive,
    tabSwitchCount,
    violationLocked,
    warningMessage,
    bannedMessage,
    clearWarning,
    warningText,
    reEnterFullscreen,
  } = useExamMode("Round 3", 3);

  // ── Access guard: only 200+ bits allowed ──────────────────────────────
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    http.get<LeaderboardEntry[]>("/round/leaderboard/global").then(({ data }) => {
      const myEntry = data.find((e) => e.id === user.id);
      if ((myEntry?.bits ?? 0) < BITS_REQUIRED) {
        navigate("/dashboard", { replace: true, state: { r3Locked: true } });
      } else {
        setAccessChecked(true);
      }
    }).catch(() => navigate("/dashboard", { replace: true }));
  }, [user, navigate]);

  useEffect(() => {
    if (!accessChecked) return;
    http.get<Problem[]>("/round/3/problems").then(({ data }) => {
      setProblems(data);
      if (data.length > 0) setSelected(data[0]);
    }).catch(() => null);
  }, [accessChecked]);

  if (!accessChecked) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-white">
        <p className="text-gray-400 text-sm">Verifying access…</p>
      </div>
    );
  }


  if (problems.length === 0) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ghost-gold">Round 3 — Khan's Ultimatum</h1>
          <p className="mt-4 text-gray-400">MVP Building Round</p>
          <p className="mt-1 text-sm text-gray-500">Waiting for problem statements to be published...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] text-white">
      {violationLocked && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-6">
          <p className="text-center text-3xl font-bold text-red-500">{bannedMessage || "You are banned due to multiple tab switches"}</p>
        </div>
      )}

      {warningMessage && !violationLocked && (
        <div className="pointer-events-none fixed right-4 top-20 z-[61] max-w-md">
          <div className="pointer-events-auto rounded-xl border border-amber-400/40 bg-ghost-panel/95 p-4 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold text-amber-300">{warningMessage}</p>
            <button className="mt-2 rounded bg-amber-300 px-3 py-1.5 text-xs font-semibold text-black" onClick={clearWarning}>OK</button>
          </div>
        </div>
      )}

      {fullscreenLockActive && !violationLocked && (
        <div className="pointer-events-none fixed right-4 top-20 z-[60] max-w-md">
          <div className="pointer-events-auto rounded-xl border border-ghost-gold/40 bg-ghost-panel/95 p-4 shadow-lg backdrop-blur">
            <h2 className="text-lg font-bold text-ghost-gold">Exam Mode Required</h2>
            <p className="mt-2 text-xs text-gray-300">{warningText}</p>
            <p className="mt-2 text-xs text-ghost-red">Fullscreen was exited. Re-enter fullscreen to continue.</p>
            <p className="mt-2 text-xs text-ghost-red">Tab switches detected: {tabSwitchCount}</p>
            <button
              className="mt-3 rounded bg-ghost-gold px-3 py-1.5 text-xs font-semibold text-black"
              onClick={() => void reEnterFullscreen()}
            >
              Return To Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-800 bg-ghost-panel px-6 py-4">
        <h1 className="text-2xl font-bold text-ghost-gold">Round 3 — MVP Building</h1>
        <p className="mt-1 text-sm text-gray-400">
          Choose a problem statement and build your MVP on VS Code. Use any tools, frameworks, or AI assistance.
        </p>
      </div>

      <div className="mx-auto max-w-5xl p-6">
        {/* Problem selector tabs */}
        <div className="flex gap-2">
          {problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                selected?.id === p.id
                  ? "bg-ghost-panel text-ghost-gold border-b-2 border-ghost-gold"
                  : "bg-black/20 text-gray-400 hover:text-white"
              }`}
            >
              Problem {i + 1}
            </button>
          ))}
        </div>

        {/* Problem statement */}
        {selected && (
          <div className="rounded-b-lg rounded-tr-lg bg-ghost-panel p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{selected.title}</h2>
              <span className="rounded bg-ghost-gold/20 px-2 py-0.5 text-xs font-semibold text-ghost-gold">
                {selected.difficulty}
              </span>
            </div>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {selected.description}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 rounded-lg border border-gray-800 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-ghost-gold">Instructions</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-400">
            <li>1. Read the problem statement carefully</li>
            <li>2. Open VS Code and start building your MVP</li>
            <li>3. You may use any framework, library, or AI tool</li>
            <li>4. Focus on working functionality and clean UI</li>
            <li>5. Submit your project before the time runs out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
