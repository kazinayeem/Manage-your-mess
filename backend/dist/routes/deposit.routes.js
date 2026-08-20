"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const deposit_controller_1 = require("../controllers/deposit.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(deposit_controller_1.getDeposits));
router.post("/", (0, async_handler_1.asyncHandler)(deposit_controller_1.createDeposit));
router.patch("/:id", (0, async_handler_1.asyncHandler)(deposit_controller_1.updateDeposit));
router.delete("/:id", (0, async_handler_1.asyncHandler)(deposit_controller_1.deleteDeposit));
exports.default = router;
//# sourceMappingURL=deposit.routes.js.map