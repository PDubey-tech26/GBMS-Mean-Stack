const path = require("path");

// Load backend/.env explicitly
require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { scheduleDetectionJob } = require("./services/anomalyDetection");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://gbms-mean-stack.vercel.app",
      "https://gbms-mean-stack-apcx0huax-pdtech.vercel.app",
      "https://gbms-mean-stack-git-main-pdtech.vercel.app",
      "https://pdubey-tech26.github.io"
    ],
    credentials: true
  })
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "AI-Based Budget Utilization Monitoring System API",
    status: "running",
    version: "1.0.0"
  });
});

// API test
app.get("/api/test", (req, res) => {
  res.json({
    ok: true,
    message: "API routes are working"
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/expenditures", require("./routes/expenditureRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only after MongoDB connection succeeds
async function startServer() {
  try {
    console.log(
      "MONGO_URI loaded:",
      process.env.MONGO_URI ? "YES" : "NO"
    );

    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`GBMS API listening on port ${PORT}`);
      scheduleDetectionJob();
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();