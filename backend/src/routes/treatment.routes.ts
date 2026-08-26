import { Router } from "express";
import * as ctrl from "../controllers/treatment.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listTreatments);
router.post("/", authorize("ADMIN"), ctrl.createTreatment);
router.put("/:id", authorize("ADMIN"), ctrl.updateTreatment);
router.delete("/:id", authorize("ADMIN"), ctrl.deactivateTreatment);

router.post("/records", authorize("ADMIN", "DENTIST", "ASSISTANT"), ctrl.createTreatmentRecord);
router.get("/records/patient/:patientId", ctrl.listTreatmentRecordsForPatient);

export default router;
