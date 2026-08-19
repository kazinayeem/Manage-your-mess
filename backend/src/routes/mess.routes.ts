import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getMyMesses, createMess, joinMess, getMessDetails } from "../controllers/mess.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMyMesses));
router.post("/", asyncHandler(createMess));
router.post("/join", asyncHandler(joinMess));
router.get("/:id", asyncHandler(getMessDetails));

export default router;
