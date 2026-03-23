/*
  Warnings:

  - The `starterCode` column on the `Problem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Matchup" ADD COLUMN     "timerExtension" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "hint" TEXT,
DROP COLUMN "starterCode",
ADD COLUMN     "starterCode" JSONB;
