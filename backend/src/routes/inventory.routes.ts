import { Router } from "express";
import * as ctrl from "../controllers/inventory.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.listInventory);
router.post("/", authorize("ADMIN", "ASSISTANT"), ctrl.createItem);
router.put("/:id", authorize("ADMIN", "ASSISTANT"), ctrl.updateItem);
router.delete("/:id", authorize("ADMIN"), ctrl.deleteItem);
router.post("/:id/movements", authorize("ADMIN", "ASSISTANT", "DENTIST"), ctrl.recordMovement);
router.get("/:id/movements", ctrl.listMovements);

export default router;
