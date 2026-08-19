import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getVisitors, createVisitor } from "../controllers/visitor.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getVisitors));
router.post("/", asyncHandler(createVisitor));

export default router;
