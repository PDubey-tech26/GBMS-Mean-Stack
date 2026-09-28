const Expenditure = require("../models/Expenditure");
const Budget = require("../models/Budget");
const { logAction } = require("../services/auditService");
const { runDetectionForBudget } = require("../services/anomalyDetection");

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.budget) filter.budget = req.query.budget;
    if (req.query.department) filter.department = req.query.department;

    if (req.user.role === "department_head" && req.user.department) {
      filter.department = req.user.department;
    }

    const expenditures = await Expenditure.find(filter)
      .populate("budget", "category allocatedAmount")
      .populate("department", "name code")
      .sort({ transactionDate: -1 });

    res.json(expenditures);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id)
      .populate("budget", "category allocatedAmount")
      .populate("department", "name code");
    if (!expenditure) return res.status(404).json({ message: "Expenditure not found" });
    res.json(expenditure);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { budget, amount, category, description, transactionDate } = req.body;

    if (!budget || amount === undefined || !category) {
      return res.status(400).json({ message: "budget, amount and category are required" });
    }
    if (amount < 0) {
      return res.status(400).json({ message: "amount cannot be negative" });
    }

    const budgetDoc = await Budget.findById(budget);
    if (!budgetDoc) return res.status(404).json({ message: "Budget not found" });

    // department_head may only record expenditure for their own department
    if (req.user.role === "department_head" && String(budgetDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: "You can only record expenditure for your own department" });
    }

    const supportingDocument = req.file ? `/uploads/${req.file.filename}` : null;

    const expenditure = await Expenditure.create({
      budget,
      department: budgetDoc.department,
      amount,
      category,
      description,
      transactionDate: transactionDate || new Date(),
      supportingDocument,
      createdBy: req.user._id
    });

    await logAction({
      user: req.user._id,
      action: "CREATE",
      entity: "Expenditure",
      entityId: expenditure._id,
      details: { budget, amount, category }
    });

    // Run anomaly detection immediately for this budget
    await runDetectionForBudget(budget);

    res.status(201).json(expenditure);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) return res.status(404).json({ message: "Expenditure not found" });

    if (req.body.amount !== undefined && req.body.amount < 0) {
      return res.status(400).json({ message: "amount cannot be negative" });
    }

    ["amount", "category", "description", "transactionDate"].forEach((field) => {
      if (req.body[field] !== undefined) expenditure[field] = req.body[field];
    });
    if (req.file) {
      expenditure.supportingDocument = `/uploads/${req.file.filename}`;
    }

    await expenditure.save();
    await logAction({ user: req.user._id, action: "UPDATE", entity: "Expenditure", entityId: expenditure._id, details: req.body });
    await runDetectionForBudget(expenditure.budget);

    res.json(expenditure);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) return res.status(404).json({ message: "Expenditure not found" });

    const budgetId = expenditure.budget;
    await expenditure.deleteOne();
    await logAction({ user: req.user._id, action: "DELETE", entity: "Expenditure", entityId: expenditure._id, details: {} });
    await runDetectionForBudget(budgetId);

    res.json({ message: "Expenditure deleted" });
  } catch (err) {
    next(err);
  }
};

exports.categorySummary = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "department_head" && req.user.department) {
      filter.department = req.user.department;
    }
    const results = await Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);
    res.json(results.map((r) => ({ category: r._id, total: r.total })));
  } catch (err) {
    next(err);
  }
};
