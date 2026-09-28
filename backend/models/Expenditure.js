const mongoose = require("mongoose");

const expenditureSchema = new mongoose.Schema(
  {
    budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    transactionDate: { type: Date, required: true, default: Date.now },
    supportingDocument: { type: String, default: null }, // stored filename / path
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expenditure", expenditureSchema);
