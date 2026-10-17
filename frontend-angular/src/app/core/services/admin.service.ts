import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalProjects: number;
  totalOpportunities: number;
  totalEvaluations: number;
  usersByCountry: { [key: string]: number };
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

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/admin';

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.apiUrl}/stats`);
  }

  updateUserStatus(userId: string, status: string, reason?: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/${userId}/status`, { status, reason });
  }

  getReports(status?: string, page = 0, size = 15): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/reports`, { params });
  }

  handleReport(reportId: string, status: string): Observable<ApiResponse<Report>> {
    return this.http.patch<ApiResponse<Report>>(`${this.apiUrl}/reports/${reportId}`, {}, {
      params: new HttpParams().set('status', status)
    });
  }

  createReport(resource: string, resourceId: string, reason: string): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>('/api/v1/reports', { resource, resourceId, reason });
  }

  getAuditLogs(page = 0, size = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/audit-logs`, { params });
  }
}
