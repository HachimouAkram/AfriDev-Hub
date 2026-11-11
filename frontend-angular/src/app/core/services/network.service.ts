import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface UserNetwork {
  id: string;
  email: string;
  fullName: string;
  role: 'DEVELOPER' | 'RECRUITER' | string;
  title: string;
  country: string;
  city: string;
  avatarUrl?: string;
  skills: string[];
  reputationScore: number;
  followersCount: number;
  followingCount: number;
  isFollowedByCurrentUser: boolean;
  matchPercentage?: number;
  suggestionReason?: string;
  matchedSkills?: string[];
}

export interface NetworkSuggestion {
  user: UserNetwork;
  matchPercentage: number;
  matchedSkills: string[];
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/network';
  private cache = new Map<string, { timestamp: number; data: ApiResponse<any> }>();
  private CACHE_TTL_MS = 5 * 60 * 1000;

  getNetworkUsers(params?: {
    role?: string;
    query?: string;
    skill?: string;
    country?: string;
    sort?: string;
    page?: number;
    size?: number;
  }, forceRefresh = false): Observable<ApiResponse<any>> {
    const cacheKey = JSON.stringify(params || {});
    const cached = this.cache.get(cacheKey);

    let httpParams = new HttpParams();
    if (params?.role && params.role !== 'ALL') httpParams = httpParams.set('role', params.role);
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.skill) httpParams = httpParams.set('skill', params.skill);
    if (params?.country) httpParams = httpParams.set('country', params.country);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

    const network$ = this.http.get<ApiResponse<any>>(`${this.apiUrl}/users`, { params: httpParams }).pipe(
      tap((res) => {
        if (res && res.success) {
          this.cache.set(cacheKey, { timestamp: Date.now(), data: res });
        }
      })
    );

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return new Observable<ApiResponse<any>>((observer) => {
        observer.next(cached.data);
        observer.complete();
        network$.subscribe({ error: () => {} });
      });
    }

    return network$;
  }

  getNetworkSuggestions(limit: number = 10): Observable<ApiResponse<NetworkSuggestion[]>> {
    return this.http.get<ApiResponse<NetworkSuggestion[]>>(`${this.apiUrl}/suggestions?limit=${limit}`);
  }
}
