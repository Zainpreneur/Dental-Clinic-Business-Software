import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/db";
import { signToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "DENTIST", "RECEPTIONIST", "ASSISTANT"]).optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  phone: true,
  specialty: true,
  isActive: true,
  createdAt: true,
} as const;

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  // First-ever user becomes ADMIN automatically so the clinic can bootstrap itself.
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : data.role || "RECEPTIONIST";

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role,
      phone: data.phone,
      specialty: data.specialty,
    },
    select: publicUser,
  });

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ user: safeUser, token });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: publicUser,
  });
  if (!user) throw ApiError.notFound("User not found");
  res.json(user);
}
