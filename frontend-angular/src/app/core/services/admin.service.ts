import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalProjects: number;
  totalOpportunities: number;
  totalEvaluations: number;
  usersByCountry: { [key: string]: number };
}

export interface CountryAdoptionStats {
  country: string;
  userCount: number;
  developerCount: number;
  recruiterCount: number;
  verifiedUsersCount: number;
  projectCount: number;
  opportunityCount: number;
  adoptionPercentage: number;
  rank: number;
}

export interface PlatformAdoptionSummary {
  totalContinentalUsers: number;
  totalContinentalProjects: number;
  totalContinentalOpportunities: number;
  activeCountriesCount: number;
  countries: CountryAdoptionStats[];
}

export interface UserAdmin {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  fullName?: string;
  title?: string;
  country?: string;
  city?: string;
  avatarUrl?: string;
  mobileMoneyVerified?: boolean;
  xpPoints?: number;
  levelTitle?: string;
  completionScore?: number;
  projectsCount: number;
  opportunitiesCount: number;
  reportsCount: number;
  createdAt?: string;
}

export interface ProjectModerateRequest {
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  reason: string;
  notifyAuthor?: boolean;
}

export interface Report {
  id: string;
  reporter: User;
  resource: string;
  resourceId: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  handledBy?: string;
  handledAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  metadataJson?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/admin';

  // Cache mémoire Stale-While-Revalidate pour chargement instantané
  private usersCache = new Map<string, { data: ApiResponse<PaginatedResponse<UserAdmin>>; timestamp: number }>();
  private readonly CACHE_TTL_MS = 120_000; // 2 minutes

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.apiUrl}/stats`);
  }

  getCountryAdoptionStats(): Observable<ApiResponse<PlatformAdoptionSummary>> {
    return this.http.get<ApiResponse<PlatformAdoptionSummary>>(`${this.apiUrl}/analytics/countries`);
  }

  getAdminUsers(filter?: { search?: string; country?: string; role?: string; status?: string; page?: number; size?: number }): Observable<ApiResponse<PaginatedResponse<UserAdmin>>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.country) params = params.set('country', filter.country);
      if (filter.role) params = params.set('role', filter.role);
      if (filter.status) params = params.set('status', filter.status);
      params = params.set('page', (filter.page ?? 0).toString());
      params = params.set('size', (filter.size ?? 20).toString());
    } else {
      params = params.set('page', '0').set('size', '20');
    }

    const cacheKey = params.toString();
    const cached = this.usersCache.get(cacheKey);

    return new Observable<ApiResponse<PaginatedResponse<UserAdmin>>>(observer => {
      // 1. Émission instantanée depuis le cache local (0 ms de latence)
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        observer.next(cached.data);
      }

      // 2. Requête réseau en arrière-plan vers Redis / Backend
      const sub = this.http.get<ApiResponse<PaginatedResponse<UserAdmin>>>(`${this.apiUrl}/users`, { params }).subscribe({
        next: (res) => {
          this.usersCache.set(cacheKey, { data: res, timestamp: Date.now() });
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          if (!cached) {
            observer.error(err);
          } else {
            observer.complete();
          }
        }
      });

      return () => sub.unsubscribe();
    });
  }

  clearUsersCache(): void {
    this.usersCache.clear();
  }

  updateUserStatus(userId: string, status: string, reason?: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/${userId}/status`, { status, reason }).pipe(
      tap(() => this.clearUsersCache())
    );
  }


  moderateProject(projectId: string, request: ProjectModerateRequest): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/projects/${projectId}/moderate`, request);
  }

  getReports(status?: string, page = 0, size = 15): Observable<ApiResponse<PaginatedResponse<Report>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PaginatedResponse<Report>>>(`${this.apiUrl}/reports`, { params });
  }

  handleReport(reportId: string, status: string): Observable<ApiResponse<Report>> {
    return this.http.patch<ApiResponse<Report>>(`${this.apiUrl}/reports/${reportId}`, {}, {
      params: new HttpParams().set('status', status)
    });
  }

  createReport(resource: string, resourceId: string, reason: string): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>('/api/v1/reports', { resource, resourceId, reason });
  }

  getAuditLogs(page = 0, size = 20, search?: string): Observable<ApiResponse<PaginatedResponse<AuditLog>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PaginatedResponse<AuditLog>>>(`${this.apiUrl}/audit-logs`, { params });
  }
}

