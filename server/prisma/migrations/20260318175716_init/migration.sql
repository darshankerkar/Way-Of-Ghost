-- CreateTable
CREATE TABLE "ProctoringStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "fullscreen" BOOLEAN NOT NULL DEFAULT false,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "warned" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProctoringStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProctoringStatus_userId_roundNumber_key" ON "ProctoringStatus"("userId", "roundNumber");

-- AddForeignKey
ALTER TABLE "ProctoringStatus" ADD CONSTRAINT "ProctoringStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
