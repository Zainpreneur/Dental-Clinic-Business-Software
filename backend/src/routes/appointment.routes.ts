import { Router } from "express";
import * as ctrl from "../controllers/appointment.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listAppointments);
router.post("/", authorize("ADMIN", "RECEPTIONIST"), ctrl.createAppointment);
router.get("/:id", ctrl.getAppointment);
router.put("/:id", authorize("ADMIN", "RECEPTIONIST"), ctrl.updateAppointment);
router.patch("/:id/status", ctrl.updateAppointmentStatus);
router.post("/:id/cancel", ctrl.cancelAppointment);

export default router;
