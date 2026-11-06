import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────

export type HelpPostType = 'ORIENTATION' | 'CODE' | 'FORMATION' | 'CARRIERE' | 'PROJET';
export type HelpPostStatus = 'OUVERTE' | 'EN_COURS' | 'RESOLUE';
export type HelpPostVisibility = 'PUBLIQUE' | 'GROUPE_SEULEMENT';
export type DeveloperLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'EXPERT';

export interface HelpPost {
  id: string;
  author: User;
  title: string;
  description: string;
  type: HelpPostType;
  tags: string[];
  niveauDemandeur?: DeveloperLevel;
  status: HelpPostStatus;
  visibility: HelpPostVisibility;
  commentsCount: number;
  viewsCount: number;
  resolvedBy?: User;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isAuthor?: boolean;
}

export interface HelpComment {
  id: string;
  helpPostId: string;
  author: User;
  content: string;
  parentCommentId?: string;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: HelpComment[];
}

export interface HelpPostCreateRequest {
  title: string;
  description: string;
  type: HelpPostType;
  tags: string[];
  niveauDemandeur?: DeveloperLevel;
  visibility: HelpPostVisibility;
}

export interface HelpCommentCreateRequest {
  content: string;
  parentCommentId?: string;
}

export interface HelpPostFilters {
  type?: HelpPostType;
  status?: HelpPostStatus;
  query?: string;
  tag?: string;
  page?: number;
  size?: number;
}

// Labels affichage UI
export const HELP_TYPE_LABELS: Record<HelpPostType, string> = {
  ORIENTATION: '🧭 Orientation',
  CODE:        '💻 Aide Code',
  FORMATION:   '📚 Formation',
  CARRIERE:    '🎯 Carrière',
  PROJET:      '🚀 Projet',
};

export const HELP_STATUS_LABELS: Record<HelpPostStatus, string> = {
  OUVERTE:   '🟢 Ouverte',
  EN_COURS:  '🟡 En cours',
  RESOLUE:   '✅ Résolue',
};

export const HELP_STATUS_COLORS: Record<HelpPostStatus, string> = {
  OUVERTE:   'emerald',
  EN_COURS:  'amber',
  RESOLUE:   'blue',
};

// Tags prédéfinis populaires
export const POPULAR_TAGS: string[] = [
  'Angular', 'React', 'Vue', 'JavaScript', 'TypeScript',
  'Java', 'Spring Boot', 'Python', 'Node.js', 'PHP',
  'Mobile', 'Android', 'Flutter', 'DevOps', 'Docker',
  'AWS', 'Cloud', 'SQL', 'MongoDB', 'Git',
  'Débutant', 'Stage', 'Emploi', 'Freelance', 'Formation',
];

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/help';

  // ── Publications ──────────────────────────

  getPosts(filters: HelpPostFilters = {}): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', (filters.page ?? 0).toString())
      .set('size', (filters.size ?? 20).toString());

    if (filters.type)   params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.query)  params = params.set('query', filters.query);
    if (filters.tag)    params = params.set('tag', filters.tag);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getMyPosts(page = 0, size = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-posts`, { params });
  }

  getPostById(id: string): Observable<ApiResponse<HelpPost>> {
    return this.http.get<ApiResponse<HelpPost>>(`${this.apiUrl}/${id}`);
  }

  createPost(data: HelpPostCreateRequest): Observable<ApiResponse<HelpPost>> {
    return this.http.post<ApiResponse<HelpPost>>(this.apiUrl, data);
  }

  updatePost(id: string, data: HelpPostCreateRequest): Observable<ApiResponse<HelpPost>> {
    return this.http.put<ApiResponse<HelpPost>>(`${this.apiUrl}/${id}`, data);
  }

  deletePost(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: HelpPostStatus): Observable<ApiResponse<HelpPost>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<HelpPost>>(`${this.apiUrl}/${id}/status`, {}, { params });
  }

  // ── Commentaires ──────────────────────────

  getComments(postId: string): Observable<ApiResponse<HelpComment[]>> {
    return this.http.get<ApiResponse<HelpComment[]>>(`${this.apiUrl}/${postId}/comments`);
  }

  addComment(postId: string, data: HelpCommentCreateRequest): Observable<ApiResponse<HelpComment>> {
    return this.http.post<ApiResponse<HelpComment>>(`${this.apiUrl}/${postId}/comments`, data);
  }

  deleteComment(postId: string, commentId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${postId}/comments/${commentId}`);
  }

  acceptComment(postId: string, commentId: string): Observable<ApiResponse<HelpComment>> {
    return this.http.patch<ApiResponse<HelpComment>>(
      `${this.apiUrl}/${postId}/comments/${commentId}/accept`, {}
    );
  }
}

