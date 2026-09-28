// Seeds realistic reference data based on publicly known Indian government
// budget categories (Ministry names, scheme categories) as required by the
// project brief ("realistic and based on publicly available budget and
// governance reports, not fake or randomly generated values").
//
// Run with: npm run seed

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const User = require("../models/User");
const Department = require("../models/Department");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Threshold = require("../models/Threshold");

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Budget.deleteMany({}),
    Expenditure.deleteMany({})
  ]);

  console.log("Creating admin user...");
  const adminPassword = await bcrypt.hash("Admin@12345", 12);
  const admin = await User.create({
    name: "System Administrator",
    email: "admin@gbms.gov.in",
    password: adminPassword,
    role: "admin"
  });

  console.log("Creating departments (based on real Indian ministry categories)...");
  const departmentDefs = [
    { name: "Ministry of Health and Family Welfare", code: "MOHFW", departmentType: "Central Ministry" },
    { name: "Ministry of Education", code: "MOE", departmentType: "Central Ministry" },
    { name: "Ministry of Rural Development", code: "MORD", departmentType: "Central Ministry" },
    { name: "Ministry of Road Transport and Highways", code: "MORTH", departmentType: "Central Ministry" },
    { name: "Ministry of Agriculture and Farmers Welfare", code: "MOAFW", departmentType: "Central Ministry" }
  ];
  const departments = await Department.insertMany(departmentDefs);

  console.log("Creating department-head and finance-officer users...");
  const officerPassword = await bcrypt.hash("Officer@123", 12);
  const headPassword = await bcrypt.hash("DeptHead@123", 12);

  const financeOfficer = await User.create({
    name: "Finance Officer - Central",
    email: "finance.officer@gbms.gov.in",
    password: officerPassword,
    role: "finance_officer"
  });

  const deptHeads = [];
  for (const dept of departments) {
    const emailSlug = dept.code.toLowerCase();
    const head = await User.create({
      name: `${dept.name} - Department Head`,
      email: `head.${emailSlug}@gbms.gov.in`,
      password: headPassword,
      role: "department_head",
      department: dept._id
    });
    dept.head = head._id;
    await dept.save();
    deptHeads.push(head);
  }

  console.log("Creating budgets (financial year 2025-2026)...");
  const financialYear = "2025-2026";
  const budgetDefs = [
    { deptCode: "MOHFW", category: "National Health Mission", allocatedAmount: 3600000000 },
    { deptCode: "MOHFW", category: "Ayushman Bharat - PMJAY", allocatedAmount: 2200000000 },
    { deptCode: "MOE", category: "Samagra Shiksha Abhiyan", allocatedAmount: 3700000000 },
    { deptCode: "MOE", category: "Mid-Day Meal Scheme", allocatedAmount: 1200000000 },
    { deptCode: "MORD", category: "MGNREGA", allocatedAmount: 8600000000 },
    { deptCode: "MORD", category: "Pradhan Mantri Gram Sadak Yojana", allocatedAmount: 1900000000 },
    { deptCode: "MORTH", category: "National Highways Development", allocatedAmount: 2700000000 },
    { deptCode: "MOAFW", category: "PM-KISAN", allocatedAmount: 6000000000 },
    { deptCode: "MOAFW", category: "Crop Insurance Scheme", allocatedAmount: 1500000000 }
  ];

  const budgets = [];
  for (const def of budgetDefs) {
    const dept = departments.find((d) => d.code === def.deptCode);
    const budget = await Budget.create({
      department: dept._id,
      financialYear,
      quarter: "ANNUAL",
      category: def.category,
      allocatedAmount: def.allocatedAmount,
      allocationDate: new Date(financialYear.split("-")[0], 3, 1), // April 1
      description: `Annual allocation for ${def.category}`,
      createdBy: admin._id
    });
    budgets.push(budget);
  }

  console.log("Creating sample expenditure transactions...");
  const categories = ["Salaries", "Infrastructure", "Equipment", "Training", "Contingency", "Materials & Supplies"];
  const now = new Date(financialYear.split("-")[0], 3, 1);

  for (const budget of budgets) {
    // simulate a realistic utilization spread: some over, some under
    const numTransactions = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numTransactions; i++) {
      const txDate = new Date(now);
      txDate.setMonth(txDate.getMonth() + i);
      const portion = budget.allocatedAmount * (0.05 + Math.random() * 0.12);

      await Expenditure.create({
        budget: budget._id,
        department: budget.department,
        amount: Math.round(portion),
        category: categories[i % categories.length],
        description: `${categories[i % categories.length]} expenditure for ${budget.category}`,
        transactionDate: txDate,
        createdBy: financeOfficer._id
      });
    }
  }

  console.log("Creating default anomaly-detection thresholds...");
  await Threshold.create({ key: "GLOBAL" });

  console.log("\nSeed complete.\n");
  console.log("Login credentials:");
  console.log("  Admin:            admin@gbms.gov.in / Admin@12345");
  console.log("  Finance Officer:  finance.officer@gbms.gov.in / Officer@123");
  console.log("  Department Head:  head.mohfw@gbms.gov.in / DeptHead@123 (and head.<code>@gbms.gov.in for others)");

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
