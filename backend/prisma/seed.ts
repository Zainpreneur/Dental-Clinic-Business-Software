import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dentalclinic.test" },
    update: {},
    create: {
      email: "admin@dentalclinic.test",
      passwordHash,
      firstName: "Alex",
      lastName: "Admin",
      role: "ADMIN",
      phone: "555-0100",
    },
  });

  const dentist = await prisma.user.upsert({
    where: { email: "dentist@dentalclinic.test" },
    update: {},
    create: {
      email: "dentist@dentalclinic.test",
      passwordHash,
      firstName: "Dana",
      lastName: "Smiles",
      role: "DENTIST",
      specialty: "General Dentistry",
      phone: "555-0101",
    },
  });

  await prisma.user.upsert({
    where: { email: "frontdesk@dentalclinic.test" },
    update: {},
    create: {
      email: "frontdesk@dentalclinic.test",
      passwordHash,
      firstName: "Rae",
      lastName: "Reception",
      role: "RECEPTIONIST",
      phone: "555-0102",
    },
  });

  const treatmentData = [
    { name: "Routine Checkup", category: "Preventive", price: 75, durationMin: 30 },
    { name: "Teeth Cleaning", category: "Preventive", price: 100, durationMin: 45 },
    { name: "Dental Filling", category: "Restorative", price: 180, durationMin: 45 },
    { name: "Root Canal", category: "Restorative", price: 900, durationMin: 90 },
    { name: "Tooth Extraction", category: "Surgical", price: 220, durationMin: 45 },
    { name: "Teeth Whitening", category: "Cosmetic", price: 350, durationMin: 60 },
    { name: "Dental Crown", category: "Restorative", price: 1100, durationMin: 60 },
    { name: "Orthodontic Consultation", category: "Orthodontic", price: 120, durationMin: 30 },
  ];

  for (const t of treatmentData) {
    const existing = await prisma.treatment.findFirst({ where: { name: t.name } });
    if (!existing) await prisma.treatment.create({ data: t });
  }

  const patient = await prisma.patient.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      firstName: "Jordan",
      lastName: "Patient",
      email: "jordan.patient@example.com",
      phone: "555-0199",
      gender: "UNSPECIFIED",
      insuranceProvider: "Delta Dental",
      allergies: "None known",
    },
  });

  const cleaningTreatment = await prisma.treatment.findFirst({ where: { name: "Teeth Cleaning" } });

  const existingAppt = await prisma.appointment.findFirst({ where: { patientId: patient.id } });
  if (!existingAppt) {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 45);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        dentistId: dentist.id,
        treatmentId: cleaningTreatment?.id,
        startTime: start,
        endTime: end,
        status: "SCHEDULED",
        reason: "Routine cleaning",
      },
    });
  }

  const itemData = [
    { name: "Nitrile Gloves (Box)", sku: "SUP-001", category: "PPE", quantity: 40, reorderLevel: 15, unit: "box", unitCost: 8.5 },
    { name: "Dental Floss", sku: "SUP-002", category: "Consumables", quantity: 8, reorderLevel: 10, unit: "unit", unitCost: 1.2 },
    { name: "Composite Resin", sku: "SUP-003", category: "Restorative", quantity: 25, reorderLevel: 5, unit: "syringe", unitCost: 22 },
    { name: "Local Anesthetic Cartridges", sku: "SUP-004", category: "Pharmaceuticals", quantity: 60, reorderLevel: 20, unit: "cartridge", unitCost: 0.9 },
  ];
  for (const i of itemData) {
    const existing = await prisma.inventoryItem.findUnique({ where: { sku: i.sku } });
    if (!existing) await prisma.inventoryItem.create({ data: i });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@dentalclinic.test / Password123!");
  console.log("            dentist@dentalclinic.test / Password123!");
  console.log("            frontdesk@dentalclinic.test / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
