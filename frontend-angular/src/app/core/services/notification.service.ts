import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/notifications';

  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal<number>(0);

  getUserNotifications(): Observable<ApiResponse<NotificationItem[]>> {
    return this.http.get<ApiResponse<NotificationItem[]>>(this.apiUrl).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.data.filter(n => !n.read).length);
        }
      })
    );
  }

  markAsRead(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => this.getUserNotifications().subscribe())
    );
  }

  markAllAsRead(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.getUserNotifications().subscribe())
    );
  }
}
