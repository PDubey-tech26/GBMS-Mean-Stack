import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="auth-page">
    <div class="auth-card">
      <h1>Create Account</h1>
      <p class="subtitle">Register as a Finance Officer or Department Head</p>

      <div class="message error" *ngIf="error">{{ error }}</div>
      <div class="message success" *ngIf="success">{{ success }}</div>

      <form (ngSubmit)="submit()" *ngIf="!success">
        <label>Full Name</label>
        <input type="text" [(ngModel)]="name" name="name" required />

        <label style="margin-top:12px">Email</label>
        <input type="email" [(ngModel)]="email" name="email" required />

        <label style="margin-top:12px">Password (min 6 characters)</label>
        <input type="password" [(ngModel)]="password" name="password" required />

        <label style="margin-top:12px">Role</label>
        <select [(ngModel)]="role" name="role">
          <option value="department_head">Department Head</option>
          <option value="finance_officer">Finance Officer</option>
        </select>
        <p style="font-size:12px;color:#6b7280;margin-top:6px">
          Admin accounts can only be created by an existing administrator.
        </p>

        <button type="submit" style="margin-top:18px; width:100%" [disabled]="loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p style="margin-top:16px; font-size:13px; text-align:center; color:#6b7280">
        Already have an account? <a routerLink="/login" style="color:#457b9d; font-weight:600">Sign in</a>
      </p>
    </div>
  </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role = 'department_head';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.name || !this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Account created. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
  this.loading = false;

  console.log('REGISTER ERROR:', err);

  this.error =
    err?.error?.message ||
    err?.message ||
    `Registration failed (${err?.status || 'unknown'})`;
}
    });
  }
}