import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getBills, createBill } from "../controllers/utility.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getBills));
router.post("/", asyncHandler(createBill));

export default router;
