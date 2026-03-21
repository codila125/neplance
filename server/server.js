const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const AppError = require("./src/utils/appError");
const logger = require("./src/utils/logger");
const connectDB = require("./src/config/db");
const { checkBlockchainConnection } = require("./src/config/blockchain");

const frontendUrl =
  process.env.FRONTEND_BASE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", frontendUrl],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const indexRouter = require("./src/routes/indexRoute");
const adminRouter = require("./src/routes/adminRoutes");
const jobRouter = require("./src/routes/jobRoutes");
const authRouter = require("./src/routes/authRoute");
const proposalRouter = require("./src/routes/proposalRoutes");
const userRouter = require("./src/routes/userRoutes");
const uploadRouter = require("./src/routes/uploadRoutes");
const notificationRouter = require("./src/routes/notificationRoutes");
const chatRouter = require("./src/routes/chatRoutes");
const contractRouter = require("./src/routes/contractRoutes");
const bookingRouter = require("./src/routes/bookingRoutes");
const walletRouter = require("./src/routes/walletRoutes");
const blockchainRouter = require("./src/routes/blockchainRoutes");
const errorController = require("./src/controllers/errorController");

let serverInstance;
let isShuttingDown = false;

app.use("/api", indexRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/proposals", proposalRouter);
app.use("/api/users", userRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/chat", chatRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/blockchain", blockchainRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

app.all("*", (req, res, next) => {
  next(new AppError(`No route found for ${req.url}`, 404));
});

app.use(errorController);

const PORT = process.env.SERVER_PORT || 5000;

const shutdown = (reason, error = null) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (error) {
    logger.error(`Shutting down server due to ${reason}.`, error);
  } else {
    logger.warn(`Shutting down server due to ${reason}.`);
  }

  const exitCode = error ? 1 : 0;

  if (!serverInstance) {
    process.exit(exitCode);
  }

  serverInstance.close(() => {
    process.exit(exitCode);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

const startServer = async () => {
  await connectDB();
  await checkBlockchainConnection();
  serverInstance = app.listen(PORT, () =>
    logger.info(`Server running on port ${PORT}`)
  );
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) =>
  shutdown("unhandledRejection", reason)
);
process.on("uncaughtException", (error) =>
  shutdown("uncaughtException", error)
);

startServer().catch((error) => {
  logger.error("Failed to start the server.", error);
  process.exit(1);
});

module.exports = app;
