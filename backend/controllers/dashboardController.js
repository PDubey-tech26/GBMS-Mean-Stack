const Department = require("../models/Department");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");

exports.summary = async (req, res, next) => {
  try {
   const isDeptHead = req.user.role === "department_head";

if (isDeptHead && !req.user.department) {
  return res.status(403).json({
    message: "Department is not assigned to this user"
  });
}

    const deptFilter = isDeptHead ? { _id: req.user.department } : {};
    const departments = await Department.find(deptFilter).sort({ name: 1 });

    const budgetFilter = isDeptHead ? { department: req.user.department } : {};
    const budgets = await Budget.find(budgetFilter);
    const budgetIds = budgets.map((b) => b._id);

    const expenditures = await Expenditure.find({ budget: { $in: budgetIds } }).sort({ transactionDate: -1 });

    const totalBudget = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalExpense = expenditures.reduce((s, e) => s + e.amount, 0);
    const remaining = totalBudget - totalExpense;
    const utilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

    const alertFilter = { resolved: false };
    if (isDeptHead) alertFilter.department = req.user.department;
    const openAlerts = await Alert.find(alertFilter).populate("department", "name").populate("budget", "category");

    const departmentRows = departments.map((dept) => {
      const deptBudgets = budgets.filter((b) => String(b.department) === String(dept._id));
      const deptBudgetIds = deptBudgets.map((b) => String(b._id));
      const deptExpenses = expenditures.filter((e) => deptBudgetIds.includes(String(e.budget)));

      const deptTotalBudget = deptBudgets.reduce((s, b) => s + b.allocatedAmount, 0);
      const deptTotalExpense = deptExpenses.reduce((s, e) => s + e.amount, 0);
      const deptUtilization = deptTotalBudget > 0 ? (deptTotalExpense / deptTotalBudget) * 100 : 0;

      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        totalBudget: deptTotalBudget,
        totalExpense: deptTotalExpense,
        utilization: Math.round(deptUtilization * 100) / 100
      };
    });

    const categoryMap = {};
    expenditures.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));

    res.json({
      summary: {
        totalDepartments: departments.length,
        totalBudgets: budgets.length,
        totalBudget,
        totalExpense,
        remaining,
        utilization: Math.round(utilization * 100) / 100,
        openAlertCount: openAlerts.length
      },
      departments: departmentRows,
      categoryBreakdown,
      recentExpenditures: expenditures.slice(0, 10),
      openAlerts: openAlerts.slice(0, 10)
    });
  } catch (err) {
    next(err);
  }
};
