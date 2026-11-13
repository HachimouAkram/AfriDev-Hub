import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  website?: string;
  logoUrl?: string;
  coverUrl?: string;
  country?: string;
  city?: string;
  sector?: string;
  companySize?: string;
  foundedYear?: number;
  companyXp: number;
  companyLevel: 'STARTUP' | 'RECONNUE' | 'CERTIFIEE' | 'PARTENAIRE' | 'ELITE_AFRIQUE';
  badge?: string;
  verified: boolean;
  ownerId?: string;
  ownerName?: string;
  activeOpportunitiesCount?: number;
  membersCount?: number;
  createdAt?: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
  role: 'OWNER' | 'RECRUITER';
  status: 'ACTIVE' | 'PENDING' | 'REMOVED';
  joinedAt?: string;
  createdAt?: string;
}

export interface CompanyActivityLog {
  id: string;
  companyId: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  activityType: string;
  targetId?: string;
  targetType?: string;
  description: string;
  createdAt: string;
}

export interface CompanyStats {
  companyId: string;
  companyName: string;
  companyXp: number;
  companyLevel: string;
  badge?: string;
  verified: boolean;
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  totalEvents: number;
  totalResources: number;
  membersCount: number;
}

export interface CompanyLeaderboardItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  country?: string;
  city?: string;
  sector?: string;
  companyXp: number;
  companyLevel: string;
  levelNumber?: number;
  badge?: string;
  verified: boolean;
  activeOpportunitiesCount: number;
  membersCount?: number;
  rank: number;
}

export interface CompanyLeaderboardResponse {
  topCompanies: CompanyLeaderboardItem[];
  myCompany?: CompanyLeaderboardItem;
  totalCompanies: number;
}

export interface PagedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1';

  getMyCompany(): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(`${this.apiUrl}/companies/me`);
  }

  getCompanyBySlug(slug: string): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(`${this.apiUrl}/companies/${slug}`);
  }

  updateCompany(id: string, data: Partial<Company>): Observable<ApiResponse<Company>> {
    return this.http.put<ApiResponse<Company>>(`${this.apiUrl}/companies/${id}`, data);
  }

  getMembers(companyId: string, page = 0, size = 20): Observable<ApiResponse<PagedData<CompanyMember>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PagedData<CompanyMember>>>(`${this.apiUrl}/companies/${companyId}/members`, { params });
  }

  inviteMember(companyId: string, email: string, jobTitle: string, role = 'RECRUITER'): Observable<ApiResponse<CompanyMember>> {
    return this.http.post<ApiResponse<CompanyMember>>(`${this.apiUrl}/companies/${companyId}/members`, { email, jobTitle, role });
  }

  removeMember(companyId: string, userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/companies/${companyId}/members/${userId}`);
  }

  getActivityLogs(companyId: string, page = 0, size = 20): Observable<ApiResponse<PagedData<CompanyActivityLog>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PagedData<CompanyActivityLog>>>(`${this.apiUrl}/companies/${companyId}/activity-log`, { params });
  }

  getStats(companyId: string): Observable<ApiResponse<CompanyStats>> {
    return this.http.get<ApiResponse<CompanyStats>>(`${this.apiUrl}/companies/${companyId}/stats`);
  }

  getCompanyLeaderboard(page = 0, size = 20, country?: string, sector?: string, query?: string): Observable<ApiResponse<CompanyLeaderboardResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (country) params = params.set('country', country);
    if (sector) params = params.set('sector', sector);
    if (query) params = params.set('query', query);
    return this.http.get<ApiResponse<CompanyLeaderboardResponse>>(`${this.apiUrl}/leaderboard/companies`, { params });
  }
}

