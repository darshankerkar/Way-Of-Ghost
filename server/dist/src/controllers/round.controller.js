import { prisma } from "../config/prisma.js";
export async function getEventState(_req, res) {
    const event = await prisma.eventState.findUnique({ where: { id: "singleton" } });
    return res.json(event);
}
export async function getRoundMatchups(req, res) {
    const roundNumber = Number(req.params.roundNumber);
    const matchups = await prisma.matchup.findMany({
        where: { roundNumber },
        include: {
            user1: { select: { id: true, name: true, eliminatedAt: true } },
            user2: { select: { id: true, name: true, eliminatedAt: true } },
            winner: { select: { id: true, name: true } },
            problem: { select: { id: true, title: true, difficulty: true, timeLimit: true } },
        },
        orderBy: { startedAt: "desc" },
    });
    return res.json(matchups);
}
export async function leaderboard(_req, res) {
    const users = await prisma.user.findMany({
        where: { role: "PARTICIPANT", status: "APPROVED" },
        orderBy: [{ bits: "desc" }, { updatedAt: "asc" }],
        select: {
            id: true,
            name: true,
            college: true,
            bits: true,
            eliminatedAt: true,
        },
    });
    return res.json(users.map((u) => ({
        id: u.id,
        name: u.name,
        college: u.college,
        bits: u.bits,
        eliminated: !!u.eliminatedAt,
    })));
}
export async function getRoundProblems(req, res) {
    const roundNumber = Number(req.params.roundNumber);
    const problems = await prisma.problem.findMany({
        where: { roundNumber },
        select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            starterCode: true,
            timeLimit: true,
        },
        orderBy: { createdAt: "asc" },
    });
    return res.json(problems);
}
export async function getMyProctoringStatus(req, res) {
    const roundNumber = Number(req.params.roundNumber);
    if (![1, 2, 3].includes(roundNumber)) {
        return res.status(400).json({ message: "Invalid round number." });
    }
    const userId = req.auth?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const status = await prisma.proctoringStatus.findUnique({
        where: { userId_roundNumber: { userId, roundNumber } },
        select: {
            roundNumber: true,
            fullscreen: true,
            tabSwitchCount: true,
            warned: true,
            banned: true,
        },
    });
    return res.json(status ?? {
        roundNumber,
        fullscreen: false,
        tabSwitchCount: 0,
        warned: false,
        banned: false,
    });
}
