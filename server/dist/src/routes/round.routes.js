import { Router } from "express";
import { getEventState, getMyProctoringStatus, getRoundMatchups, getRoundProblems, leaderboard } from "../controllers/round.controller.js";
import { requireAuth } from "../middleware/auth.js";
export const roundRouter = Router();
roundRouter.get("/event-state", getEventState);
roundRouter.get("/:roundNumber/matchups", requireAuth, getRoundMatchups);
roundRouter.get("/:roundNumber/problems", requireAuth, getRoundProblems);
roundRouter.get("/:roundNumber/proctoring/me", requireAuth, getMyProctoringStatus);
roundRouter.get("/leaderboard/global", leaderboard);
