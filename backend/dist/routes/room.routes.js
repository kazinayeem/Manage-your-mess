"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const room_controller_1 = require("../controllers/room.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(room_controller_1.getRooms));
router.post("/", (0, async_handler_1.asyncHandler)(room_controller_1.createRoom));
exports.default = router;
//# sourceMappingURL=room.routes.js.map