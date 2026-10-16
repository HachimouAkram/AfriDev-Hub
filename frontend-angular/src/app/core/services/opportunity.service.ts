import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

export interface Opportunity {
  id: string;
  publisher: User;
  title: string;
  description: string;
  type: 'JOB' | 'FREELANCE' | 'COLLABORATION' | 'INTERNSHIP';
  location: string;
  isRemote: boolean;
  stack: string[];
  budget?: string;
  deadline?: string;
  maxApplicants?: number;
  acceptedCount?: number;
  isPaid?: boolean;
  status: string;
  createdAt: string;
  matchPercentage?: number;
  suggestionReason?: string;
  matchedStack?: string[];
  isPublisherFollowed?: boolean;
  hasApplied?: boolean;
}

export interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle?: string;
  opportunityType?: string;
  opportunityLocation?: string;
  opportunityBudget?: string;
  publisherId?: string;
  publisherName?: string;
  applicant: User;
  message: string;
  cvUrl?: string;
  coverLetterUrl?: string;
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/opportunities';

  getOpportunities(type?: string, page = 0, size = 20, sort = 'SUGGESTED'): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('sort', sort)
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) params = params.set('type', type);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getOpportunityById(id: string): Observable<ApiResponse<Opportunity>> {
    return this.http.get<ApiResponse<Opportunity>>(`${this.apiUrl}/${id}`);
  }

  createOpportunity(data: any): Observable<ApiResponse<Opportunity>> {
    return this.http.post<ApiResponse<Opportunity>>(this.apiUrl, data);
  }

  updateOpportunity(id: string, data: any): Observable<ApiResponse<Opportunity>> {
    return this.http.put<ApiResponse<Opportunity>>(`${this.apiUrl}/${id}`, data);
  }

  toggleOpportunityStatus(id: string): Observable<ApiResponse<Opportunity>> {
    return this.http.patch<ApiResponse<Opportunity>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  deleteOpportunity(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  applyToOpportunity(id: string, message: string, cvUrl?: string, coverLetterUrl?: string): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(`${this.apiUrl}/${id}/apply`, { message, cvUrl, coverLetterUrl });
  }

  getApplications(id: string): Observable<ApiResponse<Application[]>> {
    return this.http.get<ApiResponse<Application[]>>(`${this.apiUrl}/${id}/applications`);
  }

  getMyApplications(): Observable<ApiResponse<Application[]>> {
    return this.http.get<ApiResponse<Application[]>>(`${this.apiUrl}/my-applications`);
  }

  getMyPostedOpportunities(): Observable<ApiResponse<Opportunity[]>> {
    return this.http.get<ApiResponse<Opportunity[]>>(`${this.apiUrl}/my-posted`);
  }

  getReceivedApplications(): Observable<ApiResponse<Application[]>> {
    return this.http.get<ApiResponse<Application[]>>(`${this.apiUrl}/my-received-applications`);
  }

  updateApplicationStatus(applicationId: string, status: string, reason?: string): Observable<ApiResponse<Application>> {
    let params = new HttpParams().set('status', status);
    if (reason && status === 'REJECTED') {
      params = params.set('reason', reason);
    }
    return this.http.patch<ApiResponse<Application>>(`${this.apiUrl}/applications/${applicationId}/status`, {}, { params });
  }
}
