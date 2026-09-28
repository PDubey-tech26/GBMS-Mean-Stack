import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments';
import { AlertItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private base = `${environment.apiBaseUrl}/alerts`;
  constructor(private http: HttpClient) {}

  list(params?: { resolved?: boolean; department?: string; severity?: string }) {
    let query = '';
    if (params) {
      const parts = Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.http.get<AlertItem[]>(this.base + query);
  }
  resolve(id: string) { return this.http.put<AlertItem>(`${this.base}/${id}/resolve`, {}); }
  runDetection() { return this.http.post<any>(`${this.base}/run-detection`, {}); }
}
