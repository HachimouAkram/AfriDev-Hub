import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiResponse } from './auth.service';
import { OfflineSyncService } from './offline-sync.service';

export type ResourceType = 'VIDEO' | 'TUTORIAL' | 'COURSE' | 'ARTICLE' | 'TECH_CHEATSHEET';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  level: SkillLevel;
  technology: string;
  language: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  contentMarkdown?: string;
  pdfUrl?: string;
  isPaid: boolean;
  price?: number;
  currency: string;
  durationMinutes: number;
  xpReward: number;
  viewsCount: number;
  completionsCount: number;
  authorName: string;
  isCompletedByCurrentUser?: boolean;
  isUnlockedByCurrentUser?: boolean;
  createdAt: string;
  isOfflinePending?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private http = inject(HttpClient);
  private offlineSync = inject(OfflineSyncService);
  private baseUrl = '/api/v1/resources';
  private cache = new Map<string, { timestamp: number; data: any }>();
  private CACHE_TTL_MS = 5 * 60 * 1000;

  search(
    type?: ResourceType,
    level?: SkillLevel,
    tech?: string,
    lang?: string,
    isPaid?: boolean,
    page: number = 0,
    size: number = 12,
    forceRefresh: boolean = false
  ): Observable<any> {
    const cacheKey = `res_${type || 'ALL'}_${level || 'ALL'}_${tech || ''}_${lang || ''}_${isPaid ?? 'ALL'}_${page}_${size}`;
    const cached = this.cache.get(cacheKey);
    const offlinePublic = this.offlineSync.getCachedData<any>('afridev_offline_resources_all');

    if (!this.offlineSync.isNetworkAvailable() && offlinePublic) {
      return of(offlinePublic);
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) params = params.set('type', type);
    if (level) params = params.set('level', level);
    if (tech) params = params.set('tech', tech);
    if (lang) params = params.set('lang', lang);
    if (isPaid !== undefined && isPaid !== null) params = params.set('isPaid', isPaid.toString());

    const network$ = this.http.get<ApiResponse<any>>(this.baseUrl, { params }).pipe(
      map(res => res.data),
      tap((data) => {
        if (data) {
          this.cache.set(cacheKey, { timestamp: Date.now(), data });
          this.offlineSync.setCachedData('afridev_offline_resources_all', data);
        }
      }),
      catchError(() => {
        if (offlinePublic) {
          return of(offlinePublic);
        }
        return of({ content: [], totalElements: 0, totalPages: 0 });
      })
    );

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return new Observable<any>((observer) => {
        observer.next(cached.data);
        observer.complete();
        network$.subscribe({ error: () => {} });
      });
    }

    return network$;
  }

  getById(id: string): Observable<ResourceItem> {
    const offlineItem = this.offlineSync.getCachedData<ResourceItem>(`afridev_offline_res_${id}`);
    if (!this.offlineSync.isNetworkAvailable() && offlineItem) {
      return of(offlineItem);
    }

    return this.http.get<ApiResponse<ResourceItem>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data),
      tap((item) => {
        if (item) {
          this.offlineSync.setCachedData(`afridev_offline_res_${id}`, item);
        }
      }),
      catchError(() => {
        if (offlineItem) {
          return of(offlineItem);
        }
        throw new Error('Formation non disponible hors-ligne');
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  completeResource(id: string): Observable<ResourceItem> {
    return this.http.post<ApiResponse<ResourceItem>>(`${this.baseUrl}/${id}/complete`, {}).pipe(
      map(res => {
        this.clearCache();
        return res.data;
      })
    );
  }

  createResource(req: ResourceCreatePayload): Observable<ResourceItem> {
    if (!this.offlineSync.isNetworkAvailable()) {
      return of(this.saveResourceLocally(req));
    }

    return this.http.post<ApiResponse<ResourceItem>>(this.baseUrl, req).pipe(
      map(res => {
        this.clearCache();
        return res.data;
      }),
      catchError((err) => {
        if (!navigator.onLine || err.status === 0 || err.status === 504) {
          return of(this.saveResourceLocally(req));
        }
        throw err;
      })
    );
  }

  private saveResourceLocally(req: ResourceCreatePayload): ResourceItem {
    const localId = 'local_res_' + Date.now();
    const localItem: ResourceItem = {
      ...req,
      id: localId,
      currency: req.currency || 'XOF',
      durationMinutes: req.durationMinutes || 30,
      xpReward: req.xpReward || 50,
      viewsCount: 0,
      completionsCount: 0,
      authorName: 'Moi (hors-ligne)',
      createdAt: new Date().toISOString(),
      isOfflinePending: true
    };

    // 1. Mettre en file d'attente pour sync
    this.offlineSync.queueAction('CREATE_RESOURCE', req);

    // 2. Mettre à jour le cache local public
    const publicCached = this.offlineSync.getCachedData<any>('afridev_offline_resources_all');
    if (publicCached) {
      if (Array.isArray(publicCached)) {
        publicCached.unshift(localItem);
        this.offlineSync.setCachedData('afridev_offline_resources_all', publicCached);
      } else if (publicCached.content && Array.isArray(publicCached.content)) {
        publicCached.content.unshift(localItem);
        this.offlineSync.setCachedData('afridev_offline_resources_all', publicCached);
      }
    }

    this.clearCache();
    return localItem;
  }

  getMyResources(page: number = 0, size: number = 50): Observable<any> {
    const offlineMy = this.offlineSync.getCachedData<any>('afridev_offline_my_resources');
    if (!this.offlineSync.isNetworkAvailable() && offlineMy) {
      return of(offlineMy);
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/my`, { params }).pipe(
      map(res => res.data),
      tap((data) => {
        if (data) {
          this.offlineSync.setCachedData('afridev_offline_my_resources', data);
        }
      }),
      catchError(() => {
        if (offlineMy) {
          return of(offlineMy);
        }
        return of({ content: [], totalElements: 0, totalPages: 0 });
      })
    );
  }

  updateResource(id: string, req: ResourceCreatePayload): Observable<ResourceItem> {
    return this.http.put<ApiResponse<ResourceItem>>(`${this.baseUrl}/${id}`, req).pipe(
      map(res => {
        this.clearCache();
        return res.data;
      })
    );
  }

  deleteResource(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`).pipe(
      map(res => {
        this.clearCache();
        return res.data;
      })
    );
  }
}

export interface ResourceCreatePayload {
  title: string;
  description: string;
  type: ResourceType;
  level: SkillLevel;
  technology: string;
  language: string;
  youtubeUrl?: string | null;
  thumbnailUrl?: string | null;
  contentMarkdown?: string | null;
  pdfUrl?: string | null;
  isPaid: boolean;
  price?: number | null;
  currency?: string | null;
  durationMinutes?: number | null;
  xpReward?: number | null;
}
