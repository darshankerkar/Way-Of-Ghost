import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { loginUser, registerUser } from "../services/auth.service.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  college: z.string().min(2, "College name must be at least 2 characters."),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await registerUser(body);
    return res.status(201).json({
      message: "Registered successfully. Awaiting admin approval.",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);
    const data = await loginUser(body.email, body.password);
    return res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json(user);
}
