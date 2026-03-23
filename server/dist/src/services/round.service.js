import { MatchupStatus, RoundStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export async function startRound(roundNumber) {
    // Guard: check if this round already has LIVE matchups
    if (roundNumber === 1 || roundNumber === 2) {
        const existingLive = await prisma.matchup.count({
            where: { roundNumber, status: MatchupStatus.LIVE },
        });
        if (existingLive > 0) {
            throw new Error(`Round ${roundNumber} already has ${existingLive} active matchup(s). Reset the round first before restarting.`);
        }
    }
    // Get approved, non-eliminated participants
    const users = await prisma.user.findMany({
        where: {
            role: "PARTICIPANT",
            status: "APPROVED",
            eliminatedAt: null,
        },
    });
    if (users.length < 2 && (roundNumber === 1 || roundNumber === 2)) {
        throw new Error("Need at least 2 active participants to start round.");
    }
    if (roundNumber === 1 || roundNumber === 2) {
        const problems = await prisma.problem.findMany({ where: { roundNumber } });
        if (problems.length === 0) {
            throw new Error(`No problems configured for round ${roundNumber}.`);
        }
        const list = shuffle(users);
        const pairings = [];
        for (let i = 0; i + 1 < list.length; i += 2) {
            pairings.push({
                user1Id: list[i].id,
                user2Id: list[i + 1].id,
                problemId: problems[Math.floor(Math.random() * problems.length)].id,
                roundNumber,
                status: MatchupStatus.LIVE,
                startedAt: new Date(),
            });
        }
        if (pairings.length > 0) {
            await prisma.matchup.createMany({ data: pairings });
        }
    }
    // Round 3 is MVP - no matchups needed, just display problems
    return prisma.eventState.upsert({
        where: { id: "singleton" },
        update: { currentRound: roundNumber, roundStatus: RoundStatus.LIVE },
        create: {
            id: "singleton",
            currentRound: roundNumber,
            roundStatus: RoundStatus.LIVE,
        },
    });
}
export async function resetRound(roundNumber) {
    if (roundNumber === 1) {
        // Hard reset for a fresh tournament restart.
        const [deletedMatchups] = await prisma.$transaction([
            prisma.matchup.deleteMany({}),
            prisma.submission.deleteMany({}),
            prisma.proctoringStatus.deleteMany({}),
            prisma.user.updateMany({
                where: { role: "PARTICIPANT" },
                data: { bits: 0, eliminatedAt: null },
            }),
            prisma.eventState.upsert({
                where: { id: "singleton" },
                update: { currentRound: 1, roundStatus: RoundStatus.NOT_STARTED },
                create: { id: "singleton", currentRound: 1, roundStatus: RoundStatus.NOT_STARTED },
            }),
        ]);
        return { deleted: deletedMatchups.count };
    }
    if (roundNumber === 2) {
        // Find all users who were eliminated in round 2
        const round2Matchups = await prisma.matchup.findMany({ where: { roundNumber: 2 } });
        const round2LoserIds = [];
        for (const m of round2Matchups) {
            if (m.winnerId) {
                round2LoserIds.push(m.user1Id === m.winnerId ? m.user2Id : m.user1Id);
            }
        }
        await prisma.$transaction([
            prisma.submission.deleteMany({ where: { problem: { roundNumber: 2 } } }),
            prisma.matchup.deleteMany({ where: { roundNumber: 2 } }),
            prisma.proctoringStatus.deleteMany({ where: { roundNumber: 2 } }),
            prisma.eventState.upsert({
                where: { id: "singleton" },
                update: { currentRound: 2, roundStatus: RoundStatus.NOT_STARTED },
                create: { id: "singleton", currentRound: 2, roundStatus: RoundStatus.NOT_STARTED },
            }),
            // Un-eliminate the users who lost in Round 2
            prisma.user.updateMany({
                where: { id: { in: round2LoserIds } },
                data: { eliminatedAt: null },
            }),
        ]);
        // Recalculate bits from surviving data (round 1 wins).
        const participants = await prisma.user.findMany({
            where: { role: "PARTICIPANT" },
            select: { id: true },
        });
        const bitsByUser = new Map();
        for (const p of participants)
            bitsByUser.set(p.id, 0);
        const round1Winners = await prisma.matchup.groupBy({
            by: ["winnerId"],
            where: { roundNumber: 1, winnerId: { not: null } },
            _count: { winnerId: true },
        });
        for (const row of round1Winners) {
            if (!row.winnerId)
                continue;
            const prev = bitsByUser.get(row.winnerId) ?? 0;
            bitsByUser.set(row.winnerId, prev + (row._count.winnerId ?? 0) * 100);
        }
        await prisma.$transaction([...bitsByUser.entries()].map(([userId, bits]) => prisma.user.update({ where: { id: userId }, data: { bits } })));
        return { deleted: round2Matchups.length };
    }
    const deleted = await prisma.matchup.deleteMany({ where: { roundNumber } });
    await prisma.proctoringStatus.deleteMany({ where: { roundNumber } });
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: { currentRound: roundNumber, roundStatus: RoundStatus.NOT_STARTED },
        create: { id: "singleton", currentRound: roundNumber, roundStatus: RoundStatus.NOT_STARTED },
    });
    return { deleted: deleted.count };
}
