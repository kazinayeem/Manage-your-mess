import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticateUser } from "../middleware/auth";
import {
  getMessBills,
  getBill,
  addBill,
  recordBillPayment,
  deleteBill,
  getRecurringBills,
  addRecurringBill,
  generateRecurringBills,
  getBillKpis,
} from "../controllers/bill.controller";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMessBills));
router.post("/", asyncHandler(addBill));
router.get("/kpis", asyncHandler(getBillKpis));
router.post("/payment", asyncHandler(recordBillPayment));
router.get("/recurring", asyncHandler(getRecurringBills));
router.post("/recurring", asyncHandler(addRecurringBill));
router.post("/recurring/generate", asyncHandler(generateRecurringBills));
router.get("/:id", asyncHandler(getBill));
router.delete("/:id", asyncHandler(deleteBill));

export default router;
