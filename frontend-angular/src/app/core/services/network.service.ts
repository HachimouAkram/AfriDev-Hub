import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private apiUrl = 'http://localhost:8081/api/v1/network';

  getNetworkUsers(params?: {
    role?: string;
    query?: string;
    skill?: string;
    country?: string;
  }): Observable<ApiResponse<UserNetwork[]>> {
    let httpParams = new HttpParams();
    if (params?.role && params.role !== 'ALL') httpParams = httpParams.set('role', params.role);
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.skill) httpParams = httpParams.set('skill', params.skill);
    if (params?.country) httpParams = httpParams.set('country', params.country);

    return this.http.get<ApiResponse<UserNetwork[]>>(`${this.apiUrl}/users`, { params: httpParams });
  }

  getNetworkSuggestions(limit: number = 10): Observable<ApiResponse<NetworkSuggestion[]>> {
    return this.http.get<ApiResponse<NetworkSuggestion[]>>(`${this.apiUrl}/suggestions?limit=${limit}`);
  }
}
