import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompanyService, Company, CompanyStats, CompanyActivityLog } from '../../../core/services/company.service';
import { CompanyBadgeComponent } from '../../../shared/components/company-badge/company-badge.component';

@Component({
  selector: 'app-recruiter-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, CompanyBadgeComponent],
  template: `
    <div class="recruiter-overview" *ngIf="company(); else loadingTpl">
      <!-- Hero Banner Entreprise -->
      <div class="company-hero-card">
        <div class="company-hero-content">
          <div class="company-logo-badge">
            <img *ngIf="company()?.logoUrl; else placeholderLogo" [src]="company()?.logoUrl" [alt]="company()?.name" />
            <ng-template #placeholderLogo>
              <div class="logo-placeholder">🏢</div>
            </ng-template>
          </div>
          <div class="company-hero-info">
            <div class="title-row">
              <h1 class="company-name">{{ company()?.name }}</h1>
              <app-company-badge [level]="company()?.companyLevel || 'STARTUP'" [xp]="company()?.companyXp" [showXp]="true"></app-company-badge>
              <span *ngIf="company()?.verified" class="verified-pill">✓ Vérifiée</span>
            </div>
            <p class="tagline" *ngIf="company()?.tagline">{{ company()?.tagline }}</p>
            <div class="company-meta">
              <span *ngIf="company()?.city || company()?.country">
                📍 {{ company()?.city }}{{ company()?.city && company()?.country ? ', ' : '' }}{{ company()?.country }}
              </span>
              <span *ngIf="company()?.sector">🏷️ {{ company()?.sector }}</span>
              <span *ngIf="company()?.website">
                🔗 <a [href]="company()?.website" target="_blank" rel="noopener">{{ company()?.website }}</a>
              </span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <a [routerLink]="['/company', company()?.slug]" class="btn btn-outline-white" target="_blank">
            👁️ Fiche publique
          </a>
          <a routerLink="/dashboard/recruiter/profile" class="btn btn-primary-glass">
            ✏️ Modifier l'entreprise
          </a>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-purple">💼</div>
          <div class="metric-data">
            <span class="metric-value">{{ stats()?.totalOpportunities ?? 0 }}</span>
            <span class="metric-label">Offres publiées</span>
            <span class="metric-sub">{{ stats()?.activeOpportunities ?? 0 }} en cours</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-emerald">👥</div>
          <div class="metric-data">
            <span class="metric-value">{{ stats()?.totalApplications ?? 0 }}</span>
            <span class="metric-label">Candidatures reçues</span>
            <span class="metric-sub highlight">{{ stats()?.pendingApplications ?? 0 }} en attente</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-amber">🏆</div>
          <div class="metric-data">
            <span class="metric-value">{{ company()?.companyXp ?? 0 }}</span>
            <span class="metric-label">Points d'XP Entreprise</span>
            <span class="metric-sub">{{ stats()?.acceptedApplications ?? 0 }} talents recrutés</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-blue">🤝</div>
          <div class="metric-data">
            <span class="metric-value">{{ stats()?.membersCount ?? 1 }}</span>
            <span class="metric-label">Recruteurs dans l'équipe</span>
            <span class="metric-sub">
              <a routerLink="/dashboard/recruiter/team" class="link-sub">Gérer l'équipe →</a>
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions-bar">
        <h3>Actions Rapides</h3>
        <div class="actions-group">
          <a routerLink="/dashboard/recruiter/offers" class="quick-btn">
            <span class="quick-icon">➕</span>
            <div class="quick-text">
              <span class="quick-title">Publier une offre</span>
              <span class="quick-desc">+50 XP pour l'entreprise</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/events" class="quick-btn">
            <span class="quick-icon">📅</span>
            <div class="quick-text">
              <span class="quick-title">Organiser un événement tech</span>
              <span class="quick-desc">Webinaire, hackathon (+75 XP)</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/resources" class="quick-btn">
            <span class="quick-icon">📚</span>
            <div class="quick-text">
              <span class="quick-title">Partager une formation</span>
              <span class="quick-desc">Tutoriel ou ressource (+40 XP)</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/team" class="quick-btn">
            <span class="quick-icon">✉️</span>
            <div class="quick-text">
              <span class="quick-title">Inviter un recruteur</span>
              <span class="quick-desc">Collaborer en équipe</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Recent Team Activities Feed -->
      <div class="recent-activities-card">
        <div class="card-header-row">
          <div class="header-title">
            <h3>Historique récent de l'équipe</h3>
            <p>Toutes les actions réalisées au nom de l'entreprise</p>
          </div>
          <a routerLink="/dashboard/recruiter/activity-log" class="btn btn-text">Voir tout →</a>
        </div>

        <div class="activities-list" *ngIf="recentActivities().length > 0; else emptyActivities">
          <div class="activity-row" *ngFor="let act of recentActivities()">
            <div class="act-dot"></div>
            <div class="act-body">
              <div class="act-main">
                <strong class="act-actor">{{ act.actorName }}</strong>
                <span class="act-desc">{{ act.description }}</span>
              </div>
              <span class="act-time">{{ act.createdAt | date:'short' }}</span>
            </div>
          </div>
        </div>
        <ng-template #emptyActivities>
          <div class="empty-state">
            <p>Aucune activité récente enregistrée pour l'instant.</p>
          </div>
        </ng-template>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state" *ngIf="!errorMessage(); else errorTpl">
        <div class="spinner"></div>
        <p>Chargement de votre espace entreprise...</p>
      </div>
      <ng-template #errorTpl>
        <div class="loading-state" style="color: #ef4444;">
          <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">⚠️ {{ errorMessage() }}</p>
          <a routerLink="/dashboard/recruiter/profile" class="btn btn-primary-glass" style="margin-top: 1rem;">
            Créer ou compléter ma fiche entreprise
          </a>
        </div>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    .recruiter-overview {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .company-hero-card {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.35));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .company-hero-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .company-logo-badge {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .company-logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      font-size: 2.5rem;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }

    .company-name {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary, #f8fafc);
      margin: 0;
    }

    .verified-pill {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tagline {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.95rem;
      margin: 0.25rem 0 0.5rem 0;
    }

    .company-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
      flex-wrap: wrap;
    }

    .company-meta a {
      color: #10b981;
      text-decoration: none;
    }

    .hero-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-outline-white {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-outline-white:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .btn-primary-glass {
      background: #10b981;
      color: #064e3b;
      font-weight: 700;
      border: 1px solid #10b981;
    }

    .btn-primary-glass:hover {
      background: #059669;
      color: #fff;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .metric-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .metric-purple { background: rgba(168, 85, 247, 0.15); }
    .metric-emerald { background: rgba(16, 185, 129, 0.15); }
    .metric-amber { background: rgba(245, 158, 11, 0.15); }
    .metric-blue { background: rgba(59, 130, 246, 0.15); }

    .metric-data {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary, #f8fafc);
      line-height: 1.1;
    }

    .metric-label {
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
      margin-top: 2px;
    }

    .metric-sub {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 4px;
    }

    .metric-sub.highlight {
      color: #10b981;
      font-weight: 600;
    }

    .link-sub {
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }

    /* Quick actions */
    .quick-actions-bar {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
    }

    .quick-actions-bar h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: var(--text-primary, #f8fafc);
    }

    .actions-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .quick-btn:hover {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      transform: translateY(-2px);
    }

    .quick-icon {
      font-size: 1.5rem;
    }

    .quick-text {
      display: flex;
      flex-direction: column;
    }

    .quick-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary, #f8fafc);
    }

    .quick-desc {
      font-size: 0.72rem;
      color: #10b981;
    }

    /* Activities */
    .recent-activities-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary, #f8fafc);
    }

    .header-title p {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: var(--text-secondary, #94a3b8);
    }

    .btn-text {
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88rem;
    }

    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.4);
    }

    .act-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      flex-shrink: 0;
    }

    .act-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .act-main {
      font-size: 0.85rem;
      color: var(--text-primary, #f8fafc);
    }

    .act-actor {
      color: #10b981;
      margin-right: 6px;
    }

    .act-time {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #94a3b8);
    }

    .spinner {
      width: 36px;
      height: 36px;
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
export class RecruiterOverviewComponent implements OnInit {
  private companyService = inject(CompanyService);

  company = signal<Company | null>(null);
  stats = signal<CompanyStats | null>(null);
  recentActivities = signal<CompanyActivityLog[]>([]);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.loadStats(res.data.id);
          this.loadActivities(res.data.id);
        } else {
          this.errorMessage.set('Aucune entreprise associée ou erreur de chargement.');
        }
      },
      error: (err) => {
        console.error('Erreur chargement entreprise:', err);
        this.errorMessage.set('Impossible de charger votre entreprise. Vérifiez que le serveur est bien démarré.');
      }
    });
  }

  loadStats(companyId: string): void {
    this.companyService.getStats(companyId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });
  }

  loadActivities(companyId: string): void {
    this.companyService.getActivityLogs(companyId, 0, 5).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentActivities.set(res.data.content);
        }
      }
    });
  }
}

