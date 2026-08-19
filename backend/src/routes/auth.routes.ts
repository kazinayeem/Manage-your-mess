import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { login, register, refreshToken, me, logout } from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));
router.post("/refresh", asyncHandler(refreshToken));
router.get("/me", asyncHandler(authenticateUser), asyncHandler(me));
router.post("/logout", asyncHandler(logout));

export default router;
