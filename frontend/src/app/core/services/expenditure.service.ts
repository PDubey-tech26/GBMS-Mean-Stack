import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';
import { Expenditure } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ExpenditureService {
  private base = `${environment.apiBaseUrl}/expenditures`;
  constructor(private http: HttpClient) {}

  list(params?: { budget?: string; department?: string }) {
    let query = '';
    if (params) {
      const parts = Object.entries(params).filter(([, v]) => !!v).map(([k, v]) => `${k}=${v}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.http.get<Expenditure[]>(this.base + query);
  }
  create(formData: FormData) { return this.http.post<Expenditure>(this.base, formData); }
  update(id: string, formData: FormData) { return this.http.put<Expenditure>(`${this.base}/${id}`, formData); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
  categorySummary() { return this.http.get<Array<{ category: string; total: number }>>(`${this.base}/category-summary`); }
}
