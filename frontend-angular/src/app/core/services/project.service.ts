import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, User } from './auth.service';

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
  recognitionsCount: number;
  recognizedByCurrentUser: boolean;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/projects';

  getProjects(page = 0, size = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

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

  createProject(data: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
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
}

