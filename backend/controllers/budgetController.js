const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Department = require("../models/Department");
const { logAction } = require("../services/auditService");
const { runDetectionForBudget } = require("../services/anomalyDetection");

async function utilizationFor(budgetId) {
  const budget = await Budget.findById(budgetId);
  if (!budget) return null;
  const expenditures = await Expenditure.find({ budget: budgetId });
  const totalExpense = expenditures.reduce((s, e) => s + e.amount, 0);
  const allocated = budget.allocatedAmount || 0;
  const remaining = allocated - totalExpense;
  const utilization = allocated > 0 ? (totalExpense / allocated) * 100 : 0;
  return { budget, totalExpense, remaining, utilization: Math.round(utilization * 100) / 100 };
}

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.financialYear) filter.financialYear = req.query.financialYear;

    // department_head can only see their own department's budgets
    if (req.user.role === "department_head" && req.user.department) {
      filter.department = req.user.department;
    }

    const budgets = await Budget.find(filter).populate("department", "name code").sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id).populate("department", "name code");
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

exports.utilization = async (req, res, next) => {
  try {
    const data = await utilizationFor(req.params.id);
    if (!data) return res.status(404).json({ message: "Budget not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { department, financialYear, quarter, category, allocatedAmount, allocationDate, description } = req.body;

    if (!department || !financialYear || !category || allocatedAmount === undefined) {
      return res.status(400).json({ message: "department, financialYear, category and allocatedAmount are required" });
    }
    if (allocatedAmount < 0) {
      return res.status(400).json({ message: "allocatedAmount cannot be negative" });
    }

    const dept = await Department.findById(department);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const budget = await Budget.create({
      department,
      financialYear,
      quarter,
      category,
      allocatedAmount,
      allocationDate: allocationDate || new Date(),
      description,
      createdBy: req.user._id
    });

    await logAction({ user: req.user._id, action: "CREATE", entity: "Budget", entityId: budget._id, details: req.body });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    if (req.body.allocatedAmount !== undefined && req.body.allocatedAmount < 0) {
      return res.status(400).json({ message: "allocatedAmount cannot be negative" });
    }

    ["financialYear", "quarter", "category", "allocatedAmount", "allocationDate", "description"].forEach((field) => {
      if (req.body[field] !== undefined) budget[field] = req.body[field];
    });

    await budget.save();
    await logAction({ user: req.user._id, action: "UPDATE", entity: "Budget", entityId: budget._id, details: req.body });
    await runDetectionForBudget(budget._id);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    const expenseCount = await Expenditure.countDocuments({ budget: budget._id });
    if (expenseCount > 0) {
      return res.status(400).json({ message: "Cannot delete a budget with recorded expenditures" });
    }

    await budget.deleteOne();
    await logAction({ user: req.user._id, action: "DELETE", entity: "Budget", entityId: budget._id, details: {} });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    next(err);
  }
};

exports._utilizationFor = utilizationFor;
