import { useEffect, useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { http } from "../api/http";
import { useAuthStore } from "../store/auth.store";
import { getSocket } from "../socket/client";
import type { Matchup, Problem, RunResult, SubmissionResult } from "../types";

const LANGUAGES = [
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "C++", value: "c++" },
];

const ROUND_DURATION = 15 * 60;

export function Round1Page() {
  const user = useAuthStore((s) => s.user);
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("java");
  const [output, setOutput] = useState<RunResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [matchResult, setMatchResult] = useState<{ winnerId: string; loserId: string } | null>(null);
  const [opponentStatus, setOpponentStatus] = useState("");
  const [runError, setRunError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatchup = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await http.get<Matchup[]>("/round/1/matchups");

      // Find only this user's matchups in backend-provided order (latest first)
      const myMatches = data.filter(
        (m) => m.user1.id === user.id || m.user2.id === user.id
      );

      // Always prefer the newest LIVE matchup; otherwise use the newest available matchup.
      const liveMatch = myMatches.find((m) => m.status === "LIVE");
      const myMatch = liveMatch ?? myMatches[0] ?? null;

      if (myMatch) {
        // Reset all state when matchup changes
        setMatchup((prev) => {
          if (prev?.id !== myMatch.id) {
            setOutput(null);
            setSubmissionResult(null);
            setMatchResult(null);
            setOpponentStatus("");
            setRunError("");
          }
          return myMatch;
        });

        const { data: problems } = await http.get<Problem[]>("/problem?round=1");
        const p = problems.find((pr) => pr.id === myMatch.problem.id);
        if (p) {
          setProblem(p);
          setCode(p.starterCode || "");
        }

        // Calculate timer from latest matchup's startedAt
        if (myMatch.startedAt && myMatch.status === "LIVE") {
          const elapsed = Math.floor(
            (Date.now() - new Date(myMatch.startedAt).getTime()) / 1000
          );
          setTimeLeft(Math.max(0, ROUND_DURATION - elapsed));
        } else if (myMatch.status === "COMPLETED") {
          setTimeLeft(0);
          if (myMatch.winner) {
            const loserId = myMatch.winner.id === myMatch.user1.id ? myMatch.user2.id : myMatch.user1.id;
            setMatchResult({ winnerId: myMatch.winner.id, loserId });
          }
        }
      } else {
        // No matchup found — reset everything
        setMatchup(null);
        setProblem(null);
        setCode("");
        setOutput(null);
        setSubmissionResult(null);
        setMatchResult(null);
        setOpponentStatus("");
        setRunError("");
        setTimeLeft(ROUND_DURATION);
      }
    } catch { /* no matchup yet */ }
  }, [user]);

  // Initial fetch
  useEffect(() => { fetchMatchup(); }, [fetchMatchup]);

  // Safety poll to pick up latest matchup/problem after admin restarts round.
  useEffect(() => {
    const id = setInterval(() => {
      fetchMatchup();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchMatchup]);

  // Listen for round:started and round:reset to re-fetch matchup
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoundStarted = (data: { roundNumber: number }) => {
      if (data.roundNumber === 1) fetchMatchup();
    };
    const handleRoundReset = (data: { roundNumber: number }) => {
      if (data.roundNumber === 1) {
        // Clear everything and re-fetch
        if (timerRef.current) clearInterval(timerRef.current);
        setMatchup(null);
        setProblem(null);
        setCode("");
        setOutput(null);
        setSubmissionResult(null);
        setMatchResult(null);
        setOpponentStatus("");
        setRunError("");
        setTimeLeft(ROUND_DURATION);
        fetchMatchup();
      }
    };

    socket.on("round:started", handleRoundStarted);
    socket.on("round:reset", handleRoundReset);
    return () => {
      socket.off("round:started", handleRoundStarted);
      socket.off("round:reset", handleRoundReset);
    };
  }, [fetchMatchup]);

  // Timer — uses matchup.id as key so it resets when matchup changes
  useEffect(() => {
    if (!matchup || matchup.status !== "LIVE") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [matchup?.id, matchup?.status]);

  // Socket: join matchup room for live updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !matchup) return;

    socket.emit("room:join", `matchup:${matchup.id}`);

    const handleResult = (data: { matchupId: string; winnerId: string; loserId: string }) => {
      if (data.matchupId === matchup.id) setMatchResult(data);
    };
    const handleSubResult = (data: { userId: string; accepted: boolean; passedTests: number; totalTests: number }) => {
      if (data.userId !== user?.id) {
        setOpponentStatus(data.accepted ? "Solved it!" : `${data.passedTests}/${data.totalTests} passed`);
      }
    };

    socket.on("matchup:result", handleResult);
    socket.on("submission:result", handleSubResult);
    return () => {
      socket.emit("room:leave", `matchup:${matchup.id}`);
      socket.off("matchup:result", handleResult);
      socket.off("submission:result", handleSubResult);
    };
  }, [matchup?.id, user]);

  async function handleRun() {
    if (!problem) return;
    setLoading(true);
    setOutput(null);
    setRunError("");
    try {
      const { data } = await http.post<RunResult>("/submission/run", { problemId: problem.id, language, code });
      setOutput(data);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Execution failed";
      setRunError(msg);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!problem || !matchup) return;
    setLoading(true);
    setSubmissionResult(null);
    setRunError("");
    try {
      const { data } = await http.post<SubmissionResult>("/submission/submit", {
        problemId: problem.id, language, code, matchupId: matchup.id,
      });
      setSubmissionResult(data);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Submission failed";
      setRunError(msg);
    }
    setLoading(false);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const opponent = matchup
    ? (matchup.user1.id === user?.id ? matchup.user2 : matchup.user1)
    : null;

  if (!matchup || !problem) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ghost-gold">Round 1 — Shadow Tactics</h1>
          <p className="mt-4 text-gray-400">Waiting for your matchup to be assigned...</p>
          <p className="mt-1 text-sm text-gray-600">The admin will start the round and pair you with an opponent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col text-white">
      {/* Win/lose overlay */}
      {matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className={`rounded-lg p-12 text-center ${
            matchResult.winnerId === user?.id
              ? "border-2 border-ghost-green shadow-[0_0_40px_rgba(46,204,113,0.5)]"
              : "border-2 border-ghost-red shadow-[0_0_40px_rgba(231,76,60,0.5)]"
          }`}>
            <h2 className="text-5xl font-bold">
              {matchResult.winnerId === user?.id
                ? <span className="text-ghost-green">VICTORY</span>
                : <span className="text-ghost-red">DEFEATED</span>}
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              {matchResult.winnerId === user?.id ? "You advance!" : "Better luck next time."}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-ghost-panel px-6 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">You vs</span>
          <span className="font-semibold text-ghost-red">{opponent?.name ?? "???"}</span>
          {opponentStatus && <span className="text-xs text-gray-500">({opponentStatus})</span>}
        </div>
        <div className={`rounded px-4 py-1 font-mono text-xl font-bold ${
          timeLeft <= 60 ? "animate-pulse bg-ghost-red/20 text-ghost-red" : "text-ghost-gold"
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Problem panel */}
        <div className="w-[400px] overflow-y-auto border-r border-gray-800 p-4">
          <h2 className="text-xl font-bold">{problem.title}</h2>
          <span className="mt-1 inline-block rounded bg-ghost-gold/20 px-2 py-0.5 text-xs text-ghost-gold">
            {matchup.problem.difficulty}
          </span>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {problem.description}
          </div>
          {(!problem.testCases || problem.testCases.length === 0) && (
            <div className="mt-4 rounded border border-ghost-red/40 bg-ghost-red/10 p-3 text-xs text-ghost-red">
              This problem currently has no test cases configured. Run/Submit may show 0/0 until admins add test cases.
            </div>
          )}
          {problem.testCases && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ghost-gold">Sample Test Cases</h3>
              {problem.testCases.filter((tc) => !tc.isHidden).map((tc, i) => (
                <div key={tc.id} className="mt-2 rounded bg-black/40 p-2 text-xs font-mono">
                  <p className="text-gray-400">Input {i + 1}:</p>
                  <pre className="text-white">{tc.input}</pre>
                  <p className="mt-1 text-gray-400">Expected:</p>
                  <pre className="text-ghost-green">{tc.expected}</pre>
                </div>
              ))}
              {problem.testCases.filter((tc) => !tc.isHidden).length === 0 && (
                <p className="mt-2 text-xs text-gray-500">No public sample test cases available.</p>
              )}
            </div>
          )}
        </div>

        {/* Editor + output */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-gray-800 bg-ghost-panel px-4 py-2">
            <select className="rounded bg-black/40 px-3 py-1 text-sm text-white" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <button className="rounded bg-ghost-gold/80 px-4 py-1.5 text-sm font-semibold text-black hover:bg-ghost-gold disabled:opacity-50"
                onClick={handleRun} disabled={loading || timeLeft === 0}>
                {loading ? "Running..." : "Run"}
              </button>
              <button className="rounded bg-ghost-gold px-4 py-1.5 text-sm font-semibold text-black hover:bg-ghost-gold/90 disabled:opacity-50"
                onClick={handleSubmit} disabled={loading || timeLeft === 0}>
                Submit
              </button>
            </div>
          </div>

          <div className="flex-1">
            <Editor height="100%" language={language === "c++" ? "cpp" : language} value={code}
              onChange={(v) => setCode(v ?? "")} theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
            />
          </div>

          {/* Output */}
          <div className="h-[200px] overflow-y-auto border-t border-gray-800 bg-black/30 p-4">
            <h3 className="text-sm font-semibold text-gray-400">Output</h3>
            {output && (
              <div className="mt-2">
                <p className={`text-sm font-semibold ${output.accepted ? "text-ghost-green" : "text-ghost-red"}`}>
                  {output.accepted ? "All tests passed!" : `${output.passedTests}/${output.totalTests} tests passed`}
                </p>
                {output.details?.map((d, i) => (
                  <div key={i} className={`mt-2 rounded border p-2 text-xs font-mono ${d.pass ? "border-ghost-green/30" : "border-ghost-red/30"}`}>
                    <p className="text-gray-400">Input: <span className="text-white">{d.input}</span></p>
                    <p className="text-gray-400">Expected: <span className="text-ghost-green">{d.expected}</span></p>
                    <p className="text-gray-400">Got: <span className={d.pass ? "text-ghost-green" : "text-ghost-red"}>{d.got || "(empty)"}</span></p>
                  </div>
                ))}
              </div>
            )}
            {submissionResult && (
              <div className="mt-2 rounded border border-gray-700 p-2">
                <p className={`text-sm font-bold ${submissionResult.accepted ? "text-ghost-green" : "text-ghost-red"}`}>
                  Submission: {submissionResult.accepted ? "ACCEPTED" : "REJECTED"}
                </p>
                <p className="text-xs text-gray-400">{submissionResult.passedTests}/{submissionResult.totalTests} tests passed</p>
              </div>
            )}
            {runError && (
              <div className="mt-2 rounded border border-ghost-red/40 bg-ghost-red/10 p-3">
                <p className="text-sm font-semibold text-ghost-red">Error</p>
                <p className="mt-1 text-xs text-gray-300">{runError}</p>
              </div>
            )}
            {!output && !submissionResult && !runError && <p className="mt-2 text-xs text-gray-500">Run your code to see results here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
