import { Request, Response } from "express";
import { MatchupStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { runAgainstProblem } from "../services/judging.service.js";
import { getIO } from "../socket/index.js";

export async function runCode(req: Request, res: Response) {
  try {
    const { problemId, language, code } = req.body as {
      problemId: string;
      language: string;
      code: string;
    };
    const result = await runAgainstProblem(problemId, language, code);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function submitCode(req: Request, res: Response) {
  try {
    const { problemId, language, code, matchupId } = req.body as {
      problemId: string;
      language: string;
      code: string;
      matchupId?: string;
    };

    const userId = req.auth!.userId;
    const judged = await runAgainstProblem(problemId, language, code);

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        language,
        code,
        status: judged.accepted ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
        passedTests: judged.passedTests,
        totalTests: judged.totalTests,
      },
    });

    const io = getIO();

    // If matchup provided, check for winner resolution
    if (matchupId) {
      const matchup = await prisma.matchup.findUnique({ where: { id: matchupId } });

      if (!matchup) {
        return res.status(404).json({ message: "Matchup not found." });
      }

      if (matchup.user1Id !== userId && matchup.user2Id !== userId) {
        return res.status(403).json({ message: "You are not part of this matchup." });
      }

      if (matchup.problemId !== problemId) {
        return res.status(400).json({ message: "Submitted problem does not match matchup problem." });
      }

      if (matchup && matchup.status === MatchupStatus.LIVE && !matchup.winnerId) {
        const opponentId = matchup.user1Id === userId ? matchup.user2Id : matchup.user1Id;

        if (judged.accepted) {
          // Claim victory in a single transaction so winner update and bits award stay consistent.
          const result = await prisma.$transaction(async (tx) => {
            const endedAt = new Date();
            const claim = await tx.matchup.updateMany({
              where: {
                id: matchupId,
                status: MatchupStatus.LIVE,
                winnerId: null,
              },
              data: {
                winnerId: userId,
                status: MatchupStatus.COMPLETED,
                endedAt,
              },
            });

            if (claim.count === 0) {
              return null;
            }

            await tx.user.update({
              where: { id: opponentId },
              data: { eliminatedAt: endedAt },
            });

            await tx.user.update({
              where: { id: userId },
              data: { bits: { increment: 100 } },
            });

            return { winnerId: userId, loserId: opponentId };
          });

          if (result) {
            io.to(`matchup:${matchupId}`).emit("matchup:result", {
              matchupId,
              winnerId: result.winnerId,
              loserId: result.loserId,
            });
          }
        }
      }

      io.to(`matchup:${matchupId}`).emit("submission:result", {
        userId,
        accepted: judged.accepted,
        passedTests: judged.passedTests,
        totalTests: judged.totalTests,
      });
    }

    return res.status(201).json({
      submissionId: submission.id,
      accepted: judged.accepted,
      passedTests: judged.passedTests,
      totalTests: judged.totalTests,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function handleTimeout(req: Request, res: Response) {
  try {
    const { matchupId } = req.body as { matchupId: string };
    const userId = req.auth!.userId;

    const matchup = await prisma.matchup.findUnique({
      where: { id: matchupId },
      include: {
        user1: true,
        user2: true,
      }
    });

    if (!matchup) {
      return res.status(404).json({ message: "Matchup not found." });
    }

    // Determine round duration
    const ROUND_DURATIONS: Record<number, number> = {
      1: 15 * 60,
      2: 30 * 60,
    };

    const baseDuration = ROUND_DURATIONS[matchup.roundNumber];
    if (!baseDuration) {
      return res.status(400).json({ message: "This round does not support timeout elimination." });
    }

    if (!matchup.startedAt) {
      return res.status(400).json({ message: "Matchup not started." });
    }

    const totalSeconds = baseDuration + (matchup.timerExtension || 0);
    // Add 10 seconds grace period for network latency and sync
    const expiresAt = new Date(matchup.startedAt.getTime() + (totalSeconds * 1000) + 10000);

    if (Date.now() < expiresAt.getTime()) {
      return res.status(400).json({ message: "Time is not up yet." });
    }

    // Eliminate user
    await prisma.user.update({
      where: { id: userId },
      data: { eliminatedAt: new Date() },
    });

    // Check if opponent is already eliminated. Check the latest state from DB (or use loaded relation if sufficient, but safer to re-query or check loaded object)
    // The matchup object has user1 and user2 loaded. However, their status might have changed since loading if concurrent request.
    const opponentId = matchup.user1Id === userId ? matchup.user2Id : matchup.user1Id;
    const opponent = await prisma.user.findUnique({ where: { id: opponentId } });

    if (opponent && opponent.eliminatedAt) {
      await prisma.matchup.update({
        where: { id: matchupId },
        data: {
          status: MatchupStatus.COMPLETED,
          winnerId: null,
          endedAt: new Date(),
        },
      });
      // Notify clients that matchup is over
      const io = getIO();
      io.to(`matchup:${matchupId}`).emit("matchup:result", {
        matchupId,
        winnerId: null,
        loserId: null, // Both lost
      });
    }

    return res.json({ message: "User eliminated due to timeout." });

  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getMatchupSubmissions(req: Request, res: Response) {
  const matchupId = String(req.params.matchupId);
  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: { problem: true },
  });
  if (!matchup) {
    return res.status(404).json({ message: "Matchup not found." });
  }

  const submissions = await prisma.submission.findMany({
    where: { problemId: matchup.problemId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return res.json(submissions);
}
