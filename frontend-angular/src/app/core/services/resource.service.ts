import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiResponse } from './auth.service';

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
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private http = inject(HttpClient);
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
        }
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
    return this.http.get<ApiResponse<ResourceItem>>(`${this.baseUrl}/${id}`).pipe(map(res => res.data));
  }

  completeResource(id: string): Observable<ResourceItem> {
    return this.http.post<ApiResponse<ResourceItem>>(`${this.baseUrl}/${id}/complete`, {}).pipe(map(res => res.data));
  }

  createResource(req: any): Observable<ResourceItem> {
    return this.http.post<ApiResponse<ResourceItem>>(this.baseUrl, req).pipe(map(res => res.data));
  }
}
