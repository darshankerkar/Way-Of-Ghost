export type Role = "PARTICIPANT" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MatchupStatus = "PENDING" | "LIVE" | "COMPLETED";
export type RoundStatus = "NOT_STARTED" | "LIVE" | "COMPLETED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  bits: number;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  roundNumber: number;
  hint?: string;
  starterCode: string;
  timeLimit: number;
  testCases?: TestCase[];
};

export type TestCase = {
  id: string;
  input: string;
  expected: string;
  isHidden: boolean;
};

export type Matchup = {
  id: string;
  roundNumber: number;
  user1: { id: string; name: string; eliminatedAt: string | null };
  user2: { id: string; name: string; eliminatedAt: string | null };
  winner?: { id: string; name: string } | null;
  problem: { id: string; title: string; difficulty: string; timeLimit: number };
  status: MatchupStatus;
  startedAt: string | null;
  endedAt: string | null;
  timerExtension: number;
};

export type EventState = {
  id: string;
  currentRound: number;
  roundStatus: RoundStatus;
};

export type QuizQuestion = {
  id: string;
  questionText: string;
  codeSnippet: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  points: number;
  roundNumber: number;
};

export type QuizPushedQuestion = {
  id: string;
  questionText: string;
  codeSnippet: string;
  options: string[];
  timeLimit: number;
  points: number;
};

export type SubmissionResult = {
  submissionId?: string;
  accepted: boolean;
  passedTests: number;
  totalTests: number;
  details?: { input: string; expected: string; got: string; pass: boolean }[];
};

export type RunResult = {
  passedTests: number;
  totalTests: number;
  accepted: boolean;
  details?: { input: string; expected: string; got: string; pass: boolean }[];
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  college: string;
  bits: number;
  eliminated: boolean;
};
