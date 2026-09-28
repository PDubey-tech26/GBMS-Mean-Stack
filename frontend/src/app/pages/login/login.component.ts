import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="auth-page">
    <div class="auth-card">
      <h1>Government Budget Monitoring</h1>
      <p class="subtitle">Sign in to access the utilization dashboard</p>

      <div class="message error" *ngIf="error">{{ error }}</div>

      <form (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" [(ngModel)]="email" name="email" required placeholder="you@department.gov.in" />

        <label style="margin-top:12px">Password</label>
        <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" />

        <button type="submit" style="margin-top:18px; width:100%" [disabled]="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p style="margin-top:16px; font-size:13px; text-align:center; color:#6b7280">
        No account? <a routerLink="/register" style="color:#457b9d; font-weight:600">Register</a>
      </p>
    </div>
  </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Login failed'; }
    });
  }
}
