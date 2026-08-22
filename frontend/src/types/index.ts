export type Role = "ADMIN" | "DENTIST" | "RECEPTIONIST" | "ASSISTANT";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string | null;
  specialty?: string | null;
  isActive: boolean;
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  dateOfBirth?: string | null;
  gender: Gender;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNo?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
  notes?: string | null;
  balance: string | number;
  isActive: boolean;
  createdAt: string;
}

export interface DentalChartEntry {
  id: string;
  patientId: string;
  toothNumber: number;
  condition: string;
  surface?: string | null;
  notes?: string | null;
  recordedAt: string;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  treatmentId?: string | null;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  patient?: Pick<Patient, "id" | "firstName" | "lastName" | "phone">;
  dentist?: Pick<User, "id" | "firstName" | "lastName">;
  treatment?: Treatment | null;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: string | number;
  durationMin: number;
  isActive: boolean;
}

export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
export type PaymentMethod = "CASH" | "CARD" | "INSURANCE" | "BANK_TRANSFER" | "OTHER";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  treatmentId?: string | null;
}

export interface Payment {
  id: string;
  amount: string | number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt: string;
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  status: InvoiceStatus;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  amountPaid: string | number;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  patient?: Pick<Patient, "id" | "firstName" | "lastName">;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  quantity: number;
  reorderLevel: number;
  unit: string;
  unitCost: string | number;
  supplier?: string | null;
  expiryDate?: string | null;
}

export interface DashboardSummary {
  totalPatients: number;
  todaysAppointmentCount: number;
  todaysAppointments: Appointment[];
  upcomingAppointments: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  lowStockCount: number;
  appointmentsByStatus: { status: AppointmentStatus; count: number }[];
}
