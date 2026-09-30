import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  error = '';

  // Logged-in user's role
  role = localStorage.getItem('role') || '';

  get isDepartmentHead(): boolean {
    return this.role === 'department_head';
  }

  get reportScope(): string {
    return this.isDepartmentHead
      ? 'your assigned department'
      : 'all departments';
  }

  downloadCsv(type: 'budgets' | 'expenditures' | 'alerts') {
    this.reportService.downloadCsv(type).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `${type}-report.csv`);
      },
      error: (err) => {
        this.error =
          err?.error?.message || 'Failed to generate CSV report';
      }
    });
  }

  downloadPdf() {
    this.reportService.downloadPdf().subscribe({
      next: (blob) => {
        this.triggerDownload(
          blob,
          'budget-utilization-summary.pdf'
        );
      },
      error: (err) => {
        this.error =
          err?.error?.message || 'Failed to generate PDF report';
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  constructor(private reportService: ReportService) {}
}