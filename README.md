# Last Standing Ronin Event Platform

Full-stack event platform scaffold for:
- Round 1 coding duel elimination
- Round 2 quiz engine
- Round 3 auction finale with Bits scoring

## Stack
- Client: React + Vite + TypeScript + Tailwind + Zustand
- Server: Express + TypeScript + Socket.io
- DB: PostgreSQL + Prisma
- Code execution: Piston API

## Quick start
1. Start Docker Desktop (required for PostgreSQL).
2. From project root: `npm run db:up`
3. In `server`:
   - `cp .env.example .env` (already provided)
   - `npm run prisma:generate`
   - `npx prisma migrate dev --name init`
   - `npm run prisma:seed`
4. Run apps:
   - Backend: `npm run dev:server`
   - Frontend: `npm run dev:client`

## Docker Setup (Linux)

From the project root:

1. Start the Docker container:
   ```bash
   docker compose up -d
   ```

2. Verify the container is running:
   ```bash
   docker compose ps
   docker compose logs -f piston
   ```

3. Test the Piston API:
   ```bash
   curl http://localhost:2000/api/v2/runtimes
   ```

4. Stop the container when finished:
   ```bash
   docker compose down
   ```

## Main endpoints
- Auth: `/api/auth/register`, `/api/auth/login`
- Admin: `/api/admin/pending-users`, `/api/admin/users/:userId`, `/api/admin/start-round`
- Team: `/api/team/me`, `/api/team/create`, `/api/team/join`
- Problem: `/api/problem`
- Submission: `/api/submission/run`, `/api/submission/submit`
- Quiz: `/api/quiz/questions`, `/api/quiz/answer`
- Auction: `/api/auction/board`, `/api/auction/problem`, `/api/auction/bid`
- Round: `/api/round/event-state`, `/api/round/:roundNumber/matchups`, `/api/round/leaderboard/global`

## Production Deployment

1. Provision a VPS/EC2 instance with Ubuntu.
2. Install Docker and clone the repository.
3. In the `server` directory, install dependencies with Bun and run `bun run dev`. Use PM2 to maintain service availability.
4. Configure Piston Docker containers for 24/7 operation.
5. Set up Nginx as a reverse proxy to expose the application.
6. Configure the Vercel frontend environment variables with the exposed server IP and port.
