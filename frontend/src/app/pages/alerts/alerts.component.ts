import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertItem } from '../../core/models/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.component.html'
})
export class AlertsComponent implements OnInit {
  alerts: AlertItem[] = [];
  loading = true;
  error = '';
  success = '';
  filter: 'open' | 'resolved' | 'all' = 'open';
  running = false;

  constructor(private alertService: AlertService, public auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    const params = this.filter === 'all' ? undefined : { resolved: this.filter === 'resolved' };
    this.alertService.list(params).subscribe({
      next: (res) => { this.alerts = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Failed to load alerts'; this.loading = false; }
    });
  }

  setFilter(f: 'open' | 'resolved' | 'all') {
    this.filter = f;
    this.load();
  }

  departmentName(dep: any): string {
    return dep && typeof dep === 'object' ? dep.name : dep;
  }

  budgetCategory(b: any): string {
    return b && typeof b === 'object' ? b.category : b;
  }

  resolve(a: AlertItem) {
    this.alertService.resolve(a._id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message || 'Failed to resolve alert'; }
    });
  }

  runDetection() {
    this.running = true;
    this.alertService.runDetection().subscribe({
      next: () => { this.running = false; this.success = 'Detection run complete.'; this.load(); },
      error: (err) => { this.running = false; this.error = err?.error?.message || 'Detection run failed'; }
    });
  }
}
