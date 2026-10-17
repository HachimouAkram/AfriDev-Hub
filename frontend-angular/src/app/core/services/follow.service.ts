import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  followedByCurrentUser: boolean;
  followsCurrentUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/profiles';

  getStats(userId: string): Observable<ApiResponse<FollowStats>> {
    return this.http.get<ApiResponse<FollowStats>>(`${this.apiUrl}/${userId}/follow/stats`);
  }

  followUser(userId: string): Observable<ApiResponse<FollowStats>> {
    return this.http.post<ApiResponse<FollowStats>>(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollowUser(userId: string): Observable<ApiResponse<FollowStats>> {
    return this.http.delete<ApiResponse<FollowStats>>(`${this.apiUrl}/${userId}/follow`);
  }

  getFollowers(userId: string): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/${userId}/follow/followers`);
  }

  getFollowing(userId: string): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/${userId}/follow/following`);
  }
}
