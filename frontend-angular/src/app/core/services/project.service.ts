import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, User } from './auth.service';
import { getUploadApiUrl } from '../utils/upload-helper';

export type ProjectType = 'OPEN_SOURCE' | 'FOR_SALE' | 'SAAS' | 'PORTFOLIO' | 'ENTERPRISE' | 'COLLABORATIVE';
export type SaleType = 'LICENSED' | 'FULL_SOURCE_CODE' | 'EXCLUSIVE_CESSION';
export type SaasPricingType = 'FREE' | 'FREEMIUM' | 'PAID_SUBSCRIPTION';

export interface ProjectComment {
  id: string;
  projectId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  author: User;
  title: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  demoUrl?: string;
  screenshots: string[];
  isOpenSource: boolean;

  projectType?: ProjectType;
  price?: number;
  currency?: string;
  saleType?: SaleType;
  saasPricingType?: SaasPricingType;
  licenseType?: string;
  demoAccountInfo?: string;
  companyName?: string;
  companyRole?: string;
  youtubeUrl?: string;
  documentationPdfUrl?: string;
  maxMembers?: number;
  payoutPhoneNumber?: string;
  payoutOperator?: string;
  isMonetized?: boolean;

  viewsCount?: number;
  recognitionsCount: number;
  recognizedByCurrentUser: boolean;
  status: string;
  createdAt: string;
  matchPercentage?: number;
  suggestionReason?: string;
  matchedStack?: string[];
  isAuthorFollowed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/projects';

  // Cache mémoire réactif (Stale-While-Revalidate) pour chargement instantané (0 ms)
  private projectsCache = new Map<string, { timestamp: number; data: ApiResponse<any> }>();
  private singleProjectCache = new Map<string, { timestamp: number; data: ApiResponse<Project> }>();
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  getProjects(page = 0, size = 20, projectType?: string, sort?: string, forceRefresh = false): Observable<ApiResponse<any>> {
    const cacheKey = `p_${page}_s_${size}_t_${projectType || 'ALL'}_sort_${sort || 'DEFAULT'}`;
    const cached = this.projectsCache.get(cacheKey);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (projectType && projectType !== 'ALL') {
      params = params.set('projectType', projectType);
    }

    if (sort) {
      params = params.set('sort', sort);
    }

    const network$ = this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      tap((res) => {
        if (res && res.success) {
          this.projectsCache.set(cacheKey, { timestamp: Date.now(), data: res });
          const items: Project[] = res?.data?.content || res?.data || [];
          if (Array.isArray(items)) {
            items.forEach(p => {
              if (p && p.id) {
                this.singleProjectCache.set(p.id, { timestamp: Date.now(), data: { success: true, data: p } });
              }
            });
          }
        }
      })
    );

    // Si nous avons des données en cache valides et qu'un rafraîchissement forcé n'est pas demandé
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      // Retourne immédiatement le cache via un Observable synchrone
      return new Observable<ApiResponse<any>>((observer) => {
        observer.next(cached.data);
        observer.complete();
        // Revalidation silencieuse en arrière-plan sans bloquer l'UI
        network$.subscribe({ error: () => {} });
      });
    }

    return network$;
  }

  getProjectsByAuthor(authorId: string, page = 0, size = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/user/${authorId}`, { params });
  }

  getProjectById(id: string, forceRefresh = false): Observable<ApiResponse<Project>> {
    const cached = this.singleProjectCache.get(id);
    const network$ = this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        if (res && res.success) {
          this.singleProjectCache.set(id, { timestamp: Date.now(), data: res });
        }
      })
    );

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return new Observable<ApiResponse<Project>>((observer) => {
        observer.next(cached.data);
        observer.complete();
        network$.subscribe({ error: () => {} });
      });
    }

    return network$;
  }

  clearMemoryCache(): void {
    this.projectsCache.clear();
    this.singleProjectCache.clear();
  }

  getMyProjects(page = 0, size = 50): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-projects`, { params });
  }

  createProject(data: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data).pipe(tap(() => this.clearMemoryCache()));
  }

  updateProject(id: string, data: any): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data).pipe(tap(() => this.clearMemoryCache()));
  }

  toggleProjectStatus(id: string): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.apiUrl}/${id}/toggle-status`, {}).pipe(tap(() => this.clearMemoryCache()));
  }

  deleteProject(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(tap(() => this.clearMemoryCache()));
  }

  recognizeProject(id: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/recognize`, {}).pipe(tap(() => this.clearMemoryCache()));
  }

  unrecognizeProject(id: string): Observable<ApiResponse<Project>> {
    return this.http.delete<ApiResponse<Project>>(`${this.apiUrl}/${id}/recognize`).pipe(tap(() => this.clearMemoryCache()));
  }

  recordView(projectId: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${projectId}/view`, {});
  }

  getComments(projectId: string): Observable<ApiResponse<ProjectComment[]>> {
    return this.http.get<ApiResponse<ProjectComment[]>>(`${this.apiUrl}/${projectId}/comments`);
  }

  addComment(projectId: string, content: string): Observable<ApiResponse<ProjectComment>> {
    return this.http.post<ApiResponse<ProjectComment>>(`${this.apiUrl}/${projectId}/comments`, { content });
  }

  uploadImage(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(getUploadApiUrl('image'), formData);
  }

  uploadPdf(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(getUploadApiUrl('pdf'), formData);
  }
}

