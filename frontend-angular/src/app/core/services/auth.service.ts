import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Profile {
  id: string;
  userId?: string;
  fullName: string;
  country: string;
  city: string;
  title: string;
  bio?: string;
  skills: string[];
  languages?: string[];
  yearsExperience?: number;
  availability: string;
  completionScore: number;
  mobileMoneyVerified: boolean;
  avatarUrl?: string;
  cvUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  zindiUrl?: string;
  portfolioUrl?: string;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  githubId?: string;
  role: string;
  status: string;
  profile: Profile;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/auth';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('afridev_token'));

  register(data: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  login(data: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  requestOtp(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/email/request-otp`, { email });
  }

  verifyOtp(email: string, otpCode: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/email/verify-otp`, { email, otpCode }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('afridev_token');
    localStorage.removeItem('afridev_user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  getToken(): string | null {
    return this.token();
  }

  private handleAuthSuccess(authData: AuthResponse): void {
    localStorage.setItem('afridev_token', authData.token);
    localStorage.setItem('afridev_user', JSON.stringify(authData.user));
    this.token.set(authData.token);
    this.currentUser.set(authData.user);
  }

  updateProfileInUser(profile: Profile): void {
    const user = this.currentUser();
    if (user) {
      user.profile = profile;
      localStorage.setItem('afridev_user', JSON.stringify(user));
      this.currentUser.set({ ...user });
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('afridev_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
