import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiResponse, User } from './auth.service';
import { AuthService } from './auth.service';
import { OfflineSyncService } from './offline-sync.service';
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
  sourceCodeArchiveUrl?: string;
  hasSourceCodeArchive?: boolean;
  isPurchasedByCurrentUser?: boolean;
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
  isOfflinePending?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private offlineSync = inject(OfflineSyncService);
  private authService = inject(AuthService);
  private apiUrl = '/api/v1/projects';

  // Cache mémoire réactif (Stale-While-Revalidate) pour chargement instantané (0 ms)
  private projectsCache = new Map<string, { timestamp: number; data: ApiResponse<any> }>();
  private singleProjectCache = new Map<string, { timestamp: number; data: ApiResponse<Project> }>();
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  getProjects(page = 0, size = 20, projectType?: string, sort?: string, forceRefresh = false): Observable<ApiResponse<any>> {
    const cacheKey = `p_${page}_s_${size}_t_${projectType || 'ALL'}_sort_${sort || 'DEFAULT'}`;
    const cached = this.projectsCache.get(cacheKey);
    const offlinePublic = this.offlineSync.getCachedData<any>('afridev_offline_projects_all');

    if (!this.offlineSync.isNetworkAvailable() && offlinePublic) {
      return of({ success: true, data: offlinePublic });
    }

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
          this.offlineSync.setCachedData('afridev_offline_projects_all', res.data);
          const items: Project[] = res?.data?.content || res?.data || [];
          if (Array.isArray(items)) {
            items.forEach(p => {
              if (p && p.id) {
                this.singleProjectCache.set(p.id, { timestamp: Date.now(), data: { success: true, data: p } });
                this.offlineSync.setCachedData(`afridev_offline_proj_${p.id}`, p);
              }
            });
          }
        }
      }),
      catchError(() => {
        if (offlinePublic) {
          return of({ success: true, data: offlinePublic });
        }
        return of({ success: true, data: { content: [], totalElements: 0, totalPages: 0 } });
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
    const offlineProj = this.offlineSync.getCachedData<Project>(`afridev_offline_proj_${id}`);

    if (!this.offlineSync.isNetworkAvailable() && offlineProj) {
      return of({ success: true, data: offlineProj });
    }

    const network$ = this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        if (res && res.success && res.data) {
          this.singleProjectCache.set(id, { timestamp: Date.now(), data: res });
          this.offlineSync.setCachedData(`afridev_offline_proj_${id}`, res.data);
        }
      }),
      catchError(() => {
        if (offlineProj) {
          return of({ success: true, data: offlineProj });
        }
        return of({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Projet non disponible hors-ligne' }
        } as any);
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
    const offlineMyProjects = this.offlineSync.getCachedData<any>('afridev_offline_my_projects');

    if (!this.offlineSync.isNetworkAvailable() && offlineMyProjects) {
      return of({ success: true, data: this.formatMyProjectsWithPending(offlineMyProjects) });
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-projects`, { params }).pipe(
      tap((res) => {
        if (res && res.success) {
          this.offlineSync.setCachedData('afridev_offline_my_projects', res.data);
        }
      }),
      map((res) => {
        return {
          ...res,
          data: this.formatMyProjectsWithPending(res.data)
        };
      }),
      catchError(() => {
        if (offlineMyProjects) {
          return of({
            success: true,
            data: this.formatMyProjectsWithPending(offlineMyProjects)
          });
        }
        return of({
          success: true,
          data: this.formatMyProjectsWithPending([])
        });
      })
    );
  }

  private formatMyProjectsWithPending(data: any): any {
    const pending = this.offlineSync.getCachedData<Project[]>('afridev_offline_pending_projects') || [];
    let items: Project[] = [];
    let isPage = false;

    if (Array.isArray(data)) {
      items = [...data];
    } else if (data && Array.isArray(data.content)) {
      items = [...data.content];
      isPage = true;
    }

    // Fusionner les projets en attente sans doublon
    if (pending.length > 0) {
      pending.forEach(p => {
        if (!items.some(existing => existing.id === p.id)) {
          items.unshift(p);
        }
      });
    }

    if (isPage) {
      return { ...data, content: items, totalElements: items.length };
    }
    return items;
  }

  createProject(data: any): Observable<ApiResponse<Project>> {
    if (!this.offlineSync.isNetworkAvailable()) {
      return of(this.saveProjectLocally(data));
    }

    return this.http.post<ApiResponse<Project>>(this.apiUrl, data).pipe(
      tap(() => this.clearMemoryCache()),
      catchError((err) => {
        if (!navigator.onLine || err.status === 0 || err.status === 504) {
          return of(this.saveProjectLocally(data));
        }
        throw err;
      })
    );
  }

  private saveProjectLocally(data: any): ApiResponse<Project> {
    const localId = 'local_proj_' + Date.now();
    const user = this.authService.currentUser();
    const localProj: Project = {
      ...data,
      id: localId,
      author: user || {
        id: 'local_user',
        email: 'local@afridev.hub',
        role: 'DEVELOPER' as any
      },
      screenshots: data.screenshots || [],
      stack: Array.isArray(data.stack) ? data.stack : (data.stackInput ? data.stackInput.split(',').map((s: string) => s.trim()) : []),
      isOpenSource: Boolean(data.isOpenSource),
      recognitionsCount: 0,
      recognizedByCurrentUser: false,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      isOfflinePending: true
    };

    // 1. Ajouter aux projets en attente
    const pending = this.offlineSync.getCachedData<Project[]>('afridev_offline_pending_projects') || [];
    pending.unshift(localProj);
    this.offlineSync.setCachedData('afridev_offline_pending_projects', pending);

    // 2. Mettre en file d'attente de synchronisation
    this.offlineSync.queueAction('CREATE_PROJECT', data);

    // 3. Mettre à jour la liste des projets personnels en cache
    const myProjects = this.offlineSync.getCachedData<any>('afridev_offline_my_projects') || [];
    if (Array.isArray(myProjects)) {
      myProjects.unshift(localProj);
      this.offlineSync.setCachedData('afridev_offline_my_projects', myProjects);
    }

    // 4. Ajouter également au cache public pour consultation immédiate
    const publicCached = this.offlineSync.getCachedData<any>('afridev_offline_projects_all');
    if (publicCached) {
      if (Array.isArray(publicCached)) {
        publicCached.unshift(localProj);
        this.offlineSync.setCachedData('afridev_offline_projects_all', publicCached);
      } else if (publicCached.content && Array.isArray(publicCached.content)) {
        publicCached.content.unshift(localProj);
        this.offlineSync.setCachedData('afridev_offline_projects_all', publicCached);
      }
    }

    this.clearMemoryCache();
    return {
      success: true,
      data: localProj,
      message: 'Projet enregistré en mode hors-ligne. Il sera synchronisé dès le retour de votre connexion.'
    };
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

  uploadArchive(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(getUploadApiUrl('archive'), formData);
  }

  downloadSourceCode(id: string): Observable<ApiResponse<{ downloadUrl: string }>> {
    return this.http.get<ApiResponse<{ downloadUrl: string }>>(`${this.apiUrl}/${id}/source-code`);
  }

  getProjectCoverUrl(project: Project | null | undefined): string {
    if (project?.screenshots && project.screenshots.length > 0) {
      return project.screenshots[0];
    }
    const stack = (project?.stack || []).join(' ').toLowerCase();
    if (stack.includes('ai') || stack.includes('python') || stack.includes('data') || stack.includes('llm') || stack.includes('intelligence')) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    }
    if (stack.includes('mobile') || stack.includes('flutter') || stack.includes('react native') || stack.includes('android') || stack.includes('ios')) {
      return 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1200&q=80';
    }
    if (stack.includes('fintech') || stack.includes('pay') || stack.includes('bank') || stack.includes('crypto')) {
      return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
    }
    if (stack.includes('cloud') || stack.includes('devops') || stack.includes('docker') || stack.includes('aws') || stack.includes('kubernetes')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
    }
    if (stack.includes('angular') || stack.includes('react') || stack.includes('vue') || stack.includes('web') || stack.includes('frontend')) {
      return 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';
    }
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';
  }
}

