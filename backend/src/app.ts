import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";
import appointmentRoutes from "./routes/appointment.routes";
import treatmentRoutes from "./routes/treatment.routes";
import invoiceRoutes from "./routes/invoice.routes";
import staffRoutes from "./routes/staff.routes";
import inventoryRoutes from "./routes/inventory.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
