import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { DepartmentService } from '../../core/services/department.service';
import { User, Department } from '../../core/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  tab: 'users' | 'thresholds' | 'audit' = 'users';

  users: User[] = [];
  departments: Department[] = [];
  thresholds: any = null;
  auditLogs: any[] = [];

  error = '';
  success = '';

  newUser: any = { name: '', email: '', password: '', role: 'department_head', department: '' };

  constructor(private adminService: AdminService, private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.departmentService.list().subscribe((res) => (this.departments = res));
    this.loadUsers();
    this.loadThresholds();
  }

  setTab(t: 'users' | 'thresholds' | 'audit') {
    this.tab = t;
    if (t === 'audit' && this.auditLogs.length === 0) this.loadAuditLogs();
  }

  loadUsers() {
    this.adminService.listUsers().subscribe({
      next: (res) => (this.users = res),
      error: (err) => (this.error = err?.error?.message || 'Failed to load users')
    });
  }

  loadThresholds() {
    this.adminService.getThresholds().subscribe({
      next: (res) => (this.thresholds = res),
      error: (err) => (this.error = err?.error?.message || 'Failed to load thresholds')
    });
  }

  loadAuditLogs() {
    this.adminService.auditLogs().subscribe({
      next: (res) => (this.auditLogs = res),
      error: (err) => (this.error = err?.error?.message || 'Failed to load audit logs')
    });
  }

  createUser() {
    this.error = ''; this.success = '';
    this.adminService.createUser(this.newUser).subscribe({
      next: () => {
        this.success = 'User created.';
        this.newUser = { name: '', email: '', password: '', role: 'department_head', department: '' };
        this.loadUsers();
      },
      error: (err) => (this.error = err?.error?.message || 'Failed to create user')
    });
  }

  toggleActive(u: User) {
    this.adminService.updateUser(u._id, { isActive: !u.isActive }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => (this.error = err?.error?.message || 'Update failed')
    });
  }

  departmentName(dep: any): string {
    if (!dep) return '—';
    return typeof dep === 'object' ? dep.name : (this.departments.find((d) => d._id === dep)?.name || '—');
  }

  saveThresholds() {
    this.error = ''; this.success = '';
    this.adminService.updateThresholds(this.thresholds).subscribe({
      next: (res) => { this.thresholds = res; this.success = 'Thresholds updated.'; },
      error: (err) => (this.error = err?.error?.message || 'Failed to update thresholds')
    });
  }
}
