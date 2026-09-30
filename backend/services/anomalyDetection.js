const cron = require("node-cron");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");
const Threshold = require("../models/Threshold");


function getFiscalYearBounds(referenceDate) {
  const startMonth = parseInt(process.env.FISCAL_YEAR_START_MONTH || "4", 10) - 1; // 0-indexed
  const d = new Date(referenceDate);
  let startYear = d.getFullYear();
  if (d.getMonth() < startMonth) {
    startYear -= 1;
  }
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(startYear + 1, startMonth, 1);
  return { start, end };
}

function percentElapsed(start, end, now = new Date()) {
  const total = end.getTime() - start.getTime();
  const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
  return (elapsed / total) * 100;
}

async function getThresholds() {
  let t = await Threshold.findOne({ key: "GLOBAL" });
  if (!t) {
    t = await Threshold.create({ key: "GLOBAL" });
  }
  return t;
}

async function upsertAlert({ department, budget, alertType, severity, message, utilizationPercent }) {
  const existing = await Alert.findOne({ budget, alertType, resolved: false });
  if (existing) {
    existing.message = message;
    existing.severity = severity;
    existing.utilizationPercent = utilizationPercent;
    await existing.save();
    return existing;
  }
  return Alert.create({ department, budget, alertType, severity, message, utilizationPercent });
}

// -------------------------------------------------------------------------
// Core detection routine - run for a single budget
// -------------------------------------------------------------------------
async function evaluateBudget(budget, thresholds) {
  const expenditures = await Expenditure.find({ budget: budget._id }).sort({ transactionDate: 1 });

  const totalExpense = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const allocated = budget.allocatedAmount || 0;
  const utilization = allocated > 0 ? (totalExpense / allocated) * 100 : 0;

  const { start, end } = getFiscalYearBounds(budget.allocationDate);
  const elapsedPercent = percentElapsed(start, end);

  // 1. Overspending / deviation beyond approved budget
  if (utilization >= thresholds.overspendingCriticalPercent) {
    await upsertAlert({
      department: budget.department,
      budget: budget._id,
      alertType: "OVERSPENDING",
      severity: "CRITICAL",
      message: `Budget "${budget.category}" has exceeded its allocation (${utilization.toFixed(1)}% utilized).`,
      utilizationPercent: utilization
    });
  } else if (utilization >= thresholds.overspendingWarningPercent) {
    await upsertAlert({
      department: budget.department,
      budget: budget._id,
      alertType: "OVERSPENDING",
      severity: "HIGH",
      message: `Budget "${budget.category}" is nearing its limit (${utilization.toFixed(1)}% utilized).`,
      utilizationPercent: utilization
    });
  } else {
    await Alert.updateMany(
      { budget: budget._id, alertType: "OVERSPENDING", resolved: false },
      { resolved: true, resolvedAt: new Date() }
    );
  }

  // 2. Under-utilization: most of the fiscal year has elapsed but spend is low
  if (
    elapsedPercent >= thresholds.underUtilizationTimeElapsedPercent &&
    utilization < thresholds.underUtilizationMaxPercent
  ) {
    await upsertAlert({
      department: budget.department,
      budget: budget._id,
      alertType: "UNDER_UTILIZATION",
      severity: "MEDIUM",
      message: `Budget "${budget.category}" is under-utilized: ${utilization.toFixed(
        1
      )}% spent with ${elapsedPercent.toFixed(0)}% of the fiscal year elapsed.`,
      utilizationPercent: utilization
    });
  } else {
    await Alert.updateMany(
      { budget: budget._id, alertType: "UNDER_UTILIZATION", resolved: false },
      { resolved: true, resolvedAt: new Date() }
    );
  }

  // 3. Spending spike detection: latest transaction far above historical average
  if (expenditures.length >= 3) {
    const latest = expenditures[expenditures.length - 1];
    const previous = expenditures.slice(0, -1);
    const avgPrevious = previous.reduce((s, e) => s + e.amount, 0) / previous.length;

    if (avgPrevious > 0 && latest.amount > avgPrevious * thresholds.spikeMultiplier) {
      await upsertAlert({
        department: budget.department,
        budget: budget._id,
        alertType: "SPENDING_SPIKE",
        severity: "HIGH",
        message: `Unusual spending spike in "${budget.category}": latest transaction (${latest.amount}) is ${(
          latest.amount / avgPrevious
        ).toFixed(1)}x the recent average (${avgPrevious.toFixed(2)}).`,
        utilizationPercent: utilization
      });
    }
  }

  return { budgetId: budget._id, utilization, elapsedPercent };
}

async function runDetectionForAllBudgets() {
  const thresholds = await getThresholds();
  const budgets = await Budget.find();
  const results = [];
  for (const budget of budgets) {
    results.push(await evaluateBudget(budget, thresholds));
  }
  return results;
}

async function runDetectionForBudget(budgetId) {
  const thresholds = await getThresholds();
  const budget = await Budget.findById(budgetId);
  if (!budget) return null;
  return evaluateBudget(budget, thresholds);
}

function scheduleDetectionJob() {
  // Runs every hour; also triggered synchronously after each new expenditure.
  cron.schedule("0 * * * *", async () => {
    try {
      await runDetectionForAllBudgets();
      console.log("[anomaly-detection] scheduled scan complete");
    } catch (err) {
      console.error("[anomaly-detection] scheduled scan failed:", err.message);
    }
  });
}

module.exports = {
  runDetectionForAllBudgets,
  runDetectionForBudget,
  scheduleDetectionJob,
  getFiscalYearBounds,
  percentElapsed
};
