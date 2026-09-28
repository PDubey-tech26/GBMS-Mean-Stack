const AuditLog = require("../models/AuditLog");

async function logAction({ user, action, entity, entityId, details }) {
  try {
    await AuditLog.create({ user, action, entity, entityId, details });
  } catch (err) {
    // Auditing must never break the primary request flow
    console.error("Audit log write failed:", err.message);
  }
}

module.exports = { logAction };
