import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../core/services/budget.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { Budget, Department } from '../../core/models/models';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budgets.component.html'
})
export class BudgetsComponent implements OnInit {
  budgets: Budget[] = [];
  departments: Department[] = [];
  loading = true;
  error = '';
  success = '';

  showForm = false;
  editingId: string | null = null;
  form: any = { department: '', financialYear: '2025-2026', quarter: 'ANNUAL', category: '', allocatedAmount: 0, description: '' };

  constructor(
    private budgetService: BudgetService,
    private departmentService: DepartmentService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.departmentService.list().subscribe((res) => (this.departments = res));
    this.load();
  }

  load() {
    this.loading = true;
    this.budgetService.list().subscribe({
      next: (res) => { this.budgets = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Failed to load budgets'; this.loading = false; }
    });
  }

  departmentName(dep: any): string {
    if (dep && typeof dep === 'object') return dep.name;
    const found = this.departments.find((d) => d._id === dep);
    return found ? found.name : '—';
  }

  openCreate() {
    this.editingId = null;
    this.form = { department: '', financialYear: '2025-2026', quarter: 'ANNUAL', category: '', allocatedAmount: 0, description: '' };
    this.showForm = true;
  }

  openEdit(b: Budget) {
    this.editingId = b._id;
    this.form = {
      department: typeof b.department === 'object' ? b.department._id : b.department,
      financialYear: b.financialYear,
      quarter: b.quarter,
      category: b.category,
      allocatedAmount: b.allocatedAmount,
      description: b.description || ''
    };
    this.showForm = true;
  }

  submit() {
    this.error = ''; this.success = '';
    const action = this.editingId
      ? this.budgetService.update(this.editingId, this.form)
      : this.budgetService.create(this.form);

    action.subscribe({
      next: () => { this.success = this.editingId ? 'Budget updated.' : 'Budget created.'; this.showForm = false; this.load(); },
      error: (err) => { this.error = err?.error?.message || 'Save failed'; }
    });
  }

  remove(b: Budget) {
    if (!confirm(`Delete budget "${b.category}"?`)) return;
    this.budgetService.remove(b._id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message || 'Delete failed'; }
    });
  }
}
