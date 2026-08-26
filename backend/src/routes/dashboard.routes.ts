import { Router } from "express";
import * as ctrl from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/summary", ctrl.getSummary);

export default router;
