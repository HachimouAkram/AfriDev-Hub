import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiResponse } from './auth.service';
import { OfflineSyncService } from './offline-sync.service';

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
  private offlineSync = inject(OfflineSyncService);
  private apiUrl = '/api/v1/dashboard';
  private readonly CACHE_KEY = 'afridev_offline_kpis';

  getDashboardKpis(): Observable<ApiResponse<DashboardKpiResponse>> {
    const cached = this.offlineSync.getCachedData<DashboardKpiResponse>(this.CACHE_KEY);

    if (!this.offlineSync.isNetworkAvailable() && cached) {
      return of({ success: true, data: { ...cached, cached: true } });
    }

    return this.http.get<ApiResponse<DashboardKpiResponse>>(`${this.apiUrl}/kpis`).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          this.offlineSync.setCachedData(this.CACHE_KEY, res.data);
        }
      }),
      catchError(() => {
        if (cached) {
          return of({ success: true, data: { ...cached, cached: true } });
        }
        return of({
          success: true,
          data: {
            totalProjects: 0,
            totalOpportunities: 0,
            totalRelations: 0,
            totalApplications: 0,
            xpPoints: 0,
            levelTitle: 'Junior',
            levelNumber: 1,
            cached: true
          }
        });
      })
    );
  }
}

