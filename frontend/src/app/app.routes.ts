import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'departments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/departments/departments.component').then((m) => m.DepartmentsComponent)
  },
  {
    path: 'budgets',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/budgets/budgets.component').then((m) => m.BudgetsComponent)
  },
  {
    path: 'expenditures',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/expenditures/expenditures.component').then((m) => m.ExpendituresComponent)
  },
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/alerts/alerts.component').then((m) => m.AlertsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard('admin', 'finance_officer')],
    loadComponent: () => import('./pages/reports/reports.component').then((m) => m.ReportsComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
