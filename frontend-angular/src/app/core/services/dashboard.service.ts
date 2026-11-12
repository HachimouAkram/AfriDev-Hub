import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface DashboardKpiResponse {
  totalProjects: number;
  totalOpportunities: number;
  totalRelations: number;
  totalApplications: number;
  xpPoints: number;
  levelTitle: string;
  levelNumber: number;
  cached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/dashboard';

  getDashboardKpis(): Observable<ApiResponse<DashboardKpiResponse>> {
    return this.http.get<ApiResponse<DashboardKpiResponse>>(`${this.apiUrl}/kpis`);
  }
}

