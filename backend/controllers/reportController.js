const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");
const Department = require("../models/Department");

function getDepartmentFilter(req) {
  const isDeptHead = req.user.role === "department_head";

  if (isDeptHead && !req.user.department) {
    return {
      error: {
        status: 403,
        message: "Department is not assigned to this user"
      }
    };
  }

  return {
    filter: isDeptHead
      ? { department: req.user.department }
      : {}
  };
}


// ===============================
// CSV REPORT
// ===============================
exports.exportCsv = async (req, res, next) => {
  try {
    const type = req.query.type || "budgets";

    const { filter, error } = getDepartmentFilter(req);

    if (error) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    let rows = [];
    let fields = [];

    // -------------------------------
    // BUDGET CSV
    // -------------------------------
    if (type === "budgets") {
      const budgets = await Budget.find(filter)
        .populate("department", "name code")
        .lean();

      rows = budgets.map((b) => ({
        id: b._id,
        department: b.department ? b.department.name : "",
        financialYear: b.financialYear,
        category: b.category,
        allocatedAmount: b.allocatedAmount,
        allocationDate: b.allocationDate
      }));

      fields = [
        "id",
        "department",
        "financialYear",
        "category",
        "allocatedAmount",
        "allocationDate"
      ];
    }

    // -------------------------------
    // EXPENDITURE CSV
    // -------------------------------
    else if (type === "expenditures") {
      const expenditures = await Expenditure.find(filter)
        .populate("department", "name")
        .populate("budget", "category")
        .lean();

      rows = expenditures.map((e) => ({
        id: e._id,
        department: e.department ? e.department.name : "",
        budgetCategory: e.budget ? e.budget.category : "",
        amount: e.amount,
        category: e.category,
        transactionDate: e.transactionDate
      }));

      fields = [
        "id",
        "department",
        "budgetCategory",
        "amount",
        "category",
        "transactionDate"
      ];
    }

    // -------------------------------
    // ALERT CSV
    // -------------------------------
    else if (type === "alerts") {
      const alerts = await Alert.find(filter)
        .populate("department", "name")
        .populate("budget", "category")
        .lean();

      rows = alerts.map((a) => ({
        id: a._id,
        department: a.department ? a.department.name : "",
        budgetCategory: a.budget ? a.budget.category : "",
        alertType: a.alertType,
        severity: a.severity,
        utilizationPercent: a.utilizationPercent,
        resolved: a.resolved,
        createdAt: a.createdAt
      }));

      fields = [
        "id",
        "department",
        "budgetCategory",
        "alertType",
        "severity",
        "utilizationPercent",
        "resolved",
        "createdAt"
      ];
    }

    // -------------------------------
    // INVALID TYPE
    // -------------------------------
    else {
      return res.status(400).json({
        message:
          "type must be one of: budgets, expenditures, alerts"
      });
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`${type}-report.csv`);
    res.send(csv);

  } catch (err) {
    next(err);
  }
};


// ===============================
// PDF REPORT
// ===============================
exports.exportPdf = async (req, res, next) => {
  try {
    const { filter, error } = getDepartmentFilter(req);

    if (error) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    const isDeptHead = req.user.role === "department_head";

    // -------------------------------
    // GET DEPARTMENTS
    // -------------------------------
    const departments = await Department.find(
      isDeptHead
        ? { _id: req.user.department }
        : {}
    ).sort({ name: 1 });

    // -------------------------------
    // GET BUDGETS
    // -------------------------------
    const budgets = await Budget.find(filter)
      .populate("department", "name code")
      .lean();

    // -------------------------------
    // GET EXPENDITURES
    // -------------------------------
    const expenditures = await Expenditure.find(filter)
      .lean();

    // -------------------------------
    // CALCULATE SUMMARY
    // -------------------------------
    const totalBudget = budgets.reduce(
      (sum, budget) => sum + Number(budget.allocatedAmount || 0),
      0
    );

    const totalExpense = expenditures.reduce(
      (sum, expenditure) => sum + Number(expenditure.amount || 0),
      0
    );

    const utilization =
      totalBudget > 0
        ? (totalExpense / totalBudget) * 100
        : 0;

    // -------------------------------
    // PDF RESPONSE
    // -------------------------------
    res.header("Content-Type", "application/pdf");
    res.attachment("budget-utilization-summary.pdf");

    const doc = new PDFDocument({
      margin: 40
    });

    doc.pipe(res);

    // -------------------------------
    // TITLE
    // -------------------------------
    doc
      .fontSize(18)
      .text(
        "AI-Based Budget Utilization Monitoring System",
        {
          align: "center"
        }
      );

    doc
      .fontSize(12)
      .text(
        "Budget Utilization Summary Report",
        {
          align: "center"
        }
      );

    doc.moveDown();

    doc
      .fontSize(10)
      .text(
        `Generated: ${new Date().toLocaleString()}`
      );

    // -------------------------------
    // REPORT TYPE
    // -------------------------------
    doc.moveDown();

    if (isDeptHead) {
      const department = departments[0];

      doc
        .fontSize(10)
        .text(
          `Department: ${
            department
              ? `${department.name} (${department.code})`
              : "Assigned Department"
          }`
        );
    } else {
      doc
        .fontSize(10)
        .text("Report Scope: All Departments");
    }

    doc.moveDown();

    // -------------------------------
    // OVERALL SUMMARY
    // -------------------------------
    doc
      .fontSize(13)
      .text("Overall Summary", {
        underline: true
      });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Departments: ${departments.length}`);

    doc.text(
      `Total Allocated Budget: ${totalBudget.toFixed(2)}`
    );

    doc.text(
      `Total Expenditure: ${totalExpense.toFixed(2)}`
    );

    doc.text(
      `Overall Utilization: ${utilization.toFixed(2)}%`
    );

    doc.moveDown();

    // -------------------------------
    // DEPARTMENT-WISE BREAKDOWN
    // -------------------------------
    doc
      .fontSize(13)
      .text("Department-wise Breakdown", {
        underline: true
      });

    doc.moveDown(0.5);

    for (const dept of departments) {

      const deptBudgets = budgets.filter(
        (budget) =>
          budget.department &&
          String(budget.department._id) ===
            String(dept._id)
      );

      const deptTotal = deptBudgets.reduce(
        (sum, budget) =>
          sum + Number(budget.allocatedAmount || 0),
        0
      );

      const deptBudgetIds = deptBudgets.map(
        (budget) => String(budget._id)
      );

      const deptExpense = expenditures
        .filter((expenditure) =>
          deptBudgetIds.includes(
            String(expenditure.budget)
          )
        )
        .reduce(
          (sum, expenditure) =>
            sum + Number(expenditure.amount || 0),
          0
        );

      const deptUtil =
        deptTotal > 0
          ? (deptExpense / deptTotal) * 100
          : 0;

      doc
        .fontSize(11)
        .text(
          `${dept.name} (${dept.code})`
        );

      doc
        .fontSize(9)
        .text(
          `Allocated: ${deptTotal.toFixed(2)} | ` +
          `Spent: ${deptExpense.toFixed(2)} | ` +
          `Utilization: ${deptUtil.toFixed(1)}%`
        );

      doc.moveDown(0.3);
    }

    // -------------------------------
    // END PDF
    // -------------------------------
    doc.end();

  } catch (err) {
    next(err);
  }
};