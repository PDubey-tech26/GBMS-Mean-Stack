import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">GBMS</div>
      <div class="brand-sub">Budget Utilization Monitor</div>
    </div>
    <nav>
      <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
      <a routerLink="/departments" routerLinkActive="active">Departments</a>
      <a routerLink="/budgets" routerLinkActive="active">Budgets</a>
      <a routerLink="/expenditures" routerLinkActive="active">Expenditures</a>
      <a routerLink="/alerts" routerLinkActive="active">Alerts</a>
      <a routerLink="/reports" routerLinkActive="active"
   *ngIf="auth.hasRole('admin','finance_officer','department_head')">
   Reports
</a>
      <a routerLink="/admin" routerLinkActiv e="active" *ngIf="auth.hasRole('admin')">Admin Panel</a>
    </nav>
    <div class="user-box" *ngIf="auth.currentUser() as user">
      <div class="user-name">{{ user.name }}</div>
      <div class="user-role">{{ user.role.replace('_',' ') }}</div>
      <button class="secondary" (click)="auth.logout()">Log out</button>
    </div>
  </aside>
  `,
  styles: [`
    .sidebar { width: 230px; min-height: 100vh; background: #1d3557; color: #fff; display: flex; flex-direction: column; padding: 20px 0; }
    .brand { padding: 0 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 12px; }
    .brand-mark { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .brand-sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
    nav { display: flex; flex-direction: column; flex: 1; }
    nav a { padding: 12px 20px; font-size: 14px; opacity: 0.85; border-left: 3px solid transparent; }
    nav a:hover { background: rgba(255,255,255,0.06); }
    nav a.active { opacity: 1; border-left-color: #e63946; background: rgba(255,255,255,0.08); font-weight: 600; }
    .user-box { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.15); }
    .user-name { font-weight: 600; font-size: 14px; }
    .user-role { font-size: 11px; opacity: 0.7; text-transform: capitalize; margin-bottom: 10px; }
    .user-box button { width: 100%; }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}
}
