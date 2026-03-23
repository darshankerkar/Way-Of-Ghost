import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export async function createProblem(req: Request, res: Response) {
  const { title, description, difficulty, roundNumber, starterCode, timeLimit, testCases, hint } =
    req.body as {
      title: string;
      description: string;
      difficulty: string;
      roundNumber: number;
      starterCode: string;
      timeLimit: number;
      testCases: { input: string; expected: string; isHidden?: boolean }[];
      hint?: string;
    };

  const problem = await prisma.problem.create({
    data: {
      title,
      description,
      difficulty,
      roundNumber,
      starterCode,
      timeLimit,
      hint,
      testCases: {
        create: (testCases ?? []).map((item) => ({
          input: item.input,
          expected: item.expected,
          isHidden: item.isHidden ?? true,
        })),
      },
    },
    include: { testCases: true },
  });

  return res.status(201).json(problem);
}

export async function listProblems(req: Request, res: Response) {
  const round = req.query.round ? Number(req.query.round) : undefined;
  const problems = await prisma.problem.findMany({
    where: round ? { roundNumber: round } : undefined,
    include: { testCases: true },
    orderBy: [{ roundNumber: "asc" }, { createdAt: "desc" }],
  });
  return res.json(problems);
}
