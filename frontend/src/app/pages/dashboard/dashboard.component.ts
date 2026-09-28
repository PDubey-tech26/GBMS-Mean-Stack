import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, Chart } from 'chart.js';
import { registerables } from 'chart.js';

import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/models';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data: DashboardSummary | null = null;
  loading = true;
  error = '';

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    }
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    }
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.summary().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.buildCharts(res);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Failed to load dashboard';
      }
    });
  }

  private buildCharts(res: DashboardSummary): void {
    this.barChartData = {
      labels: res.departments.map((d) => d.code),
      datasets: [
        {
          data: res.departments.map((d) => d.totalBudget),
          label: 'Allocated'
        },
        {
          data: res.departments.map((d) => d.totalExpense),
          label: 'Spent'
        }
      ]
    };

    this.pieChartData = {
      labels: res.categoryBreakdown.map((c) => c.category),
      datasets: [
        {
          data: res.categoryBreakdown.map((c) => c.total)
        }
      ]
    };
  }

  utilizationClass(pct: number): string {
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warning';
    return '';
  }

  severityClass(sev: string): string {
    return sev.toLowerCase();
  }
}