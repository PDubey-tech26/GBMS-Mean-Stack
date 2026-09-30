const { logAction } = require("../services/auditService");
const bcrypt = require("bcryptjs");
const AuditLog = require("../models/AuditLog");
const express = require("express");
const router = express.Router();

const { authenticate, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Department = require("../models/Department");
const Threshold = require("../models/Threshold");

// Admin dashboard/test
router.get(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const users = await User.countDocuments();
      const departments = await Department.countDocuments();

      res.json({
        message: "Admin access granted",
        stats: {
          users,
          departments
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get all users - Admin only
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const users = await User.find()
        .select("-password")
        .populate("department", "name");

      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

// Create user - Admin only
router.post(
  "/users",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { name, email, password, role, department } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "name, email, password and role are required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters"
        });
      }

      const allowedRoles = [
        "admin",
        "finance_officer",
        "department_head"
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }

      const existing = await User.findOne({
        email: email.toLowerCase()
      });

      if (existing) {
        return res.status(400).json({
          message: "Email already registered"
        });
      }

      const hashed = await bcrypt.hash(password, 12);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
        department: department || null
      });

      await logAction({
        user: req.user._id,
        action: "CREATE",
        entity: "User",
        entityId: user._id,
        details: {
          name,
          email: user.email,
          role,
          department: department || null
        }
      });

      res.status(201).json({
        message: "User created successfully",
        user: user.toSafeObject()
      });
    } catch (err) {
      next(err);
    }
  }
);

// Activate / deactivate user - Admin only
router.patch(
  "/users/:id/status",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be true or false"
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Prevent admin from disabling their own account
      if (String(user._id) === String(req.user._id) && isActive === false) {
        return res.status(400).json({
          message: "You cannot disable your own admin account"
        });
      }

      user.isActive = isActive;
      await user.save();

      await logAction({
        user: req.user._id,
        action: "UPDATE",
        entity: "User",
        entityId: user._id,
        details: {
          field: "isActive",
          value: isActive
        }
      });

      res.json({
        message: isActive
          ? "User enabled successfully"
          : "User disabled successfully",
        user: user.toSafeObject()
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get anomaly detection thresholds - Admin only
router.get(
  "/thresholds",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      let threshold = await Threshold.findOne({ key: "GLOBAL" });

      if (!threshold) {
        threshold = await Threshold.create({ key: "GLOBAL" });
      }

      res.json(threshold);
    } catch (err) {
      next(err);
    }
  }
);

// Update anomaly detection thresholds - Admin only
router.put(
  "/thresholds",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const allowedFields = [
        "underUtilizationMaxPercent",
        "underUtilizationTimeElapsedPercent",
        "overspendingWarningPercent",
        "overspendingCriticalPercent",
        "spikeMultiplier"
      ];

      let threshold = await Threshold.findOne({ key: "GLOBAL" });

      if (!threshold) {
        threshold = await Threshold.create({ key: "GLOBAL" });
      }

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          threshold[field] = req.body[field];
        }
      });

      await threshold.save();

      res.json({
        message: "Thresholds updated successfully",
        threshold
      });
    } catch (err) {
      next(err);
    }
  }
);
// Get audit logs - Admin only
router.get(
  "/audit-logs",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const AuditLog = require("../models/AuditLog");

      const logs = await AuditLog.find()
        .populate("user", "name email role")
        .sort({ timestamp: -1 })
        .limit(200);

      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);
module.exports = router;
