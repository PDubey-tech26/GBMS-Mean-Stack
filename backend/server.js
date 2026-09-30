require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { scheduleDetectionJob } = require("./services/anomalyDetection");

const app = express();

connectDB();

app.use(cors({
    origin: [
  "http://localhost:4200",
  "https://gbms-mean-stack.vercel.app",
  "https://gbms-mean-stack-apcx0huax-pdtech.vercel.app",
  "https://gbms-mean-stack-git-main-pdtech.vercel.app"
],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "AI-Based Budget Utilization Monitoring System API",
    status: "running",
    version: "1.0.0"
  });
});
app.get("/api/test", (req, res) => {
  res.json({
    ok: true,
    message: "API routes are working"
  });
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/expenditures", require("./routes/expenditureRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`GBMS API listening on port ${PORT}`);
  scheduleDetectionJob();
});
