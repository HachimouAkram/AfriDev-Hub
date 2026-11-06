import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface MentorCard {
  id: string;
  user: User;
  fullName: string;
  title: string;
  country: string;
  city: string;
  avatarUrl?: string;
  isMentor?: boolean;
  mentorBio?: string;
  mentorHoursPerWeek: number;
  mentorTopics: string[];
  skills: string[];
  menteesHelpedCount: number;
  xpPoints: number;
  levelTitle: string;
  levelNumber: number;
  matchScore?: number;
}

export interface MentorUpdateRequest {
  isMentor?: boolean;
  mentorBio?: string;
  mentorHoursPerWeek?: number;
  mentorTopics?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/mentors';

  getMentors(country?: string, topic?: string, query?: string, page = 0, size = 15): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (country && country !== 'ALL') params = params.set('country', country);
    if (topic && topic !== 'ALL') params = params.set('topic', topic);
    if (query && query.trim()) params = params.set('query', query.trim());

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getTopMentors(limit = 6): Observable<ApiResponse<MentorCard[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<MentorCard[]>>(`${this.apiUrl}/top`, { params });
  }

  getMentorByUserId(userId: string): Observable<ApiResponse<MentorCard>> {
    return this.http.get<ApiResponse<MentorCard>>(`${this.apiUrl}/user/${userId}`);
  }

  updateMentorStatus(data: MentorUpdateRequest): Observable<ApiResponse<MentorCard>> {
    return this.http.put<ApiResponse<MentorCard>>(`${this.apiUrl}/status`, data);
  }
}

