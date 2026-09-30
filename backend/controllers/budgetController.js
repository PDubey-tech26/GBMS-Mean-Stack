const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Department = require("../models/Department");
const { logAction } = require("../services/auditService");
const { runDetectionForBudget } = require("../services/anomalyDetection");

async function utilizationFor(budgetId) {
  const budget = await Budget.findById(budgetId);

  if (!budget) {
    return null;
  }

  const expenditures = await Expenditure.find({
    budget: budgetId
  });

  const totalExpense = expenditures.reduce(
    (sum, expenditure) => sum + expenditure.amount,
    0
  );

  const allocated = budget.allocatedAmount || 0;
  const remaining = allocated - totalExpense;

  const utilization =
    allocated > 0
      ? (totalExpense / allocated) * 100
      : 0;

  return {
    budget,
    totalExpense,
    remaining,
    utilization: Math.round(utilization * 100) / 100
  };
}

/**
 * Check whether a user can access a particular budget.
 *
 * Admin and Finance Officer:
 *   Can access all budgets.
 *
 * Department Head:
 *   Can access only budgets belonging to their department.
 */
function canAccessBudget(user, budget) {
  if (user.role === "admin" || user.role === "finance_officer") {
    return true;
  }

  if (user.role === "department_head") {
    if (!user.department || !budget.department) {
      return false;
    }

    return (
      String(user.department) ===
      String(budget.department._id || budget.department)
    );
  }

  return false;
}

/**
 * GET /api/budgets
 * List budgets
 */
exports.list = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.financialYear) {
      filter.financialYear = req.query.financialYear;
    }

    // Department Head can only see their own department.
    if (req.user.role === "department_head") {
      if (!req.user.department) {
        return res.status(403).json({
          message: "Department is not assigned to this user"
        });
      }

      filter.department = req.user.department;
    }

    const budgets = await Budget.find(filter)
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/budgets/:id
 * Get single budget
 */
exports.getOne = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("department", "name code");

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    if (!canAccessBudget(req.user, budget)) {
      return res.status(403).json({
        message: "You can only access budgets from your department"
      });
    }

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/budgets/:id/utilization
 * Get budget utilization
 */
exports.utilization = async (req, res, next) => {
  try {
    const data = await utilizationFor(req.params.id);

    if (!data) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    if (!canAccessBudget(req.user, data.budget)) {
      return res.status(403).json({
        message: "You can only access utilization of your department's budgets"
      });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/budgets
 * Create budget
 * Allowed: Admin, Finance Officer
 */
exports.create = async (req, res, next) => {
  try {
    const {
      department,
      financialYear,
      quarter,
      category,
      allocatedAmount,
      allocationDate,
      description
    } = req.body;

    if (
      !department ||
      !financialYear ||
      !category ||
      allocatedAmount === undefined
    ) {
      return res.status(400).json({
        message:
          "department, financialYear, category and allocatedAmount are required"
      });
    }

    if (allocatedAmount < 0) {
      return res.status(400).json({
        message: "allocatedAmount cannot be negative"
      });
    }

    const dept = await Department.findById(department);

    if (!dept) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

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

    await logAction({
      user: req.user._id,
      action: "CREATE",
      entity: "Budget",
      entityId: budget._id,
      details: req.body
    });

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/budgets/:id
 * Update budget
 * Allowed: Admin, Finance Officer
 */
exports.update = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    if (
      req.body.allocatedAmount !== undefined &&
      req.body.allocatedAmount < 0
    ) {
      return res.status(400).json({
        message: "allocatedAmount cannot be negative"
      });
    }

    const allowedFields = [
      "financialYear",
      "quarter",
      "category",
      "allocatedAmount",
      "allocationDate",
      "description"
    ];

    allowedFields.forEach((field) => {
      if ((req.body[field] !== undefined)) {
        budget[field] = req.body[field];
      }
    });

    await budget.save();

    await logAction({
      user: req.user._id,
      action: "UPDATE",
      entity: "Budget",
      entityId: budget._id,
      details: req.body
    });

    await runDetectionForBudget(budget._id);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/budgets/:id
 * Delete budget
 * Allowed: Admin, Finance Officer
 */
exports.remove = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    const expenseCount = await Expenditure.countDocuments({
      budget: budget._id
    });

    if (expenseCount > 0) {
      return res.status(400).json({
        message: "Cannot delete a budget with recorded expenditures"
      });
    }

    await budget.deleteOne();

    await logAction({
      user: req.user._id,
      action: "DELETE",
      entity: "Budget",
      entityId: budget._id,
      details: {}
    });

    res.json({
      message: "Budget deleted"
    });
  } catch (err) {
    next(err);
  }
};

exports._utilizationFor = utilizationFor;