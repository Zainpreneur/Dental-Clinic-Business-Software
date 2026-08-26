import { Router } from "express";
import * as ctrl from "../controllers/invoice.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listInvoices);
router.post("/", authorize("ADMIN", "RECEPTIONIST"), ctrl.createInvoice);
router.get("/:id", ctrl.getInvoice);
router.post("/:id/payments", authorize("ADMIN", "RECEPTIONIST"), ctrl.recordPayment);
router.post("/:id/void", authorize("ADMIN"), ctrl.voidInvoice);

export default router;
