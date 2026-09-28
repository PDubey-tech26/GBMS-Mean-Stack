import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  downloadCsv(type: 'budgets' | 'expenditures' | 'alerts') {
    return this.http.get(`${environment.apiBaseUrl}/reports/csv?type=${type}`, { responseType: 'blob' });
  }
  downloadPdf() {
    return this.http.get(`${environment.apiBaseUrl}/reports/pdf`, { responseType: 'blob' });
  }
}
