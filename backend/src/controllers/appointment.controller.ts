import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  treatmentId: z.string().uuid().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

async function assertNoOverlap(dentistId: string, startTime: Date, endTime: Date, excludeId?: string) {
  if (endTime <= startTime) throw ApiError.badRequest("End time must be after start time");

  const conflict = await prisma.appointment.findFirst({
    where: {
      dentistId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });
  if (conflict) throw ApiError.conflict("This dentist already has an appointment in that time slot");
}

export async function listAppointments(req: Request, res: Response) {
  const { from, to, dentistId, patientId, status } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (dentistId) where.dentistId = dentistId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;
  if (from || to) {
    where.startTime = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } },
      treatment: { select: { id: true, name: true, price: true, durationMin: true } },
    },
  });
  res.json(appointments);
}

export async function getAppointment(req: Request, res: Response) {
  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { patient: true, dentist: { select: { id: true, firstName: true, lastName: true } }, treatment: true },
  });
  if (!appt) throw ApiError.notFound("Appointment not found");
  res.json(appt);
}

export async function createAppointment(req: Request, res: Response) {
  const data = appointmentSchema.parse(req.body);
  await assertNoOverlap(data.dentistId, data.startTime, data.endTime);

  const appt = await prisma.appointment.create({
    data,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } },
      treatment: true,
    },
  });
  res.status(201).json(appt);
}

export async function updateAppointment(req: Request, res: Response) {
  const data = appointmentSchema.partial().parse(req.body);
  const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Appointment not found");

  const dentistId = data.dentistId ?? existing.dentistId;
  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;
  await assertNoOverlap(dentistId, startTime, endTime, existing.id);

  const appt = await prisma.appointment.update({
    where: { id: req.params.id },
    data,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      dentist: { select: { id: true, firstName: true, lastName: true } },
      treatment: true,
    },
  });
  res.json(appt);
}

export async function updateAppointmentStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  const appt = await prisma.appointment.update({ where: { id: req.params.id }, data: { status } });
  res.json(appt);
}

export async function cancelAppointment(req: Request, res: Response) {
  const appt = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });
  res.json(appt);
}
