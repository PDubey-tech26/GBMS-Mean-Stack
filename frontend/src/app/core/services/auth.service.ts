import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments';
import { User } from '../models/models';

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(this.readStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  private readStoredUser(): User | null {
    const raw = localStorage.getItem('gbms_user');
    return raw ? JSON.parse(raw) : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => this.persistSession(res))
    );
  }

 register(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Observable<any> {
  return this.http.post<any>(
    `${environment.apiBaseUrl}/auth/register`,
    payload
  );
}


  private persistSession(res: AuthResponse) {
    localStorage.setItem('gbms_token', res.token);
    localStorage.setItem('gbms_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  logout() {
    localStorage.removeItem('gbms_token');
    localStorage.removeItem('gbms_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem('gbms_token');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }
}
