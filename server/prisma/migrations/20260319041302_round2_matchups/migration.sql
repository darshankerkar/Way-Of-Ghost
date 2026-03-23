/*
  Warnings:

  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizResponse" DROP CONSTRAINT "QuizResponse_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizResponse" DROP CONSTRAINT "QuizResponse_userId_fkey";

-- DropTable
DROP TABLE "QuizQuestion";

-- DropTable
DROP TABLE "QuizResponse";
