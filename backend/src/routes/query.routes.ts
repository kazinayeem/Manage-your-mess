import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticateUser } from "../middleware/auth";
import { runQuery } from "../controllers/query.controller";

const router = Router();

router.use(asyncHandler(authenticateUser));

router.post("/", asyncHandler(runQuery));

export default router;