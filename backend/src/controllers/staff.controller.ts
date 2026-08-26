import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

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

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "DENTIST", "RECEPTIONIST", "ASSISTANT"]),
  phone: z.string().optional(),
  specialty: z.string().optional(),
});

const updateStaffSchema = createStaffSchema.omit({ password: true }).partial();

export async function listStaff(req: Request, res: Response) {
  const { role } = req.query as Record<string, string>;
  const staff = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: publicUser,
    orderBy: { firstName: "asc" },
  });
  res.json(staff);
}

export async function createStaff(req: Request, res: Response) {
  const data = createStaffSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, passwordHash },
    select: publicUser,
  });
  res.status(201).json(user);
}

export async function updateStaff(req: Request, res: Response) {
  const data = updateStaffSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: publicUser });
  res.json(user);
}

export async function deactivateStaff(req: Request, res: Response) {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false }, select: publicUser });
  res.json(user);
}

export async function listDentists(_req: Request, res: Response) {
  const dentists = await prisma.user.findMany({
    where: { role: "DENTIST", isActive: true },
    select: publicUser,
    orderBy: { firstName: "asc" },
  });
  res.json(dentists);
}
