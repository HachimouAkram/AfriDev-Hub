import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from './auth.service';

export type TechEventType = 'MEETUP' | 'CONFERENCE' | 'HACKATHON' | 'WORKSHOP' | 'WEBINAR';
export type VoteType = 'AGREE' | 'DISAGREE';

export interface TechEvent {
  id: string;
  title: string;
  description: string;
  type: TechEventType;
  startDate: string;
  endDate?: string;
  location: string;
  isOnline: boolean;
  eventUrl?: string;
  bannerUrl?: string;
  organizerId?: string;
  organizerName: string;
  organizerAvatar?: string;
  tags: string[];
  agreeCount: number;
  disagreeCount: number;
  userVote?: VoteType | null;
  createdAt: string;
  matchPercentage?: number;
  suggestionReason?: string;
  matchedTags?: string[];
  isOrganizerFollowed?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last?: boolean;
  first?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TechEventService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/events';
  private cache = new Map<string, { timestamp: number; data: ApiResponse<PageResponse<TechEvent>> }>();
  private CACHE_TTL_MS = 5 * 60 * 1000;

  getEvents(type?: TechEventType, page: number = 0, size: number = 20, sort: string = 'SUGGESTED', forceRefresh = false): Observable<ApiResponse<PageResponse<TechEvent>>> {
    const cacheKey = `ev_${type || 'ALL'}_${page}_${size}_${sort}`;
    const cached = this.cache.get(cacheKey);

    let params = new HttpParams()
      .set('sort', sort)
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) {
      params = params.set('type', type);
    }

    const network$ = this.http.get<ApiResponse<PageResponse<TechEvent>>>(this.apiUrl, { params }).pipe(
      tap((res) => {
        if (res && res.success) {
          this.cache.set(cacheKey, { timestamp: Date.now(), data: res });
        }
      })
    );

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return new Observable<ApiResponse<PageResponse<TechEvent>>>((observer) => {
        observer.next(cached.data);
        observer.complete();
        network$.subscribe({ error: () => {} });
      });
    }

    return network$;
  }

  getEventById(id: string): Observable<ApiResponse<TechEvent>> {
    return this.http.get<ApiResponse<TechEvent>>(`${this.apiUrl}/${id}`);
  }

  createEvent(data: {
    title: string;
    description: string;
    type: TechEventType;
    startDate: string;
    endDate?: string;
    location?: string;
    isOnline?: boolean;
    eventUrl?: string;
    bannerUrl?: string;
    tags?: string[];
  }): Observable<ApiResponse<TechEvent>> {
    return this.http.post<ApiResponse<TechEvent>>(this.apiUrl, data).pipe(tap(() => this.cache.clear()));
  }

  getMyEvents(): Observable<ApiResponse<TechEvent[]>> {
    return this.http.get<ApiResponse<TechEvent[]>>(`${this.apiUrl}/my-events`);
  }

  updateEvent(id: string, data: {
    title: string;
    description: string;
    type: TechEventType;
    startDate: string;
    endDate?: string;
    location?: string;
    isOnline?: boolean;
    eventUrl?: string;
    bannerUrl?: string;
    tags?: string[];
  }): Observable<ApiResponse<TechEvent>> {
    return this.http.put<ApiResponse<TechEvent>>(`${this.apiUrl}/${id}`, data).pipe(tap(() => this.cache.clear()));
  }

  voteEvent(id: string, voteType: VoteType): Observable<ApiResponse<TechEvent>> {
    return this.http.post<ApiResponse<TechEvent>>(`${this.apiUrl}/${id}/vote`, { voteType }).pipe(tap(() => this.cache.clear()));
  }

  deleteEvent(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(tap(() => this.cache.clear()));
  }
}
