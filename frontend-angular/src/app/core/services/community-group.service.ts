import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  searchGroups(country?: string, tag?: string, query?: string, page = 0, size = 15): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (country && country !== 'ALL') params = params.set('country', country);
    if (tag && tag !== 'ALL') params = params.set('tag', tag);
    if (query && query.trim()) params = params.set('query', query.trim());

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
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

  moderateMember(groupId: string, userId: string, status: GroupMemberStatus): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${groupId}/members/${userId}/status`, {}, { params });
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

