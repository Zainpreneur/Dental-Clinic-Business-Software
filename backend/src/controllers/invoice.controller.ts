import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

const invoiceItemSchema = z.object({
  treatmentId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
});

const invoiceSchema = z.object({
  patientId: z.string().uuid(),
  items: z.array(invoiceItemSchema).min(1, "Invoice must have at least one item"),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "CARD", "INSURANCE", "BANK_TRANSFER", "OTHER"]).default("CASH"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${year}-` } } });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

function computeStatus(total: number, amountPaid: number): "UNPAID" | "PARTIALLY_PAID" | "PAID" {
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid >= total) return "PAID";
  return "PARTIALLY_PAID";
}

export async function listInvoices(req: Request, res: Response) {
  const { patientId, status } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { patient: { select: { id: true, firstName: true, lastName: true } }, items: true, payments: true },
  });
  res.json(invoices);
}

export async function getInvoice(req: Request, res: Response) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: {
      patient: true,
      items: { include: { treatment: true } },
      payments: { orderBy: { paidAt: "desc" } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  res.json(invoice);
}

export async function createInvoice(req: Request, res: Response) {
  const data = invoiceSchema.parse(req.body);
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw ApiError.notFound("Patient not found");

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(subtotal - data.discount + data.tax, 0);
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        patientId: data.patientId,
        createdById: req.user!.userId,
        subtotal,
        discount: data.discount,
        tax: data.tax,
        total,
        dueDate: data.dueDate,
        notes: data.notes,
        status: "UNPAID",
        items: {
          create: data.items.map((item) => ({
            treatmentId: item.treatmentId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    await tx.patient.update({
      where: { id: data.patientId },
      data: { balance: { increment: total } },
    });

    return created;
  });

  res.status(201).json(invoice);
}

export async function recordPayment(req: Request, res: Response) {
  const data = paymentSchema.parse(req.body);
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "VOID") throw ApiError.badRequest("Cannot record a payment against a void invoice");

  const total = Number(invoice.total);
  const currentPaid = Number(invoice.amountPaid);
  const newPaid = currentPaid + data.amount;
  if (newPaid - total > 0.01) {
    throw ApiError.badRequest(`Payment exceeds the remaining balance of ${(total - currentPaid).toFixed(2)}`);
  }

  const status = computeStatus(total, newPaid);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: { invoiceId: invoice.id, amount: data.amount, method: data.method, reference: data.reference, notes: data.notes },
    });
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newPaid, status },
      include: { items: true, payments: true },
    });
    await tx.patient.update({
      where: { id: invoice.patientId },
      data: { balance: { decrement: data.amount } },
    });
    return { payment, invoice: updatedInvoice };
  });

  res.status(201).json(result);
}

export async function voidInvoice(req: Request, res: Response) {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "VOID") return res.json(invoice);

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
  const updated = await prisma.$transaction(async (tx) => {
    const voided = await tx.invoice.update({ where: { id: invoice.id }, data: { status: "VOID" } });
    if (outstanding > 0) {
      await tx.patient.update({ where: { id: invoice.patientId }, data: { balance: { decrement: outstanding } } });
    }
    return voided;
  });
  res.json(updated);
}
