const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", default: null },
    alertType: {
      type: String,
      enum: ["UNDER_UTILIZATION", "OVERSPENDING", "SPENDING_SPIKE", "DEVIATION"],
      required: true
    },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    message: { type: String, required: true },
    utilizationPercent: { type: Number, default: null },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// avoid duplicate open alerts of same type for same budget
alertSchema.index({ budget: 1, alertType: 1, resolved: 1 });

module.exports = mongoose.model("Alert", alertSchema);
