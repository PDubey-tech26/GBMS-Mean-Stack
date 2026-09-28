import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenditureService } from '../../core/services/expenditure.service';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { Expenditure, Budget } from '../../core/models/models';

@Component({
  selector: 'app-expenditures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenditures.component.html'
})
export class ExpendituresComponent implements OnInit {
  expenditures: Expenditure[] = [];
  budgets: Budget[] = [];
  loading = true;
  error = '';
  success = '';

  showForm = false;
  form: any = { budget: '', amount: 0, category: '', description: '', transactionDate: '' };
  file: File | null = null;

  constructor(
    private expenditureService: ExpenditureService,
    private budgetService: BudgetService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.budgetService.list().subscribe((res) => (this.budgets = res));
    this.load();
  }

  load() {
    this.loading = true;
    this.expenditureService.list().subscribe({
      next: (res) => { this.expenditures = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Failed to load expenditures'; this.loading = false; }
    });
  }

  budgetLabel(b: any): string {
    if (b && typeof b === 'object') return b.category;
    const found = this.budgets.find((x) => x._id === b);
    return found ? found.category : '—';
  }

  openCreate() {
    this.form = { budget: '', amount: 0, category: '', description: '', transactionDate: '' };
    this.file = null;
    this.showForm = true;
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    this.file = target.files && target.files.length ? target.files[0] : null;
  }

  submit() {
    this.error = ''; this.success = '';
    const fd = new FormData();
    fd.append('budget', this.form.budget);
    fd.append('amount', String(this.form.amount));
    fd.append('category', this.form.category);
    fd.append('description', this.form.description || '');
    if (this.form.transactionDate) fd.append('transactionDate', this.form.transactionDate);
    if (this.file) fd.append('document', this.file);

    this.expenditureService.create(fd).subscribe({
      next: () => { this.success = 'Expenditure recorded.'; this.showForm = false; this.load(); },
      error: (err) => { this.error = err?.error?.message || 'Save failed'; }
    });
  }

  remove(e: Expenditure) {
    if (!confirm('Delete this expenditure record?')) return;
    this.expenditureService.remove(e._id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message || 'Delete failed'; }
    });
  }
}
