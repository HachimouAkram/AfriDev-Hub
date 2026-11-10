import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from './auth.service';

export interface QueuedAction {
  clientActionId: string;
  actionType: string;
  payload: any;
  clientTimestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private http = inject(HttpClient);
  private readonly QUEUE_KEY = 'afridev_offline_queue';

  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  pendingCount = signal<number>(0);
  isSyncing = signal<boolean>(false);
  lastSyncMessage = signal<string>('');

  constructor() {
    this.initNetworkListeners();
    this.refreshPendingCount();
  }

  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.triggerAutoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  getQueue(): QueuedAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  queueAction(actionType: string, payload: any): string {
    const actionId = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const item: QueuedAction = {
      clientActionId: actionId,
      actionType,
      payload,
      clientTimestamp: Date.now()
    };

    const q = this.getQueue();
    q.push(item);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(q));
    this.refreshPendingCount();

    if (this.isOnline()) {
      this.triggerAutoSync();
    }
    return actionId;
  }

  refreshPendingCount(): void {
    this.pendingCount.set(this.getQueue().length);
  }

  triggerAutoSync(): void {
    const q = this.getQueue();
    if (q.length === 0 || this.isSyncing()) return;

    this.isSyncing.set(true);
    this.http.post<ApiResponse<any>>('/api/v1/sync', { actions: q }).subscribe({
      next: (res) => {
        this.isSyncing.set(false);
        // Nettoyer la queue
        localStorage.removeItem(this.QUEUE_KEY);
        this.refreshPendingCount();
        this.lastSyncMessage.set('Synchronisation automatique réussie ✓');
        setTimeout(() => this.lastSyncMessage.set(''), 4000);
      },
      error: (err) => {
        this.isSyncing.set(false);
      }
    });
  }
}
