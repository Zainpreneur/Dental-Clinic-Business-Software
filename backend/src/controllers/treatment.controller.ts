import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

const treatmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  durationMin: z.coerce.number().int().positive().optional(),
});

export async function listTreatments(req: Request, res: Response) {
  const { activeOnly } = req.query as Record<string, string>;
  const treatments = await prisma.treatment.findMany({
    where: activeOnly === "true" ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
  res.json(treatments);
}

export async function createTreatment(req: Request, res: Response) {
  const data = treatmentSchema.parse(req.body);
  const treatment = await prisma.treatment.create({ data });
  res.status(201).json(treatment);
}

export async function updateTreatment(req: Request, res: Response) {
  const data = treatmentSchema.partial().parse(req.body);
  const treatment = await prisma.treatment.update({ where: { id: req.params.id }, data });
  res.json(treatment);
}

export async function deactivateTreatment(req: Request, res: Response) {
  const treatment = await prisma.treatment.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json(treatment);
}

// --- Treatment records (procedures actually performed) ---

const recordSchema = z.object({
  patientId: z.string().uuid(),
  treatmentId: z.string().uuid(),
  toothNumber: z.number().int().min(1).max(32).optional(),
  notes: z.string().optional(),
});

export async function createTreatmentRecord(req: Request, res: Response) {
  const data = recordSchema.parse(req.body);
  const performedById = req.user!.userId;

  const [patient, treatment] = await Promise.all([
    prisma.patient.findUnique({ where: { id: data.patientId } }),
    prisma.treatment.findUnique({ where: { id: data.treatmentId } }),
  ]);
  if (!patient) throw ApiError.notFound("Patient not found");
  if (!treatment) throw ApiError.notFound("Treatment not found");

  const record = await prisma.treatmentRecord.create({
    data: { ...data, performedById },
    include: { treatment: true, performedBy: { select: { firstName: true, lastName: true } } },
  });
  res.status(201).json(record);
}

export async function listTreatmentRecordsForPatient(req: Request, res: Response) {
  const records = await prisma.treatmentRecord.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { performedAt: "desc" },
    include: { treatment: true, performedBy: { select: { firstName: true, lastName: true } } },
  });
  res.json(records);
}
