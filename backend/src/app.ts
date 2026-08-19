import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import messRoutes from "./routes/mess.routes";
import memberRoutes from "./routes/member.routes";
import mealRoutes from "./routes/meal.routes";
import expenseRoutes from "./routes/expense.routes";
import depositRoutes from "./routes/deposit.routes";
import bazaarRoutes from "./routes/bazaar.routes";
import roomRoutes from "./routes/room.routes";
import visitorRoutes from "./routes/visitor.routes";
import utilityRoutes from "./routes/utility.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import superAdminRoutes from "./routes/super-admin.routes";

import { errorHandler } from "./middleware/error-handler";
import { env } from "./config/env";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: env.NODE_ENV });
});

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/messes", messRoutes);
app.use("/api/v1/members", memberRoutes);
app.use("/api/v1/meals", mealRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/deposits", depositRoutes);
app.use("/api/v1/bazaar", bazaarRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/visitors", visitorRoutes);
app.use("/api/v1/utilities", utilityRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/super-admin", superAdminRoutes);

// Global Error Handler
app.use(errorHandler);
