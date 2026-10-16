import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MemberStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userTitle?: string;
  role: string;
  message?: string;
  cvUrl?: string;
  status: MemberStatus;
  joinedAt?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  rejectionReason?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  createdById: string;
  createdByName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue: boolean;
  completedAt?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectProgress {
  projectId: string;
  projectTitle: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  activeMembersCount: number;
  isProjectLead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectCollaborationService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8081/api/v1/projects';

  // ── MEMBRES ──
  applyToJoin(projectId: string, role: string, message?: string, cvUrl?: string): Observable<ApiResponse<ProjectMember>> {
    return this.http.post<ApiResponse<ProjectMember>>(`${this.baseUrl}/${projectId}/collaboration/members`, { role, message, cvUrl });
  }

  getMembers(projectId: string): Observable<ApiResponse<ProjectMember[]>> {
    return this.http.get<ApiResponse<ProjectMember[]>>(`${this.baseUrl}/${projectId}/collaboration/members`);
  }

  updateMemberStatus(projectId: string, memberId: string, status: MemberStatus): Observable<ApiResponse<ProjectMember>> {
    return this.http.patch<ApiResponse<ProjectMember>>(`${this.baseUrl}/${projectId}/collaboration/members/${memberId}`, { status });
  }

  // ── TÂCHES KANBAN ──
  getTasks(projectId: string): Observable<ApiResponse<ProjectTask[]>> {
    return this.http.get<ApiResponse<ProjectTask[]>>(`${this.baseUrl}/${projectId}/collaboration/tasks`);
  }

  createTask(projectId: string, task: { title: string; description?: string; assignedToId?: string; priority?: TaskPriority; status?: TaskStatus; dueDate?: string }): Observable<ApiResponse<ProjectTask>> {
    return this.http.post<ApiResponse<ProjectTask>>(`${this.baseUrl}/${projectId}/collaboration/tasks`, task);
  }

  updateTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Observable<ApiResponse<ProjectTask>> {
    return this.http.patch<ApiResponse<ProjectTask>>(`${this.baseUrl}/${projectId}/collaboration/tasks/${taskId}`, updates);
  }

  validateTask(projectId: string, taskId: string): Observable<ApiResponse<ProjectTask>> {
    return this.http.post<ApiResponse<ProjectTask>>(`${this.baseUrl}/${projectId}/collaboration/tasks/${taskId}/validate`, {});
  }

  rejectTask(projectId: string, taskId: string, reason: string): Observable<ApiResponse<ProjectTask>> {
    return this.http.post<ApiResponse<ProjectTask>>(`${this.baseUrl}/${projectId}/collaboration/tasks/${taskId}/reject`, { reason });
  }

  deleteTask(projectId: string, taskId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/collaboration/tasks/${taskId}`);
  }

  // ── SUIVI DU PROJET ──
  getProgress(projectId: string): Observable<ApiResponse<ProjectProgress>> {
    return this.http.get<ApiResponse<ProjectProgress>>(`${this.baseUrl}/${projectId}/collaboration/progress`);
  }

  getMyCollaborations(): Observable<ApiResponse<ProjectProgress[]>> {
    return this.http.get<ApiResponse<ProjectProgress[]>>(`http://localhost:8081/api/v1/projects/my-collaborations`);
  }
}
