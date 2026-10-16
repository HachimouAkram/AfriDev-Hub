import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class TechEventService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/events';

  getEvents(type?: TechEventType, page: number = 0, size: number = 12): Observable<ApiResponse<PageResponse<TechEvent>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<ApiResponse<PageResponse<TechEvent>>>(this.apiUrl, { params });
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
    return this.http.post<ApiResponse<TechEvent>>(this.apiUrl, data);
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
    return this.http.put<ApiResponse<TechEvent>>(`${this.apiUrl}/${id}`, data);
  }

  voteEvent(id: string, voteType: VoteType): Observable<ApiResponse<TechEvent>> {
    return this.http.post<ApiResponse<TechEvent>>(`${this.apiUrl}/${id}/vote`, { voteType });
  }

  deleteEvent(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
