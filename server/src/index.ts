import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/index.js";
import { startMatchupExpiryWorker } from "./services/matchup-expiry.service.js";

const server = http.createServer(app);
const io = createSocketServer(server);
startMatchupExpiryWorker(io);

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${env.PORT}`);
});