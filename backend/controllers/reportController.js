const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");
const Department = require("../models/Department");

exports.exportCsv = async (req, res, next) => {
  try {
    const type = req.query.type || "budgets";
    let rows = [];
    let fields = [];

    if (type === "budgets") {
      const budgets = await Budget.find().populate("department", "name code").lean();
      rows = budgets.map((b) => ({
        id: b._id,
        department: b.department ? b.department.name : "",
        financialYear: b.financialYear,
        category: b.category,
        allocatedAmount: b.allocatedAmount,
        allocationDate: b.allocationDate
      }));
      fields = ["id", "department", "financialYear", "category", "allocatedAmount", "allocationDate"];
    } else if (type === "expenditures") {
      const expenditures = await Expenditure.find().populate("department", "name").populate("budget", "category").lean();
      rows = expenditures.map((e) => ({
        id: e._id,
        department: e.department ? e.department.name : "",
        budgetCategory: e.budget ? e.budget.category : "",
        amount: e.amount,
        category: e.category,
        transactionDate: e.transactionDate
      }));
      fields = ["id", "department", "budgetCategory", "amount", "category", "transactionDate"];
    } else if (type === "alerts") {
      const alerts = await Alert.find().populate("department", "name").populate("budget", "category").lean();
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
      fields = ["id", "department", "budgetCategory", "alertType", "severity", "utilizationPercent", "resolved", "createdAt"];
    } else {
      return res.status(400).json({ message: "type must be one of: budgets, expenditures, alerts" });
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

exports.exportPdf = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const budgets = await Budget.find().populate("department", "name");
    const expenditures = await Expenditure.find();

    const totalBudget = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalExpense = expenditures.reduce((s, e) => s + e.amount, 0);
    const utilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

    res.header("Content-Type", "application/pdf");
    res.attachment("budget-utilization-summary.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text("AI-Based Budget Utilization Monitoring System", { align: "center" });
    doc.fontSize(12).text("Budget Utilization Summary Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(13).text("Overall Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Departments: ${departments.length}`);
    doc.text(`Total Allocated Budget: ${totalBudget.toFixed(2)}`);
    doc.text(`Total Expenditure: ${totalExpense.toFixed(2)}`);
    doc.text(`Overall Utilization: ${utilization.toFixed(2)}%`);
    doc.moveDown();

    doc.fontSize(13).text("Department-wise Breakdown", { underline: true });
    doc.moveDown(0.5);

    for (const dept of departments) {
      const deptBudgets = budgets.filter((b) => String(b.department._id) === String(dept._id));
      const deptTotal = deptBudgets.reduce((s, b) => s + b.allocatedAmount, 0);
      const deptBudgetIds = deptBudgets.map((b) => String(b._id));
      const deptExpense = expenditures
        .filter((e) => deptBudgetIds.includes(String(e.budget)))
        .reduce((s, e) => s + e.amount, 0);
      const deptUtil = deptTotal > 0 ? (deptExpense / deptTotal) * 100 : 0;

      doc.fontSize(11).text(`${dept.name} (${dept.code})`, { continued: false });
      doc.fontSize(9).text(
        `  Allocated: ${deptTotal.toFixed(2)}  |  Spent: ${deptExpense.toFixed(2)}  |  Utilization: ${deptUtil.toFixed(1)}%`
      );
      doc.moveDown(0.3);
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};
