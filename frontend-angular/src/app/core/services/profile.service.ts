import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Profile } from './auth.service';

export interface GitHubLanguageStat {
  name: string;
  percentage: number;
  color: string;
}

export interface GitHubStats {
  username: string;
  public_repos: number;
  followers: number;
  total_stars: number;
  total_contributions_last_year: number;
  top_languages: GitHubLanguageStat[];
  cached?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/profiles';

  getProfiles(country?: string, skill?: string, page = 0, size = 20): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (country) params = params.set('country', country);
    if (skill) params = params.set('skill', skill);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getProfileById(id: string): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.apiUrl}/${id}`);
  }

  updateProfile(data: any): Observable<ApiResponse<Profile>> {
    return this.http.patch<ApiResponse<Profile>>(`${this.apiUrl}/me`, data);
  }

  syncGithub(githubUsername: string): Observable<ApiResponse<Profile>> {
    return this.http.post<ApiResponse<Profile>>(`${this.apiUrl}/me/sync-github`, { githubUsername });
  }

  verifyMobileMoney(): Observable<ApiResponse<Profile>> {
    return this.http.post<ApiResponse<Profile>>(`${this.apiUrl}/me/verify-mobile-money`, {});
  }
}
