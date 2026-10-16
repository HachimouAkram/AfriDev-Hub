import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

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
  private apiUrl = 'http://localhost:8081/api/v1/projects';

  getProjects(page = 0, size = 20, projectType?: string, sort?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (projectType && projectType !== 'ALL') {
      params = params.set('projectType', projectType);
    }

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getProjectsByAuthor(authorId: string, page = 0, size = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/user/${authorId}`, { params });
  }

  getProjectById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  getMyProjects(page = 0, size = 50): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-projects`, { params });
  }

  createProject(data: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
  }

  updateProject(id: string, data: any): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data);
  }

  toggleProjectStatus(id: string): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  deleteProject(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  recognizeProject(id: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/recognize`, {});
  }

  unrecognizeProject(id: string): Observable<ApiResponse<Project>> {
    return this.http.delete<ApiResponse<Project>>(`${this.apiUrl}/${id}/recognize`);
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
    return this.http.post<ApiResponse<{ url: string }>>('http://localhost:8081/api/v1/uploads/image', formData);
  }

  uploadPdf(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>('http://localhost:8081/api/v1/uploads/pdf', formData);
  }
}

