import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getRooms, createRoom } from "../controllers/room.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getRooms));
router.post("/", asyncHandler(createRoom));

export default router;
