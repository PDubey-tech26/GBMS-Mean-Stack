const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    financialYear: { type: String, required: true }, // e.g. "2025-2026"
    quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4", "ANNUAL"], default: "ANNUAL" },
    category: { type: String, required: true, trim: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    allocationDate: { type: Date, required: true, default: Date.now },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
