import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { verifyToken } from "../utils/jwt.js";
let io = null;
function toExamStatus(row) {
    return {
        userId: row.userId,
        userName: row.user.name,
        roundNumber: row.roundNumber,
        fullscreen: row.fullscreen,
        tabSwitchCount: row.tabSwitchCount,
        warned: row.warned,
        banned: row.banned,
        updatedAt: row.updatedAt.toISOString(),
    };
}
export function getIO() {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
}
export function createSocketServer(server) {
    io = new Server(server, {
        cors: {
            origin: env.CLIENT_ORIGIN,
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Unauthorized"));
        }
        try {
            const payload = verifyToken(token);
            socket.data.user = payload;
            return next();
        }
        catch {
            return next(new Error("Unauthorized"));
        }
    });
    io.on("connection", async (socket) => {
        const user = socket.data.user;
        socket.join(`user:${user.userId}`);
        if (user.role === "ADMIN") {
            socket.join("admins");
            const snapshot = await prisma.proctoringStatus.findMany({
                where: { user: { role: "PARTICIPANT" } },
                include: { user: { select: { name: true } } },
                orderBy: [{ roundNumber: "asc" }, { updatedAt: "desc" }],
            });
            socket.emit("exam:status:snapshot", snapshot.map(toExamStatus));
        }
        socket.on("room:join", (room) => {
            socket.join(room);
        });
        socket.on("room:leave", (room) => {
            socket.leave(room);
        });
        socket.on("auction:code", (data) => {
            io.to(`auction:${data.auctionProblemId}`).emit("auction:live-code", {
                userId: user.userId,
                teamId: data.teamId,
                code: data.code,
            });
        });
        socket.on("exam:status:update", async (data) => {
            if (user.role !== "PARTICIPANT")
                return;
            const roundNumber = Number(data.roundNumber);
            if (![1, 2, 3].includes(roundNumber))
                return;
            const participant = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { name: true },
            });
            if (!participant)
                return;
            if (roundNumber === 1) {
                const won = await prisma.matchup.findFirst({
                    where: { roundNumber: 1, winnerId: user.userId, status: "COMPLETED" },
                    select: { id: true },
                });
                if (won) {
                    await prisma.proctoringStatus.deleteMany({ where: { userId: user.userId, roundNumber } });
                    io.to("admins").emit("exam:status:remove", { userId: user.userId, roundNumber });
                    return;
                }
            }
            const existing = await prisma.proctoringStatus.findUnique({
                where: { userId_roundNumber: { userId: user.userId, roundNumber } },
            });
            let tabSwitchCount = existing?.tabSwitchCount ?? 0;
            let warned = existing?.warned ?? false;
            let banned = existing?.banned ?? false;
            let fullscreen = Boolean(data.fullscreen) && !banned;
            if (data.eventType === "TAB_SWITCH") {
                tabSwitchCount += 1;
                warned = tabSwitchCount >= 1;
                if (tabSwitchCount >= 2) {
                    banned = true;
                    fullscreen = false;
                }
            }
            let updated;
            try {
                updated = await prisma.proctoringStatus.upsert({
                    where: { userId_roundNumber: { userId: user.userId, roundNumber } },
                    update: { fullscreen, tabSwitchCount, warned, banned },
                    create: {
                        userId: user.userId,
                        roundNumber,
                        fullscreen,
                        tabSwitchCount,
                        warned,
                        banned,
                    },
                    include: { user: { select: { name: true } } },
                });
            }
            catch (e) {
                // Race condition: another event created the row between findUnique and upsert
                if (e?.code === "P2002") {
                    updated = await prisma.proctoringStatus.update({
                        where: { userId_roundNumber: { userId: user.userId, roundNumber } },
                        data: { fullscreen, tabSwitchCount, warned, banned },
                        include: { user: { select: { name: true } } },
                    });
                }
                else {
                    return;
                }
            }
            const status = toExamStatus(updated);
            io.to("admins").emit("exam:status:update", status);
            if (data.eventType === "TAB_SWITCH") {
                io.to("admins").emit("exam:tab-switch", status);
                if (status.banned) {
                    io.to(`user:${status.userId}`).emit("exam:banned", {
                        roundNumber,
                        message: "You are banned due to multiple tab switches",
                    });
                }
                else {
                    io.to(`user:${status.userId}`).emit("exam:warning", {
                        roundNumber,
                        message: "Warning: Switching tabs again will result in a ban.",
                    });
                }
            }
            else if (status.banned) {
                io.to(`user:${status.userId}`).emit("exam:banned", {
                    roundNumber,
                    message: "You are banned due to multiple tab switches",
                });
            }
        });
        socket.on("exam:exclude", async (data) => {
            if (user.role !== "PARTICIPANT")
                return;
            const roundNumber = Number(data.roundNumber);
            if (![1, 2, 3].includes(roundNumber))
                return;
            await prisma.proctoringStatus.deleteMany({ where: { userId: user.userId, roundNumber } });
            io.to("admins").emit("exam:status:remove", { userId: user.userId, roundNumber });
        });
        socket.on("disconnect", () => null);
    });
    return io;
}
