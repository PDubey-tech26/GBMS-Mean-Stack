import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';
import { Budget } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private base = `${environment.apiBaseUrl}/budgets`;
  constructor(private http: HttpClient) {}

  list(params?: { department?: string; financialYear?: string }) {
    let query = '';
    if (params) {
      const parts = Object.entries(params).filter(([, v]) => !!v).map(([k, v]) => `${k}=${v}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.http.get<Budget[]>(this.base + query);
  }
  get(id: string) { return this.http.get<Budget>(`${this.base}/${id}`); }
  utilization(id: string) { return this.http.get<any>(`${this.base}/${id}/utilization`); }
  create(payload: Partial<Budget>) { return this.http.post<Budget>(this.base, payload); }
  update(id: string, payload: Partial<Budget>) { return this.http.put<Budget>(`${this.base}/${id}`, payload); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
