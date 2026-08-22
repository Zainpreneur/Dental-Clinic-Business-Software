import { Router } from "express";
import * as ctrl from "../controllers/patient.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listPatients);
router.post("/", authorize("ADMIN", "RECEPTIONIST"), ctrl.createPatient);
router.get("/:id", ctrl.getPatient);
router.put("/:id", authorize("ADMIN", "RECEPTIONIST"), ctrl.updatePatient);
router.delete("/:id", authorize("ADMIN"), ctrl.deactivatePatient);

router.get("/:id/dental-chart", ctrl.getDentalChart);
router.post("/:id/dental-chart", authorize("ADMIN", "DENTIST", "ASSISTANT"), ctrl.addChartEntry);

export default router;
