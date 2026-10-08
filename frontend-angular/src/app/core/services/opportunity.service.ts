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
  status: string;
  createdAt: string;
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
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/opportunities';

  getOpportunities(type?: string, page = 0, size = 10): Observable<ApiResponse<any>> {
    let params = new HttpParams()
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

  applyToOpportunity(id: string, message: string, cvUrl?: string): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(`${this.apiUrl}/${id}/apply`, { message, cvUrl });
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

  updateApplicationStatus(applicationId: string, status: string): Observable<ApiResponse<Application>> {
    return this.http.patch<ApiResponse<Application>>(`${this.apiUrl}/applications/${applicationId}/status`, {}, {
      params: new HttpParams().set('status', status)
    });
  }
}
