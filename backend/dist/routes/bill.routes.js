"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const auth_1 = require("../middleware/auth");
const bill_controller_1 = require("../controllers/bill.controller");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(bill_controller_1.getMessBills));
router.post("/", (0, async_handler_1.asyncHandler)(bill_controller_1.addBill));
router.get("/kpis", (0, async_handler_1.asyncHandler)(bill_controller_1.getBillKpis));
router.post("/payment", (0, async_handler_1.asyncHandler)(bill_controller_1.recordBillPayment));
router.get("/recurring", (0, async_handler_1.asyncHandler)(bill_controller_1.getRecurringBills));
router.post("/recurring", (0, async_handler_1.asyncHandler)(bill_controller_1.addRecurringBill));
router.post("/recurring/generate", (0, async_handler_1.asyncHandler)(bill_controller_1.generateRecurringBills));
router.get("/:id", (0, async_handler_1.asyncHandler)(bill_controller_1.getBill));
router.delete("/:id", (0, async_handler_1.asyncHandler)(bill_controller_1.deleteBill));
exports.default = router;
//# sourceMappingURL=bill.routes.js.map