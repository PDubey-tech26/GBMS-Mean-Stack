const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // CREATE, UPDATE, DELETE
    entity: { type: String, required: true }, // Budget, Expenditure, Department, User
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
