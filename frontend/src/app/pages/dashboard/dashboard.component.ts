import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BaseChartDirective } from 'ng2-charts';

import {
  ChartConfiguration,
  Chart
} from 'chart.js';

import { registerables } from 'chart.js';

import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  data: DashboardSummary | null = null;

  loading = true;

  error = '';

  // =========================================================
  // BAR CHART
  // =========================================================

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
    },

    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // =========================================================
  // PIE CHART
  // =========================================================

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  // =========================================================
  // LINE CHART - MONTHLY SPENDING TREND
  // =========================================================

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],

    datasets: [
      {
        data: [],
        label: 'Monthly Expenditure',

        fill: true,

        tension: 0.35,

        pointRadius: 4,

        pointHoverRadius: 6
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;

            return ` ₹${value.toLocaleString('en-IN')}`;
          }
        }
      }
    },

    scales: {

      x: {
        title: {
          display: true,
          text: 'Month'
        }
      },

      y: {
        beginAtZero: true,

        title: {
          display: true,
          text: 'Expenditure (₹)'
        },

        ticks: {
          callback: (value) => {
            return `₹${Number(value).toLocaleString('en-IN')}`;
          }
        }
      }
    }
  };

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private dashboardService: DashboardService
  ) {}

  // =========================================================
  // INIT
  // =========================================================

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
          err?.error?.message ||
          'Failed to load dashboard';
      }

    });
  }

  // =========================================================
  // BUILD ALL CHARTS
  // =========================================================

  private buildCharts(
    res: DashboardSummary
  ): void {

    const monthlyTrend = (
      res as DashboardSummary & {
        monthlyTrend?: Array<{
          month: string;
          totalExpense: number;
        }>;
      }
    ).monthlyTrend ?? [];

    // -------------------------------------------------------
    // BAR CHART
    // -------------------------------------------------------

    this.barChartData = {

      labels: res.departments.map(
        (department) => department.code
      ),

      datasets: [

        {
          data: res.departments.map(
            (department) =>
              department.totalBudget
          ),

          label: 'Allocated'
        },

        {
          data: res.departments.map(
            (department) =>
              department.totalExpense
          ),

          label: 'Spent'
        }

      ]
    };

    // -------------------------------------------------------
    // PIE CHART
    // -------------------------------------------------------

    this.pieChartData = {

      labels: res.categoryBreakdown.map(
        (category) =>
          category.category
      ),

      datasets: [

        {
          data: res.categoryBreakdown.map(
            (category) =>
              category.total
          )
        }

      ]
    };

    // -------------------------------------------------------
    // LINE CHART
    // MONTHLY SPENDING TREND
    // -------------------------------------------------------

    this.lineChartData = {

      labels: monthlyTrend.map(
        (item) =>
          item.month
      ),

      datasets: [

        {
          data: monthlyTrend.map(
            (item) =>
              item.totalExpense
          ),

          label: 'Monthly Expenditure',

          fill: true,

          tension: 0.35,

          pointRadius: 4,

          pointHoverRadius: 6
        }

      ]
    };
  }

  // =========================================================
  // UTILIZATION CLASS
  // =========================================================

  utilizationClass(
    pct: number
  ): string {

    if (pct >= 100) {
      return 'danger';
    }

    if (pct >= 80) {
      return 'warning';
    }

    return '';
  }

  // =========================================================
  // ALERT SEVERITY CLASS
  // =========================================================

  severityClass(
    sev: string
  ): string {

    return sev.toLowerCase();
  }
}