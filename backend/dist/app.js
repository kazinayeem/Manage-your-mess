"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const mess_routes_1 = __importDefault(require("./routes/mess.routes"));
const member_routes_1 = __importDefault(require("./routes/member.routes"));
const meal_routes_1 = __importDefault(require("./routes/meal.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const deposit_routes_1 = __importDefault(require("./routes/deposit.routes"));
const bazaar_routes_1 = __importDefault(require("./routes/bazaar.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const visitor_routes_1 = __importDefault(require("./routes/visitor.routes"));
const utility_routes_1 = __importDefault(require("./routes/utility.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const super_admin_routes_1 = __importDefault(require("./routes/super-admin.routes"));
const error_handler_1 = require("./middleware/error-handler");
const env_1 = require("./config/env");
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: [env_1.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
}));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
exports.app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", environment: env_1.env.NODE_ENV });
});
// API v1 Routes
exports.app.use("/api/v1/auth", auth_routes_1.default);
exports.app.use("/api/v1/users", user_routes_1.default);
exports.app.use("/api/v1/messes", mess_routes_1.default);
exports.app.use("/api/v1/members", member_routes_1.default);
exports.app.use("/api/v1/meals", meal_routes_1.default);
exports.app.use("/api/v1/expenses", expense_routes_1.default);
exports.app.use("/api/v1/deposits", deposit_routes_1.default);
exports.app.use("/api/v1/bazaar", bazaar_routes_1.default);
exports.app.use("/api/v1/rooms", room_routes_1.default);
exports.app.use("/api/v1/visitors", visitor_routes_1.default);
exports.app.use("/api/v1/utilities", utility_routes_1.default);
exports.app.use("/api/v1/analytics", analytics_routes_1.default);
exports.app.use("/api/v1/notifications", notification_routes_1.default);
exports.app.use("/api/v1/super-admin", super_admin_routes_1.default);
// Global Error Handler
exports.app.use(error_handler_1.errorHandler);
//# sourceMappingURL=app.js.map