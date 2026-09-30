import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiBaseUrl}/admin`;
  constructor(private http: HttpClient) {}

  listUsers() { return this.http.get<User[]>(`${this.base}/users`); }
  createUser(payload: any) { return this.http.post<User>(`${this.base}/users`, payload); }
updateUser(id: string, payload: any) {
  return this.http.patch<User>(
    `${this.base}/users/${id}/status`,
    payload
  );
}

  getThresholds() { return this.http.get<any>(`${this.base}/thresholds`); }
  updateThresholds(payload: any) { return this.http.put<any>(`${this.base}/thresholds`, payload); }

  auditLogs() { return this.http.get<any[]>(`${this.base}/audit-logs`); }
}
