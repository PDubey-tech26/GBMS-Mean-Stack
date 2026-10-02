require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env")
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const User = require("../models/User");
const Department = require("../models/Department");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Threshold = require("../models/Threshold");

const FINANCIAL_YEAR = "2025-2026";

async function seed() {
  await connectDB();

  console.log("======================================");
  console.log(" GBMS Public-Budget Reference Dataset");
  console.log("======================================");

  

  // ---------------------------------------------------------
  // 1. ADMIN
  // ---------------------------------------------------------

  let admin = await User.findOne({ email: "admin@gbms.gov.in" });

  if (!admin) {
    const password = await bcrypt.hash("Admin@12345", 12);

    admin = await User.create({
      name: "System Administrator",
      email: "admin@gbms.gov.in",
      password,
      role: "admin",
      isActive: true
    });

    console.log("Created admin user");
  } else {
    console.log("Existing admin preserved");
  }

  // ---------------------------------------------------------
  // 2. FINANCE OFFICER
  // ---------------------------------------------------------

  let financeOfficer = await User.findOne({
    email: "finance.officer@gbms.gov.in"
  });

  if (!financeOfficer) {
    const password = await bcrypt.hash("Officer@123", 12);

    financeOfficer = await User.create({
      name: "Finance Officer - Central",
      email: "finance.officer@gbms.gov.in",
      password,
      role: "finance_officer",
      isActive: true
    });

    console.log("Created finance officer");
  } else {
    console.log("Existing finance officer preserved");
  }

  // ---------------------------------------------------------
  // 3. DEPARTMENTS
  // ---------------------------------------------------------

  console.log("Creating/updating departments...");

  const departmentDefs = [
    {
      name: "Ministry of Health and Family Welfare",
      code: "MOHFW",
      departmentType: "Central Ministry"
    },
    {
      name: "Ministry of Education",
      code: "MOE",
      departmentType: "Central Ministry"
    },
    {
      name: "Ministry of Rural Development",
      code: "MORD",
      departmentType: "Central Ministry"
    },
    {
      name: "Ministry of Road Transport and Highways",
      code: "MORTH",
      departmentType: "Central Ministry"
    },
    {
      name: "Ministry of Agriculture and Farmers Welfare",
      code: "MOAFW",
      departmentType: "Central Ministry"
    }
  ];

  const departments = [];

  for (const def of departmentDefs) {
    const department = await Department.findOneAndUpdate(
      { code: def.code },
      {
        $set: {
          name: def.name,
          departmentType: def.departmentType
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    departments.push(department);
  }

  console.log(`Departments ready: ${departments.length}`);

  // ---------------------------------------------------------
  // 4. DEPARTMENT HEADS
  // ---------------------------------------------------------

  const headPassword = await bcrypt.hash("DeptHead@123", 12);

  for (const department of departments) {
    const email = `head.${department.code.toLowerCase()}@gbms.gov.in`;

    let head = await User.findOne({ email });

    if (!head) {
      head = await User.create({
        name: `${department.name} - Department Head`,
        email,
        password: headPassword,
        role: "department_head",
        department: department._id,
        isActive: true
      });

      console.log(`Created department head: ${email}`);
    } else {
      // Only ensure role/department mapping.
      // Existing password is NOT changed.
      head.role = "department_head";
      head.department = department._id;
      head.isActive = true;
      await head.save();

      console.log(`Updated department mapping: ${email}`);
    }

    department.head = head._id;
    await department.save();
  }

  // ---------------------------------------------------------
  // 5. BUDGET REFERENCE DATA
  // ---------------------------------------------------------

  /*
   * These are DEMONSTRATION allocations.
   *
   * Department/program names follow public Indian budget
   * structures. Amounts are application reference values,
   * not claims of actual government transaction records.
   *
   * Public reference:
   * Union Budget 2025-26,
   * Ministry of Finance, Government of India.
   */

  const budgetDefs = [
    {
      deptCode: "MOHFW",
      category: "National Health Mission",
      quarter: "ANNUAL",
      allocatedAmount: 3600000000
    },
    {
      deptCode: "MOHFW",
      category: "Health Infrastructure",
      quarter: "Q1",
      allocatedAmount: 900000000
    },
    {
      deptCode: "MOHFW",
      category: "Health Infrastructure",
      quarter: "Q2",
      allocatedAmount: 850000000
    },

    {
      deptCode: "MOE",
      category: "School Education and Literacy",
      quarter: "ANNUAL",
      allocatedAmount: 3700000000
    },
    {
      deptCode: "MOE",
      category: "Education Infrastructure",
      quarter: "Q1",
      allocatedAmount: 950000000
    },
    {
      deptCode: "MOE",
      category: "Digital Education",
      quarter: "Q2",
      allocatedAmount: 650000000
    },

    {
      deptCode: "MORD",
      category: "Rural Development",
      quarter: "ANNUAL",
      allocatedAmount: 8600000000
    },
    {
      deptCode: "MORD",
      category: "Rural Roads",
      quarter: "Q1",
      allocatedAmount: 1900000000
    },
    {
      deptCode: "MORD",
      category: "Employment Support",
      quarter: "Q3",
      allocatedAmount: 2100000000
    },

    {
      deptCode: "MORTH",
      category: "National Highways",
      quarter: "ANNUAL",
      allocatedAmount: 2700000000
    },
    {
      deptCode: "MORTH",
      category: "Road Infrastructure",
      quarter: "Q2",
      allocatedAmount: 1250000000
    },

    {
      deptCode: "MOAFW",
      category: "Agriculture and Farmers Welfare",
      quarter: "ANNUAL",
      allocatedAmount: 6000000000
    },
    {
      deptCode: "MOAFW",
      category: "Crop Insurance",
      quarter: "Q1",
      allocatedAmount: 1500000000
    },
    {
      deptCode: "MOAFW",
      category: "Agricultural Infrastructure",
      quarter: "Q4",
      allocatedAmount: 1100000000
    }
  ];

  console.log("Creating budget records...");

  const budgets = [];

  for (const def of budgetDefs) {
    const department = departments.find(
      (d) => d.code === def.deptCode
    );

    if (!department) continue;

    const existing = await Budget.findOne({
      department: department._id,
      financialYear: FINANCIAL_YEAR,
      quarter: def.quarter,
      category: def.category
    });

    if (existing) {
      budgets.push(existing);
      continue;
    }

    const budget = await Budget.create({
      department: department._id,
      financialYear: FINANCIAL_YEAR,
      quarter: def.quarter,
      category: def.category,
      allocatedAmount: def.allocatedAmount,
      allocationDate: new Date("2025-04-01"),
      description:
        `Public-budget-reference dataset for ${def.category}. ` +
        `Demonstration data based on government budget categories.`,
      createdBy: admin._id
    });

    budgets.push(budget);
  }

  console.log(`Budgets ready: ${budgets.length}`);

  // ---------------------------------------------------------
  // 6. FIXED EXPENDITURE DATA
  // ---------------------------------------------------------

  /*
   * NO Math.random().
   *
   * Fixed transaction values make the demo:
   * - reproducible
   * - auditable
   * - realistic
   * - suitable for testing anomaly detection
   */

  const expenditurePlans = {
    "National Health Mission": [
      ["2025-04-18", 420000000, "Medical Supplies"],
      ["2025-05-21", 510000000, "Primary Healthcare"],
      ["2025-06-17", 390000000, "Health Services"],
      ["2025-07-22", 470000000, "Medical Equipment"],
      ["2025-08-19", 530000000, "Medical Supplies"],
      ["2025-09-24", 610000000, "Health Services"]
    ],

    "Health Infrastructure": [
      ["2025-04-28", 170000000, "Infrastructure"],
      ["2025-05-26", 190000000, "Construction"],
      ["2025-06-23", 155000000, "Equipment"]
    ],

    "School Education and Literacy": [
      ["2025-04-15", 380000000, "School Infrastructure"],
      ["2025-05-20", 420000000, "Learning Materials"],
      ["2025-06-18", 450000000, "Teacher Support"],
      ["2025-07-23", 510000000, "School Infrastructure"],
      ["2025-08-20", 570000000, "Digital Education"],
      ["2025-09-25", 620000000, "Learning Materials"]
    ],

    "Education Infrastructure": [
      ["2025-04-25", 240000000, "Construction"],
      ["2025-05-27", 260000000, "Infrastructure"],
      ["2025-06-24", 210000000, "Equipment"]
    ],

    "Digital Education": [
      ["2025-05-12", 125000000, "Digital Infrastructure"],
      ["2025-06-16", 145000000, "Software and Services"],
      ["2025-07-18", 180000000, "Digital Equipment"]
    ],

    "Rural Development": [
      ["2025-04-16", 720000000, "Rural Employment"],
      ["2025-05-19", 810000000, "Rural Infrastructure"],
      ["2025-06-21", 690000000, "Community Development"],
      ["2025-07-24", 860000000, "Rural Employment"],
      ["2025-08-18", 920000000, "Rural Infrastructure"],
      ["2025-09-23", 780000000, "Community Development"]
    ],

    "Rural Roads": [
      ["2025-04-29", 210000000, "Road Construction"],
      ["2025-05-28", 260000000, "Road Maintenance"],
      ["2025-06-26", 240000000, "Road Construction"]
    ],

    "Employment Support": [
      ["2025-07-15", 390000000, "Employment Programme"],
      ["2025-08-20", 430000000, "Employment Programme"],
      ["2025-09-22", 470000000, "Employment Programme"]
    ],

    "National Highways": [
      ["2025-04-22", 230000000, "Highway Construction"],
      ["2025-05-24", 310000000, "Road Construction"],
      ["2025-06-20", 290000000, "Maintenance"],
      ["2025-07-25", 350000000, "Highway Construction"],
      ["2025-08-22", 420000000, "Maintenance"]
    ],

    "Road Infrastructure": [
      ["2025-05-18", 210000000, "Road Construction"],
      ["2025-06-22", 250000000, "Bridges"],
      ["2025-07-26", 310000000, "Road Maintenance"]
    ],

    "Agriculture and Farmers Welfare": [
      ["2025-04-17", 520000000, "Farmer Support"],
      ["2025-05-22", 610000000, "Agricultural Services"],
      ["2025-06-19", 580000000, "Farmer Support"],
      ["2025-07-21", 690000000, "Agricultural Infrastructure"],
      ["2025-08-23", 720000000, "Farmer Support"],
      ["2025-09-26", 650000000, "Agricultural Services"]
    ],

    "Crop Insurance": [
      ["2025-04-30", 160000000, "Crop Insurance"],
      ["2025-05-29", 180000000, "Crop Insurance"],
      ["2025-06-27", 210000000, "Crop Insurance"]
    ],

    "Agricultural Infrastructure": [
      ["2025-10-18", 140000000, "Storage Infrastructure"],
      ["2025-11-21", 170000000, "Irrigation"],
      ["2025-12-19", 190000000, "Agricultural Infrastructure"]
    ]
  };

  console.log("Creating fixed expenditure transactions...");

  let expenditureCount = 0;

  for (const budget of budgets) {
    const plan = expenditurePlans[budget.category];

    if (!plan) continue;

    for (const [date, amount, category] of plan) {
      const exists = await Expenditure.findOne({
        budget: budget._id,
        transactionDate: new Date(date),
        amount
      });

      if (exists) continue;

      await Expenditure.create({
        budget: budget._id,
        department: budget.department,
        amount,
        category,
        description:
          `Reference expenditure for ${budget.category}. ` +
          `Demonstration transaction based on public-budget sector classification.`,
        transactionDate: new Date(date),
        createdBy: financeOfficer._id
      });

      expenditureCount++;
    }
  }

  console.log(
    `New expenditure transactions created: ${expenditureCount}`
  );

  // ---------------------------------------------------------
  // 7. ANOMALY THRESHOLDS
  // ---------------------------------------------------------

  const threshold = await Threshold.findOne({ key: "GLOBAL" });

  if (!threshold) {
    await Threshold.create({
      key: "GLOBAL",
      underUtilizationMaxPercent: 40,
      underUtilizationTimeElapsedPercent: 70,
      overspendingWarningPercent: 90,
      overspendingCriticalPercent: 100,
      spikeMultiplier: 3
    });

    console.log("Created default anomaly thresholds");
  } else {
    console.log("Existing anomaly thresholds preserved");
  }

  // ---------------------------------------------------------
  // COMPLETE
  // ---------------------------------------------------------

  console.log("\n======================================");
  console.log(" GBMS SEED COMPLETE");
  console.log("======================================");

  console.log(`Departments: ${departments.length}`);
  console.log(`Budgets: ${budgets.length}`);
  console.log(`New expenditures: ${expenditureCount}`);

  console.log("\nReference source:");
  console.log(
    "Government of India - Union Budget 2025-26"
  );

  console.log(
    "Dataset note: amounts are demonstration/reference values, not actual government transactions."
  );

  await mongoose.connection.close();
  console.log("\nMongoDB connection closed.");
}

seed().catch((err) => {
  console.error("\nSeed failed:");
  console.error(err);
  process.exit(1);
});