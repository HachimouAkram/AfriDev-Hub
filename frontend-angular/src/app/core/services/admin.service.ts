import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalDevelopers?: number;
  totalRecruiters?: number;
  totalVerifiedUsers?: number;
  totalCompanies?: number;
  totalVerifiedCompanies?: number;
  activeCompanies?: number;
  totalOpportunities: number;
  activeOpportunities?: number;
  totalApplications?: number;
  opportunitiesByType?: { [key: string]: number };
  totalResources?: number;
  totalTrainingsCompleted?: number;
  totalGroups?: number;
  totalGroupMembers?: number;
  totalProjects: number;
  totalEvaluations: number;
  totalEvents?: number;
  usersByCountry: { [key: string]: number };
  companiesByCountry?: { [key: string]: number };
  ecosystemDistribution?: { [key: string]: number };
  topCountriesPerformance?: Array<{ country: string; users: number; companies: number }>;
  monthlyTrends?: Array<{ month: string; talents: number; companies: number; projects: number; opportunities: number }>;
}

export interface CountryAdoptionStats {
  country: string;
  userCount: number;
  developerCount: number;
  recruiterCount: number;
  verifiedUsersCount: number;
  companyCount?: number;
  verifiedCompanyCount?: number;
  projectCount: number;
  opportunityCount: number;
  groupCount?: number;
  trainingCount?: number;
  adoptionPercentage: number;
  performanceScore?: number;
  vitalityLevel?: string;
  rank: number;
}

export interface PlatformAdoptionSummary {
  totalContinentalUsers: number;
  totalContinentalDevelopers?: number;
  totalContinentalRecruiters?: number;
  totalContinentalCompanies?: number;
  totalContinentalGroups?: number;
  totalContinentalTrainings?: number;
  totalContinentalOpportunities: number;
  totalContinentalProjects: number;
  totalContinentalVerifiedUsers?: number;
  activeCountriesCount: number;
  averageContinentalPerformanceScore?: number;
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

  // Cache mémoire & persistant Stale-While-Revalidate pour chargement instantané
  private usersCache = new Map<string, { data: ApiResponse<PaginatedResponse<UserAdmin>>; timestamp: number }>();
  private statsCache: { data: ApiResponse<AdminStats>; timestamp: number } | null = null;
  private adoptionCache: { data: ApiResponse<PlatformAdoptionSummary>; timestamp: number } | null = null;
  private reportsCache = new Map<string, { data: ApiResponse<PaginatedResponse<Report>>; timestamp: number }>();
  private auditCache = new Map<string, { data: ApiResponse<PaginatedResponse<AuditLog>>; timestamp: number }>();

  private readonly CACHE_TTL_MS = 180_000; // 3 minutes

  getCachedStats(): AdminStats | null {
    if (this.statsCache && (Date.now() - this.statsCache.timestamp < this.CACHE_TTL_MS)) {
      return this.statsCache.data.data || null;
    }
    try {
      const raw = sessionStorage.getItem('afridev_admin_stats');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS) {
          this.statsCache = parsed;
          return parsed.data?.data || null;
        }
      }
    } catch {}
    return null;
  }

  getCachedCountryAdoptionStats(): PlatformAdoptionSummary | null {
    if (this.adoptionCache && (Date.now() - this.adoptionCache.timestamp < this.CACHE_TTL_MS)) {
      return this.adoptionCache.data.data || null;
    }
    try {
      const raw = sessionStorage.getItem('afridev_admin_adoption');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS) {
          this.adoptionCache = parsed;
          return parsed.data?.data || null;
        }
      }
    } catch {}
    return null;
  }

  getCachedReports(status?: string, page = 0, size = 15): PaginatedResponse<Report> | null {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (status) params = params.set('status', status);
    const key = params.toString();
    const cached = this.reportsCache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data.data || null;
    }
    return null;
  }

  getCachedAuditLogs(page = 0, size = 20, search?: string): PaginatedResponse<AuditLog> | null {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    const key = params.toString();
    const cached = this.auditCache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data.data || null;
    }
    return null;
  }

  getStats(): Observable<ApiResponse<AdminStats>> {
    const hasCached = !!this.getCachedStats();
    return new Observable<ApiResponse<AdminStats>>(observer => {
      if (this.statsCache && (Date.now() - this.statsCache.timestamp < this.CACHE_TTL_MS)) {
        observer.next(this.statsCache.data);
      }

      const sub = this.http.get<ApiResponse<AdminStats>>(`${this.apiUrl}/stats`).subscribe({
        next: (res) => {
          this.statsCache = { data: res, timestamp: Date.now() };
          try {
            sessionStorage.setItem('afridev_admin_stats', JSON.stringify(this.statsCache));
          } catch {}
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          if (!hasCached) {
            observer.error(err);
          } else {
            observer.complete();
          }
        }
      });

      return () => sub.unsubscribe();
    });
  }

  getCountryAdoptionStats(): Observable<ApiResponse<PlatformAdoptionSummary>> {
    const hasCached = !!this.getCachedCountryAdoptionStats();
    return new Observable<ApiResponse<PlatformAdoptionSummary>>(observer => {
      if (this.adoptionCache && (Date.now() - this.adoptionCache.timestamp < this.CACHE_TTL_MS)) {
        observer.next(this.adoptionCache.data);
      }

      const sub = this.http.get<ApiResponse<PlatformAdoptionSummary>>(`${this.apiUrl}/analytics/countries`).subscribe({
        next: (res) => {
          this.adoptionCache = { data: res, timestamp: Date.now() };
          try {
            sessionStorage.setItem('afridev_admin_adoption', JSON.stringify(this.adoptionCache));
          } catch {}
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          if (!hasCached) {
            observer.error(err);
          } else {
            observer.complete();
          }
        }
      });

      return () => sub.unsubscribe();
    });
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

  clearAllAdminCaches(): void {
    this.usersCache.clear();
    this.statsCache = null;
    this.adoptionCache = null;
    this.reportsCache.clear();
    this.auditCache.clear();
    try {
      sessionStorage.removeItem('afridev_admin_stats');
      sessionStorage.removeItem('afridev_admin_adoption');
    } catch {}
  }

  clearUsersCache(): void {
    this.clearAllAdminCaches();
  }

  updateUserStatus(userId: string, status: string, reason?: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/${userId}/status`, { status, reason }).pipe(
      tap(() => this.clearAllAdminCaches())
    );
  }

  createAdminAccount(data: {
    email: string;
    fullName: string;
    title?: string;
    country?: string;
    city?: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/admins`, data).pipe(
      tap(() => this.clearAllAdminCaches())
    );
  }

  deleteUserPermanently(userId: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/users/${userId}`).pipe(
      tap(() => this.clearAllAdminCaches())
    );
  }

  moderateProject(projectId: string, request: ProjectModerateRequest): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/projects/${projectId}/moderate`, request).pipe(
      tap(() => this.clearAllAdminCaches())
    );
  }

  getReports(status?: string, page = 0, size = 15): Observable<ApiResponse<PaginatedResponse<Report>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (status) params = params.set('status', status);
    const key = params.toString();
    const cached = this.reportsCache.get(key);

    return new Observable<ApiResponse<PaginatedResponse<Report>>>(observer => {
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        observer.next(cached.data);
      }

      const sub = this.http.get<ApiResponse<PaginatedResponse<Report>>>(`${this.apiUrl}/reports`, { params }).subscribe({
        next: (res) => {
          this.reportsCache.set(key, { data: res, timestamp: Date.now() });
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

  handleReport(reportId: string, status: string): Observable<ApiResponse<Report>> {
    return this.http.patch<ApiResponse<Report>>(`${this.apiUrl}/reports/${reportId}`, {}, {
      params: new HttpParams().set('status', status)
    }).pipe(
      tap(() => {
        this.reportsCache.clear();
      })
    );
  }

  createReport(resource: string, resourceId: string, reason: string): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>('/api/v1/reports', { resource, resourceId, reason }).pipe(
      tap(() => {
        this.reportsCache.clear();
      })
    );
  }

  getAuditLogs(page = 0, size = 20, search?: string): Observable<ApiResponse<PaginatedResponse<AuditLog>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) params = params.set('search', search);
    const key = params.toString();
    const cached = this.auditCache.get(key);

    return new Observable<ApiResponse<PaginatedResponse<AuditLog>>>(observer => {
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        observer.next(cached.data);
      }

      const sub = this.http.get<ApiResponse<PaginatedResponse<AuditLog>>>(`${this.apiUrl}/audit-logs`, { params }).subscribe({
        next: (res) => {
          this.auditCache.set(key, { data: res, timestamp: Date.now() });
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
}

