import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { problemRouter } from "./routes/problem.routes.js";
import { roundRouter } from "./routes/round.routes.js";
import { submissionRouter } from "./routes/submission.routes.js";
export const app = express();
app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "way-of-ghost-server" });
});
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/problem", problemRouter);
app.use("/api/round", roundRouter);
app.use("/api/submission", submissionRouter);
app.use(errorHandler);
