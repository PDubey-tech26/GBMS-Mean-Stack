const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Threshold = require("../models/Threshold");
const AuditLog = require("../models/AuditLog");
const { logAction } = require("../services/auditService");

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate("department", "name code").select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role, department: department || null });

    await logAction({ user: req.user._id, action: "CREATE", entity: "User", entityId: user._id, details: { role } });
    res.status(201).json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, department, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    await logAction({ user: req.user._id, action: "UPDATE", entity: "User", entityId: user._id, details: req.body });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

exports.getThresholds = async (req, res, next) => {
  try {
    let t = await Threshold.findOne({ key: "GLOBAL" });
    if (!t) t = await Threshold.create({ key: "GLOBAL" });
    res.json(t);
  } catch (err) {
    next(err);
  }
};

exports.updateThresholds = async (req, res, next) => {
  try {
    let t = await Threshold.findOne({ key: "GLOBAL" });
    if (!t) t = new Threshold({ key: "GLOBAL" });

    [
      "underUtilizationMaxPercent",
      "underUtilizationTimeElapsedPercent",
      "overspendingWarningPercent",
      "overspendingCriticalPercent",
      "spikeMultiplier"
    ].forEach((field) => {
      if (req.body[field] !== undefined) t[field] = req.body[field];
    });

    await t.save();
    await logAction({ user: req.user._id, action: "UPDATE", entity: "Threshold", entityId: t._id, details: req.body });
    res.json(t);
  } catch (err) {
    next(err);
  }
};

exports.auditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate("user", "name email role")
      .sort({ timestamp: -1 })
      .limit(500);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
