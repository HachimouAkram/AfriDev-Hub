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
          {{ isOwner() ? '👑 Vue Globale (Propriétaire)' : '💼 Vos actions personnelles' }}
        </span>
      </div>

      <div class="log-timeline-card" *ngIf="!isLoading(); else loadingTpl">
        <div class="timeline" *ngIf="logs().length > 0; else emptyTpl">
          <div class="timeline-item" *ngFor="let log of logs()">
            <div class="timeline-badge" [ngClass]="getBadgeClass(log.activityType)">
              {{ getActivityIcon(log.activityType) }}
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
            <span class="empty-icon">📜</span>
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

    .badge-green { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
    .badge-blue { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
    .badge-amber { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }
    .badge-red { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }

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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'OPPORTUNITY_PUBLISHED': return '💼';
      case 'CANDIDATE_ACCEPTED': return '🤝';
      case 'CANDIDATE_REJECTED': return '❌';
      case 'EVENT_PUBLISHED': return '📅';
      case 'RESOURCE_PUBLISHED': return '📚';
      case 'MEMBER_INVITED': return '✉️';
      case 'MEMBER_REMOVED': return '🚫';
      case 'PROFILE_UPDATED': return '✏️';
      default: return '📌';
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

