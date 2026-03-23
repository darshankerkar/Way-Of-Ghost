import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { startRound, resetRound } from "../services/round.service.js";
import { getIO } from "../socket/index.js";
export async function listPendingUsers(_req, res) {
    const users = await prisma.user.findMany({
        where: { status: UserStatus.PENDING, role: "PARTICIPANT" },
        select: {
            id: true,
            name: true,
            email: true,
            college: true,
            status: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    return res.json(users);
}
export async function updateUserApproval(req, res) {
    const { userId } = req.params;
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    if (status !== "APPROVED" && status !== "REJECTED") {
        return res.status(400).json({ message: "Invalid status." });
    }
    const user = await prisma.user.update({
        where: { id: String(userId) },
        data: { status: status },
        select: { id: true, email: true, status: true },
    });
    return res.json(user);
}
export async function adminStartRound(req, res) {
    try {
        const { roundNumber } = req.body;
        const eventState = await startRound(roundNumber);
        const io = getIO();
        io.emit("round:started", { roundNumber, eventState });
        return res.json({ message: `Round ${roundNumber} started.`, eventState });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function adminResetRound(req, res) {
    try {
        const { roundNumber } = req.body;
        const result = await resetRound(roundNumber);
        const io = getIO();
        io.emit("round:reset", { roundNumber });
        return res.json({ message: `Round ${roundNumber} reset. ${result.deleted} matchup(s) deleted.` });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function listProctoringStatuses(_req, res) {
    const rows = await prisma.proctoringStatus.findMany({
        where: { user: { role: "PARTICIPANT" } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ roundNumber: "asc" }, { updatedAt: "desc" }],
    });
    return res.json(rows.map((r) => ({
        userId: r.userId,
        userName: r.user.name,
        roundNumber: r.roundNumber,
        fullscreen: r.fullscreen,
        tabSwitchCount: r.tabSwitchCount,
        warned: r.warned,
        banned: r.banned,
        updatedAt: r.updatedAt,
    })));
}
export async function adminUnblockParticipant(req, res) {
    const { userId, roundNumber } = req.body;
    if (!userId || !roundNumber || ![1, 2, 3].includes(Number(roundNumber))) {
        return res.status(400).json({ message: "userId and valid roundNumber are required." });
    }
    const status = await prisma.proctoringStatus.upsert({
        where: { userId_roundNumber: { userId, roundNumber: Number(roundNumber) } },
        update: {
            banned: false,
            warned: false,
            tabSwitchCount: 0,
            fullscreen: false,
        },
        create: {
            userId,
            roundNumber: Number(roundNumber),
            banned: false,
            warned: false,
            tabSwitchCount: 0,
            fullscreen: false,
        },
        include: { user: { select: { name: true } } },
    });
    const io = getIO();
    io.to("admins").emit("exam:status:update", {
        userId: status.userId,
        userName: status.user.name,
        roundNumber: status.roundNumber,
        fullscreen: status.fullscreen,
        tabSwitchCount: status.tabSwitchCount,
        warned: status.warned,
        banned: status.banned,
        updatedAt: status.updatedAt.toISOString(),
    });
    io.to(`user:${status.userId}`).emit("exam:unblocked", { roundNumber: status.roundNumber });
    return res.json({ message: `${status.user.name} unblocked for round ${status.roundNumber}.` });
}
export async function adminExtendTimer(req, res) {
    const { matchupId, extraMinutes } = req.body;
    if (!matchupId || !extraMinutes || extraMinutes <= 0) {
        return res.status(400).json({ message: "matchupId and positive extraMinutes are required." });
    }
    const extraSeconds = Math.round(Number(extraMinutes) * 60);
    const matchup = await prisma.matchup.update({
        where: { id: matchupId },
        data: { timerExtension: { increment: extraSeconds } },
        select: {
            id: true,
            roundNumber: true,
            timerExtension: true,
            user1Id: true,
            user2Id: true,
            user1: { select: { name: true } },
            user2: { select: { name: true } },
        },
    });
    const io = getIO();
    // Notify both participants in the matchup
    io.to(`user:${matchup.user1Id}`).emit("matchup:timer-extended", {
        matchupId: matchup.id,
        extraSeconds,
        totalExtension: matchup.timerExtension,
    });
    io.to(`user:${matchup.user2Id}`).emit("matchup:timer-extended", {
        matchupId: matchup.id,
        extraSeconds,
        totalExtension: matchup.timerExtension,
    });
    return res.json({
        message: `Timer extended by ${extraMinutes}m for matchup between ${matchup.user1.name} and ${matchup.user2.name}.`,
        matchup,
    });
}
