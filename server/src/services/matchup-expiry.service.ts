import type { Server as SocketIOServer } from "socket.io";
import { MatchupStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const ROUND_DURATIONS_SECONDS: Record<number, number> = {
  1: 15 * 60,
  2: 30 * 60,
};

function isExpired(matchup: { roundNumber: number; startedAt: Date | null; timerExtension: number | null }) {
  const base = ROUND_DURATIONS_SECONDS[matchup.roundNumber];
  if (!base || !matchup.startedAt) return false;

  const totalSeconds = base + (matchup.timerExtension || 0);
  // 10s grace for latency/sync (kept consistent with timeout endpoint)
  const expiresAtMs = matchup.startedAt.getTime() + totalSeconds * 1000 + 10_000;
  return Date.now() >= expiresAtMs;
}

export function startMatchupExpiryWorker(io: SocketIOServer) {
  let running = false;

  const interval = setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const live = await prisma.matchup.findMany({
        where: {
          roundNumber: { in: [1, 2] },
          status: MatchupStatus.LIVE,
        },
        select: {
          id: true,
          roundNumber: true,
          startedAt: true,
          timerExtension: true,
          winnerId: true,
          user1Id: true,
          user2Id: true,
        },
      });

      const expired = live.filter((m) => !m.winnerId && isExpired(m));
      if (expired.length === 0) return;

      for (const m of expired) {
        const endedAt = new Date();

        const updated = await prisma.$transaction(async (tx) => {
          const claim = await tx.matchup.updateMany({
            where: {
              id: m.id,
              status: MatchupStatus.LIVE,
              winnerId: null,
            },
            data: {
              status: MatchupStatus.COMPLETED,
              endedAt,
            },
          });

          if (claim.count === 0) return false;

          await tx.user.updateMany({
            where: { id: { in: [m.user1Id, m.user2Id] }, eliminatedAt: null },
            data: { eliminatedAt: endedAt },
          });

          return true;
        });

        if (updated) {
          io.to(`matchup:${m.id}`).emit("matchup:result", {
            matchupId: m.id,
            winnerId: null,
            loserId: null,
          });
        }
      }
    } catch {
      // keep worker best-effort; avoid crashing server
    } finally {
      running = false;
    }
  }, 10_000);

  return () => clearInterval(interval);
}
