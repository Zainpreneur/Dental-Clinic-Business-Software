import { Router } from "express";
import * as ctrl from "../controllers/staff.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/dentists", ctrl.listDentists);
router.get("/", authorize("ADMIN"), ctrl.listStaff);
router.post("/", authorize("ADMIN"), ctrl.createStaff);
router.put("/:id", authorize("ADMIN"), ctrl.updateStaff);
router.delete("/:id", authorize("ADMIN"), ctrl.deactivateStaff);

export default router;
