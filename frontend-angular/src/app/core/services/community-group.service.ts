import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export type GroupAccessType = 'PUBLIC' | 'OUVERT' | 'PRIVE';
export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'CONTRIBUTOR' | 'MEMBER' | 'SUBSCRIBER';
export type GroupMemberStatus = 'PENDING' | 'ACTIVE' | 'BANNED';
export type GroupPostType = 'ANNONCE' | 'RESSOURCE' | 'DISCUSSION' | 'EVENEMENT';
export type GroupPostVisibility = 'PUBLIC' | 'MEMBRES_SEULEMENT';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string;
  bannerUrl?: string;
  accessType: GroupAccessType;
  tags: string[];
  country?: string;
  city?: string;
  rulesMarkdown?: string;
  owner: User;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  userRole?: GroupMemberRole;
  isPending?: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  user: User;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  banReason?: string;
  bannedAt?: string;
  joinedAt: string;
}

export interface GroupPost {
  id: string;
  groupId: string;
  author: User;
  title: string;
  content: string;
  type: GroupPostType;
  visibility: GroupPostVisibility;
  isPinned: boolean;
  attachments: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  canEditOrDelete?: boolean;
}

export interface GroupCreateRequest {
  name: string;
  slug: string;
  description: string;
  accessType: GroupAccessType;
  tags: string[];
  country?: string;
  city?: string;
  rulesMarkdown?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface GroupPostCreateRequest {
  title: string;
  content: string;
  type: GroupPostType;
  visibility: GroupPostVisibility;
  isPinned?: boolean;
  attachments?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CommunityGroupService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/groups';
  private cache = new Map<string, { timestamp: number; data: ApiResponse<any> }>();
  private CACHE_TTL_MS = 5 * 60 * 1000;

  searchGroups(country?: string, tag?: string, query?: string, page = 0, size = 15, forceRefresh = false): Observable<ApiResponse<any>> {
    const cacheKey = `grp_${country || 'ALL'}_${tag || 'ALL'}_${query || ''}_${page}_${size}`;
    const cached = this.cache.get(cacheKey);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (country && country !== 'ALL') params = params.set('country', country);
    if (tag && tag !== 'ALL') params = params.set('tag', tag);
    if (query && query.trim()) params = params.set('query', query.trim());

    const network$ = this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
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

  getMyGroups(page = 0, size = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-groups`, { params });
  }

  getGroupBySlug(slug: string): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(`${this.apiUrl}/slug/${slug}`);
  }

  getGroupById(id: string): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(`${this.apiUrl}/${id}`);
  }

  createGroup(data: GroupCreateRequest): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>(this.apiUrl, data);
  }

  updateGroup(id: string, data: GroupCreateRequest): Observable<ApiResponse<Group>> {
    return this.http.put<ApiResponse<Group>>(`${this.apiUrl}/${id}`, data);
  }

  deleteGroup(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  joinGroup(id: string): Observable<ApiResponse<GroupMember>> {
    return this.http.post<ApiResponse<GroupMember>>(`${this.apiUrl}/${id}/join`, {});
  }

  leaveGroup(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/leave`, {});
  }

  getMembers(groupId: string, status = 'ACTIVE', page = 0, size = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${groupId}/members`, { params });
  }

  updateMemberRole(groupId: string, userId: string, role: GroupMemberRole): Observable<ApiResponse<GroupMember>> {
    const params = new HttpParams().set('role', role);
    return this.http.patch<ApiResponse<GroupMember>>(`${this.apiUrl}/${groupId}/members/${userId}/role`, {}, { params });
  }

  updateBanner(groupId: string, bannerUrl?: string): Observable<ApiResponse<Group>> {
    let params = new HttpParams();
    if (bannerUrl) params = params.set('bannerUrl', bannerUrl);
    return this.http.patch<ApiResponse<Group>>(`${this.apiUrl}/${groupId}/banner`, {}, { params });
  }

  moderateMember(groupId: string, userId: string, status: GroupMemberStatus, reason?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('status', status);
    if (reason) params = params.set('reason', reason);
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${groupId}/members/${userId}/status`, {}, { params });
  }

  uploadImage(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>('/api/v1/uploads/image', formData);
  }

  getGroupFeed(groupId: string, type?: GroupPostType, page = 0, size = 15): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (type) params = params.set('type', type);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${groupId}/posts`, { params });
  }

  createPost(groupId: string, data: GroupPostCreateRequest): Observable<ApiResponse<GroupPost>> {
    return this.http.post<ApiResponse<GroupPost>>(`${this.apiUrl}/${groupId}/posts`, data);
  }

  deletePost(groupId: string, postId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${groupId}/posts/${postId}`);
  }
}

