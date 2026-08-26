import { Request, Response } from "express";
import prisma from "../config/db";

export async function getSummary(_req: Request, res: Response) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalPatients,
    todaysAppointments,
    upcomingAppointments,
    monthlyPayments,
    outstandingInvoices,
    lowStockItems,
    appointmentsByStatusRaw,
  ] = await Promise.all([
    prisma.patient.count({ where: { isActive: true } }),
    prisma.appointment.findMany({
      where: { startTime: { gte: startOfDay, lt: endOfDay } },
      orderBy: { startTime: "asc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        treatment: { select: { name: true } },
      },
    }),
    prisma.appointment.count({
      where: { startTime: { gte: endOfDay }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.inventoryItem.findMany(),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { startTime: { gte: startOfMonth, lt: startOfNextMonth } },
    }),
  ]);

  const outstandingTotal =
    Number(outstandingInvoices._sum.total || 0) - Number(outstandingInvoices._sum.amountPaid || 0);
  const lowStockCount = lowStockItems.filter((i) => i.quantity <= i.reorderLevel).length;

  res.json({
    totalPatients,
    todaysAppointmentCount: todaysAppointments.length,
    todaysAppointments,
    upcomingAppointments,
    monthlyRevenue: Number(monthlyPayments._sum.amount || 0),
    outstandingBalance: outstandingTotal,
    lowStockCount,
    appointmentsByStatus: appointmentsByStatusRaw.map((r) => ({ status: r.status, count: r._count._all })),
  });
}
