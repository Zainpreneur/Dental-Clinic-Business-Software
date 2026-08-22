import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

const itemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.coerce.number().int().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(10),
  unit: z.string().optional(),
  unitCost: z.coerce.number().nonnegative().default(0),
  supplier: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

const movementSchema = z.object({
  type: z.enum(["RESTOCK", "USAGE", "ADJUSTMENT", "WASTE"]),
  quantity: z.coerce.number().int(),
  note: z.string().optional(),
});

export async function listInventory(req: Request, res: Response) {
  const { lowStock } = req.query as Record<string, string>;
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  const filtered = lowStock === "true" ? items.filter((i) => i.quantity <= i.reorderLevel) : items;
  res.json(filtered);
}

export async function createItem(req: Request, res: Response) {
  const data = itemSchema.parse(req.body);
  const item = await prisma.inventoryItem.create({ data });
  res.status(201).json(item);
}

export async function updateItem(req: Request, res: Response) {
  const data = itemSchema.partial().parse(req.body);
  const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data });
  res.json(item);
}

export async function deleteItem(req: Request, res: Response) {
  await prisma.inventoryItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// Adjust stock quantity via a movement record (audit trail of restocks/usage/waste).
export async function recordMovement(req: Request, res: Response) {
  const data = movementSchema.parse(req.body);
  const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw ApiError.notFound("Inventory item not found");

  const delta = data.type === "RESTOCK" ? Math.abs(data.quantity) : -Math.abs(data.quantity);
  const newQuantity = item.quantity + delta;
  if (newQuantity < 0) throw ApiError.badRequest("Resulting quantity cannot be negative");

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.inventoryMovement.create({
      data: { itemId: item.id, type: data.type, quantity: data.quantity, note: data.note },
    });
    const updatedItem = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity: newQuantity } });
    return { movement, item: updatedItem };
  });

  res.status(201).json(result);
}

export async function listMovements(req: Request, res: Response) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { itemId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(movements);
}
