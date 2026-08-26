import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNo: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
});

export async function listPatients(req: Request, res: Response) {
  const { search, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = search
    ? {
        isActive: true,
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { isActive: true };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.patient.count({ where }),
  ]);

  res.json({ data: patients, total, page: Number(page), pageSize: take });
}

export async function getPatient(req: Request, res: Response) {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      appointments: { orderBy: { startTime: "desc" }, take: 10, include: { dentist: { select: { firstName: true, lastName: true } }, treatment: true } },
      dentalChartEntries: { orderBy: { recordedAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      treatmentRecords: { orderBy: { performedAt: "desc" }, take: 20, include: { treatment: true, performedBy: { select: { firstName: true, lastName: true } } } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!patient) throw ApiError.notFound("Patient not found");
  res.json(patient);
}

export async function createPatient(req: Request, res: Response) {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.create({
    data: { ...data, email: data.email || undefined },
  });
  res.status(201).json(patient);
}

export async function updatePatient(req: Request, res: Response) {
  const data = patientSchema.partial().parse(req.body);
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { ...data, email: data.email || undefined },
  });
  res.json(patient);
}

export async function deactivatePatient(req: Request, res: Response) {
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json(patient);
}

// --- Dental chart ---

const chartEntrySchema = z.object({
  toothNumber: z.number().int().min(1).max(32),
  condition: z.string().min(1),
  surface: z.string().optional(),
  notes: z.string().optional(),
});

export async function addChartEntry(req: Request, res: Response) {
  const data = chartEntrySchema.parse(req.body);
  const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
  if (!patient) throw ApiError.notFound("Patient not found");

  const entry = await prisma.dentalChartEntry.create({
    data: { ...data, patientId: req.params.id },
  });
  res.status(201).json(entry);
}

export async function getDentalChart(req: Request, res: Response) {
  const entries = await prisma.dentalChartEntry.findMany({
    where: { patientId: req.params.id },
    orderBy: [{ toothNumber: "asc" }, { recordedAt: "desc" }],
  });
  res.json(entries);
}
