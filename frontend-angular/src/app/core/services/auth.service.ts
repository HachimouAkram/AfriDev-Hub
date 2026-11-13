import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';

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
  xpPoints?: number;
  levelTitle?: string;
  levelNumber?: number;
  isMentor?: boolean;
  mentorBio?: string;
  mentorHoursPerWeek?: number;
  mentorTopics?: string[];
  menteesHelpedCount?: number;
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
  preferredLanguage?: string;
  phone?: string;
}

export interface LoginSession {
  id: string;
  deviceId: string;
  deviceType: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location?: string;
  status: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}

export interface AccountDeletionImpact {
  userEmail: string;
  userRole: string;
  isCompanyOwner: boolean;
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  publishedOpportunitiesCount: number;
  teamMembersCount: number;
  isCompanyMember: boolean;
  memberCompanyName?: string;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  githubId?: string;
  role: string;
  status: string;
  profile: Profile;
}

export interface AuthResponse {
  token?: string;
  tokenType?: string;
  user?: User;
  twoFactorRequired?: boolean;
  message?: string;
  email?: string;
}

export interface RegisterResponse {
  email: string;
  requiresEmailVerification: boolean;
  message: string;
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
  private apiUrl = '/api/v1/auth';
  private profileUrl = '/api/v1/profiles';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('afridev_token'));

  constructor() {
    if (this.isLoggedIn()) {
      this.refreshCurrentUser().subscribe({ error: () => {} });
    }

    // Synchronisation en arrière-plan au focus de la fenêtre (ex: retour d'un autre onglet)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.isLoggedIn()) {
          this.refreshCurrentUser().subscribe({ error: () => {} });
        }
      });
    }
  }

  /**
   * Rafraîchit les informations de l'utilisateur connecté (profil, XP points, statut, niveau)
   * depuis le serveur et met à jour le Signal currentUser et le localStorage en temps réel.
   */
  refreshCurrentUser(): Observable<ApiResponse<User>> {
    if (!this.isLoggedIn()) {
      return of({ success: false, data: null as any });
    }
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          const updatedUser = res.data;
          localStorage.setItem('afridev_user', JSON.stringify(updatedUser));
          this.currentUser.set(updatedUser);
        }
      })
    );
  }

  /**
   * Met à jour immédiatement et de manière réactive l'XP de l'utilisateur connecté
   */
  updateXp(points: number): void {
    const user = this.currentUser();
    if (user && user.profile) {
      const currentXp = user.profile.xpPoints || 0;
      user.profile.xpPoints = currentXp + points;
      localStorage.setItem('afridev_user', JSON.stringify(user));
      this.currentUser.set({ ...user });
    }
    this.refreshCurrentUser().subscribe({ error: () => {} });
  }

  getDeviceId(): string {
    let id = localStorage.getItem('afridev_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('afridev_device_id', id);
    }
    return id;
  }

  register(data: any): Observable<ApiResponse<RegisterResponse>> {
    // Ne stocke plus de token – redirige vers vérification OTP
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/register`, data);
  }

  login(data: any): Observable<ApiResponse<AuthResponse>> {
    const payload = { ...data, deviceId: this.getDeviceId() };
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  verify2fa(email: string, otpCode: string): Observable<ApiResponse<AuthResponse>> {
    const payload = { email, otpCode, deviceId: this.getDeviceId() };
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login/verify-2fa`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  getSecuritySessions(): Observable<ApiResponse<LoginSession[]>> {
    return this.http.get<ApiResponse<LoginSession[]>>(`${this.profileUrl}/me/security/sessions`, {
      headers: { 'X-Device-Id': this.getDeviceId() }
    });
  }

  revokeSession(sessionId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.profileUrl}/me/security/sessions/${sessionId}`);
  }

  revokeOtherSessions(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.profileUrl}/me/security/sessions/other`, {
      headers: { 'X-Device-Id': this.getDeviceId() }
    });
  }

  toggleTwoFactor(enabled: boolean): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.profileUrl}/me/security/2fa`, { enabled }).pipe(
      tap(res => {
        if (res.success && res.data) {
          const user = this.currentUser();
          if (user) {
            user.twoFactorEnabled = res.data.twoFactorEnabled;
            localStorage.setItem('afridev_user', JSON.stringify(user));
            this.currentUser.set({ ...user });
          }
        }
      })
    );
  }

  requestOtp(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/email/request-otp`, { email });
  }

  getDeletionImpact(): Observable<ApiResponse<AccountDeletionImpact>> {
    return this.http.get<ApiResponse<AccountDeletionImpact>>(`${this.profileUrl}/me/deletion-impact`);
  }

  deleteAccount(confirmation: string, password?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.profileUrl}/me/delete-account`, { confirmation, password });
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

  loginWithGoogle(idToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/google`, { idToken }).pipe(
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
    if (authData.twoFactorRequired) {
      return;
    }
    if (authData.token && authData.user) {
      localStorage.setItem('afridev_token', authData.token);
      localStorage.setItem('afridev_user', JSON.stringify(authData.user));
      this.token.set(authData.token);
      this.currentUser.set(authData.user);
    }
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
