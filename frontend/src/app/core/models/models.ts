export type UserRole =
  'admin' |
  'finance_officer' |
  'department_head';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department | string | null;
  isActive: boolean;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  departmentType: string;
  head?: User | string | null;
}

export interface Budget {
  _id: string;
  department: Department | string;
  financialYear: string;
  quarter: string;
  category: string;
  allocatedAmount: number;
  allocationDate: string;
  description?: string;
}

export interface Expenditure {
  _id: string;
  budget: Budget | string;
  department: Department | string;
  amount: number;
  category: string;
  description?: string;
  transactionDate: string;
  supportingDocument?: string | null;
}

export interface AlertItem {
  _id: string;
  department: Department | string;
  budget: Budget | string;
  alertType:
    | 'UNDER_UTILIZATION'
    | 'OVERSPENDING'
    | 'SPENDING_SPIKE'
    | 'DEVIATION';
  severity:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL';
  message: string;
  utilizationPercent: number | null;
  resolved: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  summary: {
    totalDepartments: number;
    totalBudgets: number;
    totalBudget: number;
    totalExpense: number;
    remaining: number;
    utilization: number;
    openAlertCount: number;
  };

  departments: Array<{
    id: string;
    name: string;
    code: string;
    totalBudget: number;
    totalExpense: number;
    utilization: number;
  }>;

  categoryBreakdown: Array<{
    category: string;
    total: number;
  }>;

  // Monthly expenditure trend
  spendingTrend: Array<{
    key: string;
    month: string;
    total: number;
  }>;

  recentExpenditures: Expenditure[];

  openAlerts: AlertItem[];
}