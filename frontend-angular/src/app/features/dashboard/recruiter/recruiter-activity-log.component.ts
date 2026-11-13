import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyService, Company, CompanyActivityLog } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recruiter-activity-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-log-container">
      <div class="log-header-card">
        <div class="header-info">
          <h2>Journal d'Activité de l'Entreprise</h2>
          <p>Traçabilité complète des actions effectuées au sein de l'entreprise par tous les recruteurs.</p>
        </div>
        <span class="badge-role" [class.badge-owner]="isOwner()">
          {{ isOwner() ? 'Vue Globale (Propriétaire)' : 'Vos actions personnelles' }}
        </span>
      </div>

      <div class="log-timeline-card" *ngIf="!isLoading(); else loadingTpl">
        <div class="timeline" *ngIf="logs().length > 0; else emptyTpl">
          <div class="timeline-item" *ngFor="let log of logs()">
            <div class="timeline-badge" [ngClass]="getBadgeClass(log.activityType)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="getActivitySvgPath(log.activityType)" />
              </svg>
            </div>
            <div class="timeline-content">
              <div class="item-header">
                <span class="actor-name">{{ log.actorName }}</span>
                <span class="actor-email" *ngIf="log.actorEmail">({{ log.actorEmail }})</span>
                <span class="item-date">{{ log.createdAt | date:'medium' }}</span>
              </div>
              <p class="item-desc">{{ log.description }}</p>
              <div class="item-tags" *ngIf="log.targetType">
                <span class="tag">Cible : {{ log.targetType }}</span>
                <span class="tag-type">{{ log.activityType }}</span>
              </div>
            </div>
          </div>
        </div>

        <ng-template #emptyTpl>
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 40px; height: 40px; margin: 0 auto 0.75rem auto; color: #64748b; display: block;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Aucune action enregistrée pour le moment dans le journal d'activité.</p>
          </div>
        </ng-template>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement du journal d'activité...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .activity-log-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .log-header-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-info h2 {
      margin: 0;
      font-size: 1.3rem;
      color: var(--text-primary, #f8fafc);
    }

    .header-info p {
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
    }

    .badge-role {
      font-size: 0.78rem;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      font-weight: 600;
    }

    .badge-role.badge-owner {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .log-timeline-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .timeline-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .badge-green { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
    .badge-blue { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #3b82f6; }
    .badge-amber { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; }
    .badge-red { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }

    .timeline-content {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1rem;
      flex: 1;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.35rem;
    }

    .actor-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: #10b981;
    }

    .actor-email {
      font-size: 0.78rem;
      color: #64748b;
    }

    .item-date {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-left: auto;
    }

    .item-desc {
      margin: 0;
      font-size: 0.88rem;
      color: var(--text-primary, #f8fafc);
      line-height: 1.4;
    }

    .item-tags {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.72rem;
    }

    .tag {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .tag-type {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RecruiterActivityLogComponent implements OnInit {
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);

  company = signal<Company | null>(null);
  logs = signal<CompanyActivityLog[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.loadLogs(res.data.id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  isOwner(): boolean {
    const comp = this.company();
    const curr = this.authService.currentUser();
    return !!(comp && curr && comp.ownerId === curr.id);
  }

  loadLogs(companyId: string): void {
    this.isLoading.set(true);
    this.companyService.getActivityLogs(companyId, 0, 50).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.logs.set(res.data.content);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getActivitySvgPath(type: string): string {
    switch (type) {
      case 'OPPORTUNITY_PUBLISHED': return 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V4.5a2.25 2.25 0 00-2.25-2.25h-3a2.25 2.25 0 00-2.25 2.25v1.644m6 0a47.4 47.4 0 01-6 0';
      case 'CANDIDATE_ACCEPTED': return 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'CANDIDATE_REJECTED': return 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'EVENT_PUBLISHED': return 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5';
      case 'RESOURCE_PUBLISHED': return 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25';
      case 'MEMBER_INVITED': return 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z';
      case 'MEMBER_REMOVED': return 'M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z';
      case 'PROFILE_UPDATED': return 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z';
      default: return 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'OPPORTUNITY_PUBLISHED':
      case 'CANDIDATE_ACCEPTED':
      case 'EVENT_PUBLISHED': return 'badge-green';
      case 'MEMBER_INVITED':
      case 'RESOURCE_PUBLISHED': return 'badge-blue';
      case 'PROFILE_UPDATED': return 'badge-amber';
      case 'CANDIDATE_REJECTED':
      case 'MEMBER_REMOVED': return 'badge-red';
      default: return '';
    }
  }
}

