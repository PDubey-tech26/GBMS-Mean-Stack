const Department = require("../models/Department");
const Budget = require("../models/Budget");
const { logAction } = require("../services/auditService");

exports.list = async (req, res, next) => {
  try {
    const departments = await Department.find().populate("head", "name email role").sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate("head", "name email role");
    if (!department) return res.status(404).json({ message: "Department not found" });
    res.json(department);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, code, departmentType, head } = req.body;
    if (!name || !code) return res.status(400).json({ message: "name and code are required" });

    const department = await Department.create({ name, code, departmentType, head: head || null });
    await logAction({ user: req.user._id, action: "CREATE", entity: "Department", entityId: department._id, details: req.body });
    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    ["name", "code", "departmentType", "head"].forEach((field) => {
      if (req.body[field] !== undefined) department[field] = req.body[field];
    });

    await department.save();
    await logAction({ user: req.user._id, action: "UPDATE", entity: "Department", entityId: department._id, details: req.body });
    res.json(department);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    const budgetCount = await Budget.countDocuments({ department: department._id });
    if (budgetCount > 0) {
      return res.status(400).json({ message: "Cannot delete a department with existing budgets" });
    }

    await department.deleteOne();
    await logAction({ user: req.user._id, action: "DELETE", entity: "Department", entityId: department._id, details: {} });
    res.json({ message: "Department deleted" });
  } catch (err) {
    next(err);
  }
};
