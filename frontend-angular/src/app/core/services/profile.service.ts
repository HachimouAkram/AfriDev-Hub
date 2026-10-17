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
  private apiUrl = '/api/v1/profiles';

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

  uploadAvatar(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>('/api/v1/uploads/image', formData);
  }

  uploadCv(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>('/api/v1/uploads/pdf', formData);
  }

  /** Generic URL resolver for any uploaded file (image or PDF) */
  getFullFileUrl(url: string | undefined | null): string {
    return this.getFullAvatarUrl(url);
  }

  getFullAvatarUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // If backend returns /uploads/files/... prepend context path and host
    if (url.startsWith('/uploads')) {
      return `/api/v1${url}`;
    }
    if (url.startsWith('/api/v1')) {
      return `${url}`;
    }
    return `/api/v1/uploads/files/${url}`;
  }
}


