"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const bazaar_controller_1 = require("../controllers/bazaar.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(bazaar_controller_1.getBazaarTasks));
router.post("/", (0, async_handler_1.asyncHandler)(bazaar_controller_1.createBazaarTask));
router.post("/:taskId/submit", (0, async_handler_1.asyncHandler)(bazaar_controller_1.submitBazaar));
router.post("/:taskId/approve", (0, async_handler_1.asyncHandler)(bazaar_controller_1.approveBazaar));
router.post("/:taskId/reject", (0, async_handler_1.asyncHandler)(bazaar_controller_1.rejectBazaar));
exports.default = router;
//# sourceMappingURL=bazaar.routes.js.map