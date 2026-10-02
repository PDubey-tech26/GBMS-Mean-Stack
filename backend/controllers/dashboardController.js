const Department = require("../models/Department");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");

exports.summary = async (req, res, next) => {
  try {
    const isDeptHead = req.user.role === "department_head";

    // Department Head must have a department assigned
    if (isDeptHead && !req.user.department) {
      return res.status(403).json({
        message: "Department is not assigned to this user"
      });
    }

    // ---------------------------------------------------------
    // DEPARTMENT FILTER
    // ---------------------------------------------------------

    const deptFilter = isDeptHead
      ? { _id: req.user.department }
      : {};

    const departments = await Department.find(deptFilter)
      .sort({ name: 1 });

    // ---------------------------------------------------------
    // BUDGET FILTER
    // ---------------------------------------------------------

    const budgetFilter = isDeptHead
      ? { department: req.user.department }
      : {};

    const budgets = await Budget.find(budgetFilter);

    const budgetIds = budgets.map((b) => b._id);

    // ---------------------------------------------------------
    // EXPENDITURE DATA
    // ---------------------------------------------------------

    const expenditures = await Expenditure.find({
      budget: { $in: budgetIds }
    }).sort({
      transactionDate: -1
    });

    // ---------------------------------------------------------
    // SUMMARY CALCULATIONS
    // ---------------------------------------------------------

    const totalBudget = budgets.reduce(
      (sum, budget) => sum + budget.allocatedAmount,
      0
    );

    const totalExpense = expenditures.reduce(
      (sum, expenditure) => sum + expenditure.amount,
      0
    );

    const remaining = totalBudget - totalExpense;

    const utilization =
      totalBudget > 0
        ? (totalExpense / totalBudget) * 100
        : 0;

    // ---------------------------------------------------------
    // ALERTS
    // ---------------------------------------------------------

    const alertFilter = {
      resolved: false
    };

    if (isDeptHead) {
      alertFilter.department = req.user.department;
    }

    const openAlerts = await Alert.find(alertFilter)
      .populate("department", "name")
      .populate("budget", "category");

    // ---------------------------------------------------------
    // DEPARTMENT-WISE DATA
    // ---------------------------------------------------------

    const departmentRows = departments.map((dept) => {
      const deptBudgets = budgets.filter(
        (budget) =>
          String(budget.department) === String(dept._id)
      );

      const deptBudgetIds = deptBudgets.map(
        (budget) => String(budget._id)
      );

      const deptExpenses = expenditures.filter(
        (expense) =>
          deptBudgetIds.includes(String(expense.budget))
      );

      const deptTotalBudget = deptBudgets.reduce(
        (sum, budget) =>
          sum + budget.allocatedAmount,
        0
      );

      const deptTotalExpense = deptExpenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );

      const deptUtilization =
        deptTotalBudget > 0
          ? (deptTotalExpense / deptTotalBudget) * 100
          : 0;

      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        totalBudget: deptTotalBudget,
        totalExpense: deptTotalExpense,
        utilization:
          Math.round(deptUtilization * 100) / 100
      };
    });

    // ---------------------------------------------------------
    // CATEGORY BREAKDOWN
    // ---------------------------------------------------------

    const categoryMap = {};

    expenditures.forEach((expense) => {
      categoryMap[expense.category] =
        (categoryMap[expense.category] || 0) +
        expense.amount;
    });

    const categoryBreakdown = Object.entries(
      categoryMap
    ).map(([category, total]) => ({
      category,
      total
    }));

    // ---------------------------------------------------------
    // MONTHLY SPENDING TREND
    // ---------------------------------------------------------

    const monthlyMap = {};

    expenditures.forEach((expense) => {
      const date = new Date(expense.transactionDate);

      const year = date.getFullYear();
      const month = date.getMonth();

      const key = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          year,
          month,
          totalExpense: 0
        };
      }

      monthlyMap[key].totalExpense += expense.amount;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const date = new Date(
          value.year,
          value.month,
          1
        );

        return {
          month: date.toLocaleString("en-US", {
            month: "short",
            year: "numeric"
          }),
          totalExpense:
            Math.round(value.totalExpense * 100) / 100
        };
      });

    // ---------------------------------------------------------
    // FINAL RESPONSE
    // ---------------------------------------------------------

    res.json({
      summary: {
        totalDepartments: departments.length,
        totalBudgets: budgets.length,
        totalBudget,
        totalExpense,
        remaining,
        utilization:
          Math.round(utilization * 100) / 100,
        openAlertCount: openAlerts.length
      },

      departments: departmentRows,

      categoryBreakdown,

      monthlyTrend,

      recentExpenditures:
        expenditures.slice(0, 10),

      openAlerts:
        openAlerts.slice(0, 10)
    });
  } catch (err) {
    next(err);
  }
};