const Alert = require("../models/Alert");
const { runDetectionForAllBudgets } = require("../services/anomalyDetection");
const { logAction } = require("../services/auditService");

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.resolved !== undefined) filter.resolved = req.query.resolved === "true";
    if (req.query.department) filter.department = req.query.department;
    if (req.query.severity) filter.severity = req.query.severity;

    if (req.user.role === "department_head" && req.user.department) {
      filter.department = req.user.department;
    }

    const alerts = await Alert.find(filter)
      .populate("department", "name code")
      .populate("budget", "category")
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (err) {
    next(err);
  }
};

exports.resolve = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.resolved = true;
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();

    await logAction({ user: req.user._id, action: "UPDATE", entity: "Alert", entityId: alert._id, details: { resolved: true } });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

exports.runDetection = async (req, res, next) => {
  try {
    const results = await runDetectionForAllBudgets();
    res.json({ message: "Detection run complete", evaluated: results.length, results });
  } catch (err) {
    next(err);
  }
};
