import { useEffect, useState, useCallback } from "react";
import { http } from "../api/http";
import { getSocket } from "../socket/client";
import type { Matchup, QuizQuestion, EventState, LeaderboardEntry } from "../types";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  college: string;
  status: string;
};

type ExamStatus = {
  userId: string;
  userName: string;
  roundNumber: number;
  fullscreen: boolean;
  tabSwitchCount: number;
  warned: boolean;
  banned: boolean;
  updatedAt?: string;
};

export function AdminPage() {
  const [tab, setTab] = useState<"rounds" | "users" | "problems" | "quiz" | "leaderboard">("rounds");
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [roundMatchupCounts, setRoundMatchupCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [examStatuses, setExamStatuses] = useState<ExamStatus[]>([]);

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
    try {
      const { data } = await http.get<QuizQuestion[]>("/quiz/questions");
      const round2Questions = data.filter((q) => q.roundNumber === 2);
      setQuizQuestions(round2Questions);
    } catch {
      setQuizQuestions([]);
      flash("Failed to load quiz questions.", "error");
    }
  }, []);
  const loadLeaderboard = useCallback(async () => {
    try { const { data } = await http.get<LeaderboardEntry[]>("/round/leaderboard/global"); setLeaderboard(data); } catch {}
  }, []);

  useEffect(() => {
    loadPending();
    loadEventState();
    loadRoundMatchupCounts();
    loadLeaderboard();
    loadQuiz();
  }, [loadPending, loadEventState, loadRoundMatchupCounts, loadLeaderboard, loadQuiz]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const refreshAfterRoundChange = () => {
      loadEventState();
      loadRoundMatchupCounts();
      loadLeaderboard();
    };

    socket.on("round:started", refreshAfterRoundChange);
    socket.on("round:reset", refreshAfterRoundChange);

    const handleSnapshot = (snapshot: ExamStatus[]) => {
      setExamStatuses(snapshot);
    };

    const handleExamUpdate = (status: ExamStatus) => {
      setExamStatuses((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s.userId === status.userId);
        if (idx >= 0) next[idx] = status;
        else next.push(status);
        next.sort((a, b) => a.userName.localeCompare(b.userName));
        return next;
      });
    };

    const handleExamRemove = (payload: { userId: string; roundNumber?: number }) => {
      setExamStatuses((prev) => prev.filter((s) => {
        if (s.userId !== payload.userId) return true;
        if (!payload.roundNumber) return false;
        return s.roundNumber !== payload.roundNumber;
      }));
    };

    const handleTabSwitchAlert = (status: ExamStatus) => {
      flash(`Tab switch: ${status.userName} (R${status.roundNumber}, total ${status.tabSwitchCount})`, "error");
    };

    socket.on("exam:status:snapshot", handleSnapshot);
    socket.on("exam:status:update", handleExamUpdate);
    socket.on("exam:status:remove", handleExamRemove);
    socket.on("exam:tab-switch", handleTabSwitchAlert);

    return () => {
      socket.off("round:started", refreshAfterRoundChange);
      socket.off("round:reset", refreshAfterRoundChange);
      socket.off("exam:status:snapshot", handleSnapshot);
      socket.off("exam:status:update", handleExamUpdate);
      socket.off("exam:status:remove", handleExamRemove);
      socket.off("exam:tab-switch", handleTabSwitchAlert);
    };
  }, [loadEventState, loadRoundMatchupCounts, loadLeaderboard]);

  useEffect(() => {
    if (tab === "quiz") loadQuiz();
    if (tab === "rounds" && eventState) loadMatchups(eventState.currentRound);
    if (tab === "rounds") loadRoundMatchupCounts();
    if (tab === "leaderboard") loadLeaderboard();
  }, [tab, eventState, loadQuiz, loadMatchups, loadRoundMatchupCounts, loadLeaderboard]);

  async function updateUser(userId: string, status: "APPROVED" | "REJECTED") {
    await http.patch(`/admin/users/${userId}`, { status });
    flash(`User ${status.toLowerCase()}.`, "success");
    await loadPending();
  }

  async function startRound(n: number) {
    try {
      const { data } = await http.post("/admin/start-round", { roundNumber: n });
      flash(data.message, "success");
      loadEventState();
      loadMatchups(n);
      loadRoundMatchupCounts();
      loadLeaderboard();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed", "error");
    }
  }

  async function resetRound(n: number) {
    if (!confirm(`Reset Round ${n}? This will delete ALL matchups for this round and un-eliminate affected users.`)) return;
    try {
      const { data } = await http.post("/admin/reset-round", { roundNumber: n });
      flash(data.message, "success");
      loadEventState();
      setMatchups([]);
      loadRoundMatchupCounts();
      loadLeaderboard();
      if (n === 2) loadQuiz();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed", "error");
    }
  }

  async function unblockParticipant(userId: string, roundNumber: number) {
    try {
      const { data } = await http.post<{ message: string }>("/admin/proctoring/unblock", { userId, roundNumber });
      flash(data.message, "success");
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to unblock participant.", "error");
    }
  }

  async function createProblem() {
    try {
      await http.post("/problem", {
        title: pTitle, description: pDesc, difficulty: pDiff,
        roundNumber: pRound, starterCode: pStarter, timeLimit: pTimeLimit, testCases,
      });
      flash("Problem created.", "success");
      setPTitle(""); setPDesc(""); setPStarter(""); setTestCases([]);
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed", "error");
    }
  }

  async function createQuizQ() {
    try {
      await http.post("/quiz/questions", {
        questionText: qText, codeSnippet: qCode, options: qOptions,
        correctIndex: qCorrectIdx, timeLimit: qTimeLimit, points: qPoints,
      });
      flash("Question created.", "success");
      setQText(""); setQCode(""); setQOptions(["", "", "", ""]);
      loadQuiz();
    } catch (err) {
      flash((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed", "error");
    }
  }

  async function pushQuestion(id: string) {
    try {
      await http.post("/quiz/push-question", { questionId: id });
      flash("Question pushed!", "success");
      loadQuiz();
    }
    catch { flash("Failed to push.", "error"); }
  }

  function flash(msg: string, tone: "success" | "error") {
    setMessage(msg);
    setMessageTone(tone);
    setTimeout(() => setMessage(""), 3000);
  }

  const tabs = [
    { id: "rounds" as const, label: "Rounds" },
    { id: "users" as const, label: "Users" },
    { id: "problems" as const, label: "Problems" },
    { id: "quiz" as const, label: "Quiz" },
    { id: "leaderboard" as const, label: "Leaderboard" },
  ];

  const activeParticipants = leaderboard.filter((u) => !u.eliminated).length;
  const eliminatedParticipants = leaderboard.filter((u) => u.eliminated).length;
  const sectionCardClass = "rounded-2xl bg-[rgba(243,232,214,0.96)] p-4 shadow-[0_12px_30px_rgba(120,55,20,0.16)]";
  const subCardClass = "rounded-xl bg-[rgba(226,214,198,0.92)] p-3 shadow-[0_6px_16px_rgba(120,55,20,0.12)]";
  const topStatCardClass = "rounded-2xl bg-[linear-gradient(135deg,rgba(201,163,78,0.26)_0%,rgba(139,0,0,0.12)_100%)] px-4 py-3 shadow-[0_8px_18px_rgba(120,55,20,0.16)]";
  const inputClass = "mt-1 w-full rounded-lg bg-[rgba(217,203,186,0.88)] p-2 text-[#1A1A1A] placeholder:text-[rgba(26,26,26,0.55)] focus:outline-none focus:ring-2 focus:ring-[rgba(139,0,0,0.24)]";
  const navbarHoverButtonClass = "rounded-lg px-3 py-1.5 text-[14px] font-bold tracking-wide transition-all duration-200 font-['Cinzel',serif] text-[rgba(26,26,26,0.72)] bg-[rgba(139,0,0,0.04)] hover:text-[#8B0000] hover:bg-[rgba(139,0,0,0.12)]";
  const primaryActionClass = "rounded-lg px-3 py-1.5 text-sm font-bold tracking-wide font-['Cinzel',serif] transition-all duration-200 bg-[rgba(139,0,0,0.18)] text-[#6f0000] hover:bg-[rgba(139,0,0,0.28)] hover:shadow-[0_4px_10px_rgba(139,0,0,0.16)]";
  const secondaryActionClass = "rounded-lg px-3 py-1.5 text-sm font-bold tracking-wide font-['Cinzel',serif] transition-all duration-200 bg-[rgba(201,163,78,0.34)] text-[#6f0000] hover:bg-[rgba(201,163,78,0.48)]";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 text-[#1A1A1A] md:px-8">
      <div className="rounded-[20px] bg-[rgba(247,237,223,0.86)] p-5 shadow-[0_16px_40px_rgba(120,55,20,0.16)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Admin Control Panel</h1>
            <p className="mt-1 text-[15px] text-[rgba(26,26,26,0.78)] font-['Noto_Serif_JP',serif]">Manage rounds, approvals, problems, quiz, and live standings.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
            <div className={topStatCardClass}>
              <p className="text-[rgba(26,26,26,0.72)] font-['Cinzel',serif] tracking-wide">Round</p>
              <p className="font-bold text-[#8B0000] font-['Cinzel',serif]">{eventState?.currentRound ?? 0}</p>
            </div>
            <div className={topStatCardClass}>
              <p className="text-[rgba(26,26,26,0.72)] font-['Cinzel',serif] tracking-wide">Active</p>
              <p className="font-bold text-[#4a7c59] font-['Cinzel',serif]">{activeParticipants}</p>
            </div>
            <div className={topStatCardClass}>
              <p className="text-[rgba(26,26,26,0.72)] font-['Cinzel',serif] tracking-wide">Eliminated</p>
              <p className="font-bold text-[#8B0000] font-['Cinzel',serif]">{eliminatedParticipants}</p>
            </div>
          </div>
        </div>

        {message && (
          <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${messageTone === "error" ? "bg-[rgba(139,0,0,0.10)] text-[#8B0000]" : "bg-[rgba(74,124,89,0.12)] text-[#4a7c59]"}`}>
            {message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 pb-3">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-all duration-200 font-['Cinzel',serif] ${tab === t.id ? "bg-[rgba(139,0,0,0.08)] text-[#8B0000] shadow-[0_2px_10px_rgba(139,0,0,0.06)]" : "text-[rgba(26,26,26,0.58)] hover:text-[#8B0000] hover:bg-[rgba(139,0,0,0.06)]"}`}>
              {t.label}
            </button>
          ))}
        </div>

      <div className="mt-6">
        {/* ── ROUNDS ── */}
        {tab === "rounds" && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              <div className={sectionCardClass}>
                <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Event State</h2>
                {eventState ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-[rgba(26,26,26,0.72)]">Round: <span className="font-bold text-[#8B0000]">{eventState.currentRound}</span></p>
                    <p className="text-[rgba(26,26,26,0.72)]">Status: <span className="font-bold">{eventState.roundStatus}</span></p>
                  </div>
                ) : <p className="mt-2 text-sm text-[rgba(26,26,26,0.56)]">No event state yet.</p>}
              </div>

              <div className={sectionCardClass}>
              <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Round Controls</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((n) => {
                  const isLive = eventState?.currentRound === n && eventState?.roundStatus === "LIVE";
                  const hasExistingMatchups = (roundMatchupCounts[n] ?? 0) > 0;
                  const canStart = !isLive && !hasExistingMatchups;
                  return (
                    <div key={n} className={subCardClass}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#8B0000] font-['Cinzel',serif]">Round {n}</span>
                        {isLive && (
                          <span className="rounded bg-[rgba(74,124,89,0.16)] px-2 py-0.5 text-[11px] font-semibold text-[#4a7c59]">LIVE</span>
                        )}
                        {!isLive && hasExistingMatchups && (
                          <span className="rounded bg-[rgba(139,0,0,0.14)] px-2 py-0.5 text-[11px] font-semibold text-[#8B0000]">RESET REQUIRED</span>
                        )}
                        {!isLive && !hasExistingMatchups && (
                          <span className="rounded bg-[rgba(26,26,26,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,26,26,0.65)]">READY</span>
                        )}
                      </div>
                      <p className="mb-3 text-xs text-[rgba(26,26,26,0.56)]">Matchups: {roundMatchupCounts[n] ?? 0}</p>
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 ${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-40`}
                          onClick={() => startRound(n)}
                          disabled={!canStart}
                        >
                          Start
                        </button>
                        <button
                          className={`flex-1 ${secondaryActionClass}`}
                          onClick={() => resetRound(n)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[rgba(26,26,26,0.56)]">
                Start is blocked if the round already has matchups. Use Reset first to clear stale pairings before restarting.
              </p>
            </div>
            </div>

            {/* Matchups */}
            {matchups.length > 0 && (
              <div className={sectionCardClass}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Matchups (Round {eventState?.currentRound})</h2>
                  <button className={navbarHoverButtonClass} onClick={() => loadMatchups(eventState?.currentRound ?? 1)}>Refresh</button>
                </div>
                <div className="mt-3 space-y-2">
                  {matchups.map((m) => (
                    <div key={m.id} className="flex flex-col gap-3 rounded-xl bg-[rgba(223,211,194,0.9)] p-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={m.winner?.id === m.user1.id ? "font-bold text-ghost-green" : ""}>{m.user1.name}</span>
                        <span className="text-[rgba(26,26,26,0.45)]">vs</span>
                        <span className={m.winner?.id === m.user2.id ? "font-bold text-ghost-green" : ""}>{m.user2.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm md:justify-end">
                        <span className="text-[rgba(26,26,26,0.65)]">{m.problem.title}</span>
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          m.status === "LIVE" ? "bg-ghost-green/20 text-ghost-green" :
                          m.status === "COMPLETED" ? "bg-[rgba(26,26,26,0.08)] text-[rgba(26,26,26,0.68)]" : "bg-[rgba(139,0,0,0.10)] text-[#8B0000]"
                        }`}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={sectionCardClass}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Proctoring: Fullscreen Status</h2>
                <span className="text-xs text-[rgba(26,26,26,0.56)]">Live via socket</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-[rgba(26,26,26,0.65)]">
                      <th className="pb-2">Participant</th>
                      <th className="pb-2">Round</th>
                      <th className="pb-2">Fullscreen</th>
                      <th className="pb-2">Tab Switches</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examStatuses.map((s) => (
                      <tr key={`${s.userId}:${s.roundNumber}`} className="bg-[rgba(223,211,194,0.72)]">
                        <td className="py-2 font-medium">{s.userName}</td>
                        <td className="py-2 text-[rgba(26,26,26,0.72)]">{s.roundNumber}</td>
                        <td className="py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${s.banned ? "bg-ghost-red/30 text-ghost-red" : s.fullscreen ? "bg-ghost-green/20 text-ghost-green" : "bg-ghost-red/20 text-ghost-red"}`}>
                            {s.banned ? "BANNED" : s.fullscreen ? "In Fullscreen" : "Not Fullscreen"}
                          </span>
                        </td>
                        <td className={`py-2 font-mono ${s.tabSwitchCount > 0 ? "text-ghost-red" : "text-ghost-gold"}`}>{s.tabSwitchCount}</td>
                        <td className="py-2">
                          {s.banned ? (
                            <button
                              className={primaryActionClass}
                              onClick={() => unblockParticipant(s.userId, s.roundNumber)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <span className="text-xs text-[rgba(26,26,26,0.56)]">Monitoring</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {examStatuses.length === 0 && (
                <p className="mt-3 text-sm text-[rgba(26,26,26,0.56)]">No participant proctoring data yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className={sectionCardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Pending Users</h2>
              <button className={navbarHoverButtonClass} onClick={loadPending}>Refresh</button>
            </div>
            <div className="mt-3 space-y-2">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex flex-col gap-3 rounded-xl bg-[rgba(223,211,194,0.9)] p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-[rgba(26,26,26,0.65)]">{u.email} — {u.college}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={primaryActionClass} onClick={() => updateUser(u.id, "APPROVED")}>Approve</button>
                    <button className={secondaryActionClass} onClick={() => updateUser(u.id, "REJECTED")}>Reject</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && <p className="text-sm text-[rgba(26,26,26,0.56)]">No pending users.</p>}
            </div>
          </div>
        )}

        {/* ── PROBLEMS ── */}
        {tab === "problems" && (
          <div className={sectionCardClass}>
            <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Create Problem</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-[rgba(26,26,26,0.65)]">Title</label>
                <input className={inputClass} value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex-1">
                  <label className="text-sm text-[rgba(26,26,26,0.65)]">Round</label>
                  <select className={inputClass} value={pRound} onChange={(e) => setPRound(Number(e.target.value))}>
                    <option value={1}>Round 1</option><option value={2}>Round 2</option><option value={3}>Round 3</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-[rgba(26,26,26,0.65)]">Difficulty</label>
                  <select className={inputClass} value={pDiff} onChange={(e) => setPDiff(e.target.value)}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-[rgba(26,26,26,0.65)]">Time (s)</label>
                  <input type="number" className={inputClass} value={pTimeLimit} onChange={(e) => setPTimeLimit(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-[rgba(26,26,26,0.65)]">Description</label>
              <textarea className={inputClass} rows={5} value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className="text-sm text-[rgba(26,26,26,0.65)]">Starter Code</label>
              <textarea className={`${inputClass} font-mono text-sm`} rows={4} value={pStarter} onChange={(e) => setPStarter(e.target.value)} />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#8B0000] font-['Cinzel',serif]">Test Cases ({testCases.length})</h3>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-[rgba(26,26,26,0.65)]">Input</label>
                  <textarea className={`${inputClass} font-mono text-sm`} rows={2} value={tcInput} onChange={(e) => setTcInput(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[rgba(26,26,26,0.65)]">Expected Output</label>
                  <textarea className={`${inputClass} font-mono text-sm`} rows={2} value={tcExpected} onChange={(e) => setTcExpected(e.target.value)} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-[rgba(26,26,26,0.65)]">
                  <input type="checkbox" checked={tcHidden} onChange={(e) => setTcHidden(e.target.checked)} /> Hidden
                </label>
                <button className={secondaryActionClass} onClick={() => {
                  setTestCases([...testCases, { input: tcInput, expected: tcExpected, isHidden: tcHidden }]);
                  setTcInput(""); setTcExpected("");
                }}>Add Test Case</button>
              </div>
              {testCases.map((tc, i) => (
                <div key={i} className="mt-1 flex items-center justify-between rounded-lg bg-[rgba(214,201,184,0.84)] px-3 py-1 text-xs font-mono">
                  <span>In: {tc.input.slice(0, 30)} | Out: {tc.expected.slice(0, 30)} {tc.isHidden ? "(hidden)" : ""}</span>
                  <button className={navbarHoverButtonClass} onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}>x</button>
                </div>
              ))}
            </div>
            <button className={`mt-4 ${primaryActionClass}`} onClick={createProblem}>Create Problem</button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {tab === "quiz" && (
          <div className="space-y-6">
            <div className={sectionCardClass}>
              <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Create Debugging MCQ</h2>
              <div className="mt-4">
                <label className="text-sm text-[rgba(26,26,26,0.65)]">Question</label>
                <textarea className={inputClass} rows={2} value={qText} onChange={(e) => setQText(e.target.value)} />
              </div>
              <div className="mt-3">
                <label className="text-sm text-[rgba(26,26,26,0.65)]">Code Snippet (buggy code to display)</label>
                <textarea className={`${inputClass} font-mono text-sm`} rows={6} value={qCode} onChange={(e) => setQCode(e.target.value)} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {qOptions.map((opt, i) => (
                  <div key={i}>
                    <label className="text-xs text-[rgba(26,26,26,0.65)]">
                      Option {String.fromCharCode(65 + i)} {i === qCorrectIdx && <span className="text-ghost-green">(correct)</span>}
                    </label>
                    <input className={`${inputClass} text-sm`} value={opt}
                      onChange={(e) => { const c = [...qOptions]; c[i] = e.target.value; setQOptions(c); }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-[rgba(26,26,26,0.65)]">Correct</label>
                  <select className={inputClass} value={qCorrectIdx} onChange={(e) => setQCorrectIdx(Number(e.target.value))}>
                    {[0,1,2,3].map((i) => <option key={i} value={i}>{String.fromCharCode(65+i)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[rgba(26,26,26,0.65)]">Time (s)</label>
                  <input type="number" className={inputClass} value={qTimeLimit} onChange={(e) => setQTimeLimit(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-[rgba(26,26,26,0.65)]">Points</label>
                  <input type="number" className={inputClass} value={qPoints} onChange={(e) => setQPoints(Number(e.target.value))} />
                </div>
              </div>
              <button className={`mt-4 ${primaryActionClass}`} onClick={createQuizQ}>Create Question</button>
            </div>

            <div className={sectionCardClass}>
              <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Questions ({quizQuestions.length})</h2>
              <div className="mt-3 space-y-2">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-3 rounded-xl bg-[rgba(223,211,194,0.9)] p-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Q{idx + 1}: {q.questionText}</p>
                      <p className="text-xs text-[rgba(26,26,26,0.65)]">{q.timeLimit}s | {q.points}pts | Answer: {String.fromCharCode(65 + q.correctIndex)}</p>
                    </div>
                    <button className={primaryActionClass} onClick={() => pushQuestion(q.id)}>
                      Push
                    </button>
                  </div>
                ))}
                {quizQuestions.length === 0 && <p className="text-sm text-[rgba(26,26,26,0.56)]">No questions. 6 are pre-seeded from the debugging docs.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <div className={sectionCardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide text-[#8B0000] font-['Cinzel',serif]">Global Leaderboard</h2>
              <button className={navbarHoverButtonClass} onClick={loadLeaderboard}>Refresh</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-[rgba(26,26,26,0.65)]">
                <th className="pb-2">Rank</th><th className="pb-2">Name</th><th className="pb-2">College</th>
                <th className="pb-2">Bits</th><th className="pb-2">Status</th>
              </tr></thead>
              <tbody>
                {leaderboard.map((u, i) => (
                  <tr key={u.id} className="bg-[rgba(223,211,194,0.72)]">
                    <td className={`py-2 font-bold ${i === 0 ? "text-ghost-gold" : "text-[rgba(26,26,26,0.56)]"}`}>#{i + 1}</td>
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-[rgba(26,26,26,0.65)]">{u.college}</td>
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
            </div>
            {leaderboard.length === 0 && <p className="mt-4 text-sm text-[rgba(26,26,26,0.56)]">No participants yet.</p>}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
