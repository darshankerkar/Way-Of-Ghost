import { useEffect, useState, useCallback } from "react";
import { http } from "../api/http";
import type { Matchup, QuizQuestion, EventState, LeaderboardEntry } from "../types";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  college: string;
  status: string;
};

export function AdminPage() {
  const [tab, setTab] = useState<"rounds" | "users" | "problems" | "quiz" | "leaderboard">("rounds");
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState("");
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [roundMatchupCounts, setRoundMatchupCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Problem creation
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDiff, setPDiff] = useState("Easy");
  const [pRound, setPRound] = useState(1);
  const [pStarter, setPStarter] = useState("");
  const [pTimeLimit, setPTimeLimit] = useState(900);
  const [tcInput, setTcInput] = useState("");
  const [tcExpected, setTcExpected] = useState("");
  const [tcHidden, setTcHidden] = useState(false);
  const [testCases, setTestCases] = useState<{ input: string; expected: string; isHidden: boolean }[]>([]);

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [qText, setQText] = useState("");
  const [qCode, setQCode] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qTimeLimit, setQTimeLimit] = useState(45);
  const [qPoints, setQPoints] = useState(100);

  const loadPending = useCallback(async () => {
    try { const { data } = await http.get<PendingUser[]>("/admin/pending-users"); setPendingUsers(data); } catch {}
  }, []);
  const loadEventState = useCallback(async () => {
    try { const { data } = await http.get<EventState>("/round/event-state"); setEventState(data); } catch {}
  }, []);
  const loadMatchups = useCallback(async (round: number) => {
    try { const { data } = await http.get<Matchup[]>(`/round/${round}/matchups`); setMatchups(data); } catch {}
  }, []);
  const loadRoundMatchupCounts = useCallback(async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        http.get<Matchup[]>("/round/1/matchups"),
        http.get<Matchup[]>("/round/2/matchups"),
        http.get<Matchup[]>("/round/3/matchups"),
      ]);
      setRoundMatchupCounts({
        1: r1.data.length,
        2: r2.data.length,
        3: r3.data.length,
      });
    } catch {}
  }, []);
  const loadQuiz = useCallback(async () => {
    try { const { data } = await http.get<QuizQuestion[]>("/quiz/questions"); setQuizQuestions(data); } catch {}
  }, []);
  const loadLeaderboard = useCallback(async () => {
    try { const { data } = await http.get<LeaderboardEntry[]>("/round/leaderboard/global"); setLeaderboard(data); } catch {}
  }, []);

  useEffect(() => {
    loadPending();
    loadEventState();
    loadRoundMatchupCounts();
    loadLeaderboard();
  }, [loadPending, loadEventState, loadRoundMatchupCounts, loadLeaderboard]);

  useEffect(() => {
    if (tab === "quiz") loadQuiz();
    if (tab === "rounds" && eventState) loadMatchups(eventState.currentRound);
    if (tab === "rounds") loadRoundMatchupCounts();
    if (tab === "leaderboard") loadLeaderboard();
  }, [tab, eventState, loadQuiz, loadMatchups, loadRoundMatchupCounts, loadLeaderboard]);

  async function updateUser(userId: string, status: "APPROVED" | "REJECTED") {
    await http.patch(`/admin/users/${userId}`, { status });
    flash(`User ${status.toLowerCase()}.`);
    await loadPending();
  }

  async function startRound(n: number) {
    try {
      const { data } = await http.post("/admin/start-round", { roundNumber: n });
      flash(data.message);
      loadEventState();
      loadMatchups(n);
      loadRoundMatchupCounts();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed");
    }
  }

  async function resetRound(n: number) {
    if (!confirm(`Reset Round ${n}? This will delete ALL matchups for this round and un-eliminate affected users.`)) return;
    try {
      const { data } = await http.post("/admin/reset-round", { roundNumber: n });
      flash(data.message);
      loadEventState();
      setMatchups([]);
      loadRoundMatchupCounts();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed");
    }
  }

  async function createProblem() {
    try {
      await http.post("/problem", {
        title: pTitle, description: pDesc, difficulty: pDiff,
        roundNumber: pRound, starterCode: pStarter, timeLimit: pTimeLimit, testCases,
      });
      flash("Problem created.");
      setPTitle(""); setPDesc(""); setPStarter(""); setTestCases([]);
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed");
    }
  }

  async function createQuizQ() {
    try {
      await http.post("/quiz/questions", {
        questionText: qText, codeSnippet: qCode, options: qOptions,
        correctIndex: qCorrectIdx, timeLimit: qTimeLimit, points: qPoints,
      });
      flash("Question created.");
      setQText(""); setQCode(""); setQOptions(["", "", "", ""]);
      loadQuiz();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed");
    }
  }

  async function pushQuestion(id: string) {
    try { await http.post("/quiz/push-question", { questionId: id }); flash("Question pushed!"); }
    catch { flash("Failed to push."); }
  }

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  const tabs = [
    { id: "rounds" as const, label: "Rounds" },
    { id: "users" as const, label: "Users" },
    { id: "problems" as const, label: "Problems" },
    { id: "quiz" as const, label: "Quiz" },
    { id: "leaderboard" as const, label: "Leaderboard" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6 text-white">
      <h1 className="text-3xl font-bold text-ghost-gold">Admin Control Panel</h1>
      {message && <p className="mt-2 rounded bg-ghost-green/10 px-3 py-1 text-sm text-ghost-green">{message}</p>}

      <div className="mt-4 flex gap-1 border-b border-gray-800">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.id ? "border-b-2 border-ghost-gold text-ghost-gold" : "text-gray-400 hover:text-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ── ROUNDS ── */}
        {tab === "rounds" && (
          <div className="space-y-6">
            <div className="rounded bg-ghost-panel p-4">
              <h2 className="text-lg font-semibold">Event State</h2>
              {eventState ? (
                <p className="mt-1 text-sm text-gray-300">
                  Round: <span className="font-bold text-ghost-gold">{eventState.currentRound}</span> | Status: <span className="font-bold">{eventState.roundStatus}</span>
                </p>
              ) : <p className="mt-1 text-sm text-gray-500">No event state yet.</p>}
            </div>
            <div className="rounded bg-ghost-panel p-4">
              <h2 className="text-lg font-semibold">Round Controls</h2>
              <div className="mt-3 space-y-3">
                {[1, 2, 3].map((n) => {
                  const isLive = eventState?.currentRound === n && eventState?.roundStatus === "LIVE";
                  const hasExistingMatchups = (roundMatchupCounts[n] ?? 0) > 0;
                  const canStart = !isLive && !hasExistingMatchups;
                  return (
                    <div key={n} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium text-gray-300">Round {n}</span>
                      {isLive && (
                        <span className="rounded bg-ghost-green/20 px-2 py-0.5 text-xs font-semibold text-ghost-green">LIVE</span>
                      )}
                      {!isLive && hasExistingMatchups && (
                        <span className="rounded bg-ghost-red/20 px-2 py-0.5 text-xs font-semibold text-ghost-red">RESET REQUIRED</span>
                      )}
                      {!isLive && !hasExistingMatchups && (
                        <span className="rounded bg-gray-700/70 px-2 py-0.5 text-xs font-semibold text-gray-300">READY</span>
                      )}
                      <button
                        className="rounded bg-ghost-gold px-4 py-1.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() => startRound(n)}
                        disabled={!canStart}
                      >
                        Start
                      </button>
                      <button
                        className="rounded bg-ghost-gold/80 px-4 py-1.5 text-sm font-semibold text-black hover:bg-ghost-gold"
                        onClick={() => resetRound(n)}
                      >
                        Reset
                      </button>
                      <span className="text-xs text-gray-500">Matchups: {roundMatchupCounts[n] ?? 0}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Start is blocked if the round already has matchups. Use Reset first to clear stale pairings before restarting.
              </p>
            </div>
            {/* Matchups */}
            {matchups.length > 0 && (
              <div className="rounded bg-ghost-panel p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Matchups (Round {eventState?.currentRound})</h2>
                  <button className="text-sm text-ghost-gold" onClick={() => loadMatchups(eventState?.currentRound ?? 1)}>Refresh</button>
                </div>
                <div className="mt-3 space-y-2">
                  {matchups.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded bg-black/30 p-3">
                      <div className="flex items-center gap-3">
                        <span className={m.winner?.id === m.user1.id ? "font-bold text-ghost-green" : ""}>{m.user1.name}</span>
                        <span className="text-gray-500">vs</span>
                        <span className={m.winner?.id === m.user2.id ? "font-bold text-ghost-green" : ""}>{m.user2.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{m.problem.title}</span>
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          m.status === "LIVE" ? "bg-ghost-green/20 text-ghost-green" :
                          m.status === "COMPLETED" ? "bg-gray-700 text-gray-300" : "bg-ghost-gold/20 text-ghost-gold"
                        }`}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="rounded bg-ghost-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pending Users</h2>
              <button className="text-sm text-ghost-gold" onClick={loadPending}>Refresh</button>
            </div>
            <div className="mt-3 space-y-2">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded bg-black/30 p-3">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-gray-400">{u.email} — {u.college}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded bg-ghost-gold px-3 py-1 text-sm text-black" onClick={() => updateUser(u.id, "APPROVED")}>Approve</button>
                    <button className="rounded bg-ghost-gold/80 px-3 py-1 text-sm text-black hover:bg-ghost-gold" onClick={() => updateUser(u.id, "REJECTED")}>Reject</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && <p className="text-sm text-gray-500">No pending users.</p>}
            </div>
          </div>
        )}

        {/* ── PROBLEMS ── */}
        {tab === "problems" && (
          <div className="rounded bg-ghost-panel p-4">
            <h2 className="text-lg font-semibold">Create Problem</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-400">Title</label>
                <input className="mt-1 w-full rounded bg-black/40 p-2" value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Round</label>
                  <select className="mt-1 w-full rounded bg-black/40 p-2" value={pRound} onChange={(e) => setPRound(Number(e.target.value))}>
                    <option value={1}>Round 1</option><option value={2}>Round 2</option><option value={3}>Round 3</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Difficulty</label>
                  <select className="mt-1 w-full rounded bg-black/40 p-2" value={pDiff} onChange={(e) => setPDiff(e.target.value)}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Time (s)</label>
                  <input type="number" className="mt-1 w-full rounded bg-black/40 p-2" value={pTimeLimit} onChange={(e) => setPTimeLimit(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-400">Description</label>
              <textarea className="mt-1 w-full rounded bg-black/40 p-2" rows={5} value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-400">Starter Code</label>
              <textarea className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm" rows={4} value={pStarter} onChange={(e) => setPStarter(e.target.value)} />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-ghost-gold">Test Cases ({testCases.length})</h3>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-400">Input</label>
                  <textarea className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm" rows={2} value={tcInput} onChange={(e) => setTcInput(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Expected Output</label>
                  <textarea className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm" rows={2} value={tcExpected} onChange={(e) => setTcExpected(e.target.value)} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-gray-400">
                  <input type="checkbox" checked={tcHidden} onChange={(e) => setTcHidden(e.target.checked)} /> Hidden
                </label>
                <button className="rounded bg-ghost-gold/80 px-3 py-1 text-sm text-black hover:bg-ghost-gold" onClick={() => {
                  setTestCases([...testCases, { input: tcInput, expected: tcExpected, isHidden: tcHidden }]);
                  setTcInput(""); setTcExpected("");
                }}>Add Test Case</button>
              </div>
              {testCases.map((tc, i) => (
                <div key={i} className="mt-1 flex items-center justify-between rounded bg-black/20 px-3 py-1 text-xs font-mono">
                  <span>In: {tc.input.slice(0, 30)} | Out: {tc.expected.slice(0, 30)} {tc.isHidden ? "(hidden)" : ""}</span>
                  <button className="text-ghost-gold" onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}>x</button>
                </div>
              ))}
            </div>
            <button className="mt-4 rounded bg-ghost-gold px-4 py-2 font-semibold text-black" onClick={createProblem}>Create Problem</button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {tab === "quiz" && (
          <div className="space-y-6">
            <div className="rounded bg-ghost-panel p-4">
              <h2 className="text-lg font-semibold">Create Debugging MCQ</h2>
              <div className="mt-4">
                <label className="text-sm text-gray-400">Question</label>
                <textarea className="mt-1 w-full rounded bg-black/40 p-2" rows={2} value={qText} onChange={(e) => setQText(e.target.value)} />
              </div>
              <div className="mt-3">
                <label className="text-sm text-gray-400">Code Snippet (buggy code to display)</label>
                <textarea className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm" rows={6} value={qCode} onChange={(e) => setQCode(e.target.value)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {qOptions.map((opt, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-400">
                      Option {String.fromCharCode(65 + i)} {i === qCorrectIdx && <span className="text-ghost-green">(correct)</span>}
                    </label>
                    <input className="mt-1 w-full rounded bg-black/40 p-2 text-sm" value={opt}
                      onChange={(e) => { const c = [...qOptions]; c[i] = e.target.value; setQOptions(c); }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4">
                <div>
                  <label className="text-xs text-gray-400">Correct</label>
                  <select className="mt-1 w-full rounded bg-black/40 p-2" value={qCorrectIdx} onChange={(e) => setQCorrectIdx(Number(e.target.value))}>
                    {[0,1,2,3].map((i) => <option key={i} value={i}>{String.fromCharCode(65+i)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Time (s)</label>
                  <input type="number" className="mt-1 w-full rounded bg-black/40 p-2" value={qTimeLimit} onChange={(e) => setQTimeLimit(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Points</label>
                  <input type="number" className="mt-1 w-full rounded bg-black/40 p-2" value={qPoints} onChange={(e) => setQPoints(Number(e.target.value))} />
                </div>
              </div>
              <button className="mt-4 rounded bg-ghost-gold px-4 py-2 font-semibold text-black" onClick={createQuizQ}>Create Question</button>
            </div>

            <div className="rounded bg-ghost-panel p-4">
              <h2 className="text-lg font-semibold">Questions ({quizQuestions.length})</h2>
              <div className="mt-3 space-y-2">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="flex items-center justify-between rounded bg-black/30 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Q{idx + 1}: {q.questionText}</p>
                      <p className="text-xs text-gray-400">{q.timeLimit}s | {q.points}pts | Answer: {String.fromCharCode(65 + q.correctIndex)}</p>
                    </div>
                    <button className="rounded bg-ghost-gold px-3 py-1 text-sm font-semibold text-black" onClick={() => pushQuestion(q.id)}>
                      Push
                    </button>
                  </div>
                ))}
                {quizQuestions.length === 0 && <p className="text-sm text-gray-500">No questions. 6 are pre-seeded from the debugging docs.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <div className="rounded bg-ghost-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Global Leaderboard</h2>
              <button className="text-sm text-ghost-gold" onClick={loadLeaderboard}>Refresh</button>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="pb-2">Rank</th><th className="pb-2">Name</th><th className="pb-2">College</th>
                <th className="pb-2">Bits</th><th className="pb-2">Status</th>
              </tr></thead>
              <tbody>
                {leaderboard.map((u, i) => (
                  <tr key={u.id} className="border-b border-gray-800">
                    <td className={`py-2 font-bold ${i === 0 ? "text-ghost-gold" : "text-gray-500"}`}>#{i + 1}</td>
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-gray-400">{u.college}</td>
                    <td className="py-2 font-mono text-ghost-gold">{u.bits}</td>
                    <td className="py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${u.eliminated ? "bg-ghost-red/20 text-ghost-red" : "bg-ghost-green/20 text-ghost-green"}`}>
                        {u.eliminated ? "Eliminated" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaderboard.length === 0 && <p className="mt-4 text-sm text-gray-500">No participants yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
