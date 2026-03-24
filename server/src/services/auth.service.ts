import bcrypt from "bcrypt";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  college: string;
};

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Email already registered.");
  }

  const password = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      college: input.college,
      role: Role.PARTICIPANT,
      status: UserStatus.PENDING,
    },
    select: { id: true, email: true, name: true, status: true },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  if (user.status !== UserStatus.APPROVED && user.role !== Role.ADMIN) {
    throw new Error("Account pending admin approval.");
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bits: user.bits,
    },
  };
}
