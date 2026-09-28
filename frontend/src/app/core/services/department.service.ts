import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';
import { Department } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private base = `${environment.apiBaseUrl}/departments`;
  constructor(private http: HttpClient) {}

  list() { return this.http.get<Department[]>(this.base); }
  get(id: string) { return this.http.get<Department>(`${this.base}/${id}`); }
  create(payload: Partial<Department>) { return this.http.post<Department>(this.base, payload); }
  update(id: string, payload: Partial<Department>) { return this.http.put<Department>(`${this.base}/${id}`, payload); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
