import { useEffect, useState, useCallback } from "react";
import { http } from "../api/http";
import { getSocket } from "../socket/client";
import type { Matchup, EventState, LeaderboardEntry } from "../types";

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
  const [tab, setTab] = useState<
    "rounds" | "users" | "problems" | "leaderboard"
  >("rounds");
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success",
  );
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [roundMatchupCounts, setRoundMatchupCounts] = useState<
    Record<number, number>
  >({ 1: 0, 2: 0, 3: 0 });
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
  const [testCases, setTestCases] = useState<
    { input: string; expected: string; isHidden: boolean }[]
  >([]);

  const loadPending = useCallback(async () => {
    try {
      const { data } = await http.get<PendingUser[]>("/admin/pending-users");
      setPendingUsers(data);
    } catch {}
  }, []);
  const loadEventState = useCallback(async () => {
    try {
      const { data } = await http.get<EventState>("/round/event-state");
      setEventState(data);
    } catch {}
  }, []);
  const loadMatchups = useCallback(async (round: number) => {
    try {
      const { data } = await http.get<Matchup[]>(`/round/${round}/matchups`);
      setMatchups(data);
    } catch {}
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

  const loadLeaderboard = useCallback(async () => {
    try {
      const { data } = await http.get<LeaderboardEntry[]>(
        "/round/leaderboard/global",
      );
      setLeaderboard(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadPending();
    loadEventState();
    loadRoundMatchupCounts();
    loadLeaderboard();
  }, [loadPending, loadEventState, loadRoundMatchupCounts, loadLeaderboard]);

  useEffect(() => {
    setSelectedUserIds((prev) =>
      prev.filter((id) => pendingUsers.some((u) => u.id === id)),
    );
  }, [pendingUsers]);

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

    const handleExamRemove = (payload: {
      userId: string;
      roundNumber?: number;
    }) => {
      setExamStatuses((prev) =>
        prev.filter((s) => {
          if (s.userId !== payload.userId) return true;
          if (!payload.roundNumber) return false;
          return s.roundNumber !== payload.roundNumber;
        }),
      );
    };

    const handleTabSwitchAlert = (status: ExamStatus) => {
      flash(
        `Tab switch: ${status.userName} (R${status.roundNumber}, total ${status.tabSwitchCount})`,
        "error",
      );
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
    if (tab === "rounds" && eventState) loadMatchups(eventState.currentRound);
    if (tab === "rounds") loadRoundMatchupCounts();
    if (tab === "leaderboard") loadLeaderboard();
  }, [tab, eventState, loadMatchups, loadRoundMatchupCounts, loadLeaderboard]);

  // Polling for live updates (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadPending();
      loadEventState();

      if (tab === "rounds") {
        loadRoundMatchupCounts();
        if (eventState) loadMatchups(eventState.currentRound);
      }
      if (tab === "leaderboard") loadLeaderboard();
    }, 3000);

    return () => clearInterval(interval);
  }, [
    tab,
    eventState,
    loadPending,
    loadEventState,
    loadRoundMatchupCounts,
    loadMatchups,
    loadLeaderboard,
  ]);

  async function updateUser(userId: string, status: "APPROVED" | "REJECTED") {
    await http.patch(`/admin/users/${userId}`, { status });
    flash(`User ${status.toLowerCase()}.`, "success");
    await loadPending();
  }

  async function approveSelectedUsers() {
    if (selectedUserIds.length === 0) {
      flash("Select at least one user to approve.", "error");
      return;
    }

    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          http.patch(`/admin/users/${userId}`, { status: "APPROVED" }),
        ),
      );
      flash(`Approved ${selectedUserIds.length} user(s).`, "success");
      setSelectedUserIds([]);
      await loadPending();
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to approve selected users.",
        "error",
      );
    } finally {
      setBulkUpdating(false);
    }
  }

  const allPendingIds = pendingUsers.map((u) => u.id);
  const allSelected =
    pendingUsers.length > 0 && selectedUserIds.length === pendingUsers.length;

  function toggleSelectAll() {
    setSelectedUserIds(allSelected ? [] : allPendingIds);
  }

  function toggleSelectUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  async function startRound(n: number) {
    try {
      const { data } = await http.post("/admin/start-round", {
        roundNumber: n,
      });
      flash(data.message, "success");
      loadEventState();
      loadMatchups(n);
      loadRoundMatchupCounts();
      loadLeaderboard();
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed",
        "error",
      );
    }
  }

  async function resetRound(n: number) {
    if (
      !confirm(
        `Reset Round ${n}? This will delete ALL matchups for this round and un-eliminate affected users.`,
      )
    )
      return;
    try {
      const { data } = await http.post("/admin/reset-round", {
        roundNumber: n,
      });
      flash(data.message, "success");
      loadEventState();
      setMatchups([]);
      loadRoundMatchupCounts();
      loadLeaderboard();
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed",
        "error",
      );
    }
  }

  async function unblockParticipant(userId: string, roundNumber: number) {
    try {
      const { data } = await http.post<{ message: string }>(
        "/admin/proctoring/unblock",
        { userId, roundNumber },
      );
      flash(data.message, "success");
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to unblock participant.",
        "error",
      );
    }
  }

  async function createProblem() {
    try {
      await http.post("/problem", {
        title: pTitle,
        description: pDesc,
        difficulty: pDiff,
        roundNumber: pRound,
        starterCode: pStarter,
        timeLimit: pTimeLimit,
        testCases,
      });
      flash("Problem created.", "success");
      setPTitle("");
      setPDesc("");
      setPStarter("");
      setTestCases([]);
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed",
        "error",
      );
    }
  }

  async function extendTimer(matchupId: string) {
    const minStr = prompt("Enter extra minutes to add (e.g. 5):");
    if (!minStr) return;
    const extraMinutes = Number(minStr);
    if (isNaN(extraMinutes) || extraMinutes <= 0) {
      flash("Please enter a valid positive number for minutes.", "error");
      return;
    }

    try {
      const { data } = await http.post("/admin/extend-timer", {
        matchupId,
        extraMinutes,
      });
      flash(data.message, "success");
      if (eventState) loadMatchups(eventState.currentRound);
    } catch (err) {
      flash(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to extend timer.",
        "error",
      );
    }
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
    { id: "leaderboard" as const, label: "Leaderboard" },
  ];

  const activeParticipants = leaderboard.filter((u) => !u.eliminated).length;
  const eliminatedParticipants = leaderboard.filter((u) => u.eliminated).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 text-white md:px-8">
      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ghost-gold">
              Admin Control Panel
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage rounds, approvals, problems, quiz, and live standings.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <p className="text-gray-400">Round</p>
              <p className="font-semibold text-ghost-gold">
                {eventState?.currentRound ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <p className="text-gray-400">Active</p>
              <p className="font-semibold text-ghost-green">
                {activeParticipants}
              </p>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <p className="text-gray-400">Eliminated</p>
              <p className="font-semibold text-ghost-red">
                {eliminatedParticipants}
              </p>
            </div>
          </div>
        </div>

        {message && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${messageTone === "error" ? "bg-ghost-red/10 text-ghost-red" : "bg-ghost-green/10 text-ghost-green"}`}
          >
            {message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-b border-gray-800 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? "bg-ghost-gold/15 text-ghost-gold" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* ── ROUNDS ── */}
          {tab === "rounds" && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                <div className="rounded-xl bg-ghost-panel p-4">
                  <h2 className="text-lg font-semibold">Event State</h2>
                  {eventState ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-gray-300">
                        Round:{" "}
                        <span className="font-bold text-ghost-gold">
                          {eventState.currentRound}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Status:{" "}
                        <span className="font-bold">
                          {eventState.roundStatus}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      No event state yet.
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-ghost-panel p-4">
                  <h2 className="text-lg font-semibold">Round Controls</h2>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[1, 2, 3].map((n) => {
                      const isLive =
                        eventState?.currentRound === n &&
                        eventState?.roundStatus === "LIVE";
                      const hasExistingMatchups =
                        (roundMatchupCounts[n] ?? 0) > 0;
                      const canStart = !isLive && !hasExistingMatchups;
                      return (
                        <div key={n} className="rounded-lg bg-black/30 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-300">
                              Round {n}
                            </span>
                            {isLive && (
                              <span className="rounded bg-ghost-green/20 px-2 py-0.5 text-[11px] font-semibold text-ghost-green">
                                LIVE
                              </span>
                            )}
                            {!isLive && hasExistingMatchups && (
                              <span className="rounded bg-ghost-red/20 px-2 py-0.5 text-[11px] font-semibold text-ghost-red">
                                RESET REQUIRED
                              </span>
                            )}
                            {!isLive && !hasExistingMatchups && (
                              <span className="rounded bg-gray-700/70 px-2 py-0.5 text-[11px] font-semibold text-gray-300">
                                READY
                              </span>
                            )}
                          </div>
                          <p className="mb-3 text-xs text-gray-500">
                            Matchups: {roundMatchupCounts[n] ?? 0}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="flex-1 rounded bg-ghost-gold px-3 py-1.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => startRound(n)}
                              disabled={!canStart}
                            >
                              Start
                            </button>
                            <button
                              className="flex-1 rounded bg-ghost-gold/80 px-3 py-1.5 text-sm font-semibold text-black hover:bg-ghost-gold"
                              onClick={() => resetRound(n)}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Start is blocked if the round already has matchups. Use
                    Reset first to clear stale pairings before restarting.
                  </p>
                </div>
              </div>

              {/* Matchups */}
              {matchups.length > 0 && (
                <div className="rounded-xl bg-ghost-panel p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Matchups (Round {eventState?.currentRound})
                    </h2>
                    <button
                      className="text-sm text-ghost-gold"
                      onClick={() =>
                        loadMatchups(eventState?.currentRound ?? 1)
                      }
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {matchups.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-col gap-3 rounded-lg bg-black/30 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={
                              m.winner?.id === m.user1.id
                                ? "font-bold text-ghost-green"
                                : ""
                            }
                          >
                            {m.user1.name}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span
                            className={
                              m.winner?.id === m.user2.id
                                ? "font-bold text-ghost-green"
                                : ""
                            }
                          >
                            {m.user2.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm md:justify-end">
                          <span className="text-gray-400">
                            {m.problem.title}
                          </span>
                          {m.status === "COMPLETED" &&
                            !m.winner &&
                            m.user1.eliminatedAt &&
                            m.user2.eliminatedAt && (
                              <span className="rounded bg-ghost-red/20 px-2 py-0.5 text-xs font-semibold text-ghost-red">
                                BOTH ELIMINATED
                              </span>
                            )}
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              m.status === "LIVE"
                                ? "bg-ghost-green/20 text-ghost-green"
                                : m.status === "COMPLETED"
                                  ? "bg-gray-700 text-gray-300"
                                  : "bg-ghost-gold/20 text-ghost-gold"
                            }`}
                          >
                            {m.status}
                          </span>
                          {m.status === "LIVE" && (
                            <button
                              className="ml-2 rounded bg-ghost-gold/20 px-2 py-0.5 text-xs text-ghost-gold hover:bg-ghost-gold hover:text-black"
                              onClick={() => extendTimer(m.id)}
                              title="Extend Timer"
                            >
                              +Time
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-ghost-panel p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Proctoring: Fullscreen Status
                  </h2>
                  <span className="text-xs text-gray-500">Live via socket</span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left text-gray-400">
                        <th className="pb-2">Participant</th>
                        <th className="pb-2">Round</th>
                        <th className="pb-2">Fullscreen</th>
                        <th className="pb-2">Tab Switches</th>
                        <th className="pb-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examStatuses.map((s) => (
                        <tr
                          key={`${s.userId}:${s.roundNumber}`}
                          className="border-b border-gray-800"
                        >
                          <td className="py-2 font-medium">{s.userName}</td>
                          <td className="py-2 text-gray-300">
                            {s.roundNumber}
                          </td>
                          <td className="py-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs ${s.banned ? "bg-ghost-red/30 text-ghost-red" : s.fullscreen ? "bg-ghost-green/20 text-ghost-green" : "bg-ghost-red/20 text-ghost-red"}`}
                            >
                              {s.banned
                                ? "BANNED"
                                : s.fullscreen
                                  ? "In Fullscreen"
                                  : "Not Fullscreen"}
                            </span>
                          </td>
                          <td
                            className={`py-2 font-mono ${s.tabSwitchCount > 0 ? "text-ghost-red" : "text-ghost-gold"}`}
                          >
                            {s.tabSwitchCount}
                          </td>
                          <td className="py-2">
                            {s.banned ? (
                              <button
                                className="rounded bg-ghost-gold px-3 py-1 text-xs font-semibold text-black"
                                onClick={() =>
                                  unblockParticipant(s.userId, s.roundNumber)
                                }
                              >
                                Unblock
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Monitoring
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {examStatuses.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">
                    No participant proctoring data yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div className="rounded-xl bg-ghost-panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pending Users</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded bg-ghost-gold px-3 py-1 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={approveSelectedUsers}
                    disabled={bulkUpdating || selectedUserIds.length === 0}
                  >
                    {bulkUpdating
                      ? "Approving..."
                      : `Approve Selected (${selectedUserIds.length})`}
                  </button>
                  <button
                    className="text-sm text-ghost-gold"
                    onClick={loadPending}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {pendingUsers.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                  <input
                    id="select-all-pending"
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <label htmlFor="select-all-pending" className="select-none">
                    Select all pending users
                  </label>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 rounded-lg bg-black/30 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-gray-400">
                          {u.email} — {u.college}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded bg-ghost-gold px-3 py-1 text-sm text-black"
                        onClick={() => updateUser(u.id, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded bg-ghost-gold/80 px-3 py-1 text-sm text-black hover:bg-ghost-gold"
                        onClick={() => updateUser(u.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && (
                  <p className="text-sm text-gray-500">No pending users.</p>
                )}
              </div>
            </div>
          )}

          {/* ── PROBLEMS ── */}
          {tab === "problems" && (
            <div className="rounded-xl bg-ghost-panel p-4">
              <h2 className="text-lg font-semibold">Create Problem</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <input
                    className="mt-1 w-full rounded bg-black/40 p-2"
                    value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex-1">
                    <label className="text-sm text-gray-400">Round</label>
                    <select
                      className="mt-1 w-full rounded bg-black/40 p-2"
                      value={pRound}
                      onChange={(e) => setPRound(Number(e.target.value))}
                    >
                      <option value={1}>Round 1</option>
                      <option value={2}>Round 2</option>
                      <option value={3}>Round 3</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-400">Difficulty</label>
                    <select
                      className="mt-1 w-full rounded bg-black/40 p-2"
                      value={pDiff}
                      onChange={(e) => setPDiff(e.target.value)}
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-400">Time (s)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded bg-black/40 p-2"
                      value={pTimeLimit}
                      onChange={(e) => setPTimeLimit(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-400">Description</label>
                <textarea
                  className="mt-1 w-full rounded bg-black/40 p-2"
                  rows={5}
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-400">Starter Code</label>
                <textarea
                  className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm"
                  rows={4}
                  value={pStarter}
                  onChange={(e) => setPStarter(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-ghost-gold">
                  Test Cases ({testCases.length})
                </h3>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-400">Input</label>
                    <textarea
                      className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm"
                      rows={2}
                      value={tcInput}
                      onChange={(e) => setTcInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">
                      Expected Output
                    </label>
                    <textarea
                      className="mt-1 w-full rounded bg-black/40 p-2 font-mono text-sm"
                      rows={2}
                      value={tcExpected}
                      onChange={(e) => setTcExpected(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={tcHidden}
                      onChange={(e) => setTcHidden(e.target.checked)}
                    />{" "}
                    Hidden
                  </label>
                  <button
                    className="rounded bg-ghost-gold/80 px-3 py-1 text-sm text-black hover:bg-ghost-gold"
                    onClick={() => {
                      setTestCases([
                        ...testCases,
                        {
                          input: tcInput,
                          expected: tcExpected,
                          isHidden: tcHidden,
                        },
                      ]);
                      setTcInput("");
                      setTcExpected("");
                    }}
                  >
                    Add Test Case
                  </button>
                </div>
                {testCases.map((tc, i) => (
                  <div
                    key={i}
                    className="mt-1 flex items-center justify-between rounded bg-black/20 px-3 py-1 text-xs font-mono"
                  >
                    <span>
                      In: {tc.input.slice(0, 30)} | Out:{" "}
                      {tc.expected.slice(0, 30)} {tc.isHidden ? "(hidden)" : ""}
                    </span>
                    <button
                      className="text-ghost-gold"
                      onClick={() =>
                        setTestCases(testCases.filter((_, j) => j !== i))
                      }
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 rounded bg-ghost-gold px-4 py-2 font-semibold text-black"
                onClick={createProblem}
              >
                Create Problem
              </button>
            </div>
          )}

          {/* ── LEADERBOARD ── */}
          {tab === "leaderboard" && (
            <div className="rounded-xl bg-ghost-panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Global Leaderboard</h2>
                <button
                  className="text-sm text-ghost-gold"
                  onClick={loadLeaderboard}
                >
                  Refresh
                </button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-left text-gray-400">
                      <th className="pb-2">Rank</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">College</th>
                      <th className="pb-2">Bits</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((u, i) => (
                      <tr key={u.id} className="border-b border-gray-800">
                        <td
                          className={`py-2 font-bold ${i === 0 ? "text-ghost-gold" : "text-gray-500"}`}
                        >
                          #{i + 1}
                        </td>
                        <td className="py-2 font-medium">{u.name}</td>
                        <td className="py-2 text-gray-400">{u.college}</td>
                        <td className="py-2 font-mono text-ghost-gold">
                          {u.bits}
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${u.eliminated ? "bg-ghost-red/20 text-ghost-red" : "bg-ghost-green/20 text-ghost-green"}`}
                          >
                            {u.eliminated ? "Eliminated" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {leaderboard.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  No participants yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
