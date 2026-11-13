import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompanyService, Company, CompanyStats, CompanyActivityLog } from '../../../core/services/company.service';
import { resolveUploadedMediaUrl } from '../../../core/utils/upload-helper';
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
            <img *ngIf="company()?.logoUrl; else placeholderLogo" [src]="resolveUrl(company()?.logoUrl)" [alt]="company()?.name" />
            <ng-template #placeholderLogo>
              <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </ng-template>
          </div>
          <div class="company-hero-info">
            <div class="title-row">
              <h1 class="company-name">{{ company()?.name }}</h1>
              <app-company-badge [level]="company()?.companyLevel || 'STARTUP'" [xp]="company()?.companyXp" [showXp]="true"></app-company-badge>
              <span *ngIf="company()?.verified" class="verified-pill">
                <svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Vérifiée
              </span>
            </div>
            <p class="tagline" *ngIf="company()?.tagline">{{ company()?.tagline }}</p>
            <div class="company-meta">
              <span class="meta-item" *ngIf="company()?.city || company()?.country">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {{ company()?.city }}{{ company()?.city && company()?.country ? ', ' : '' }}{{ company()?.country }}
              </span>
              <span class="meta-item" *ngIf="company()?.sector">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                {{ company()?.sector }}
              </span>
              <span class="meta-item" *ngIf="company()?.website">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <a [href]="company()?.website" target="_blank" rel="noopener">{{ company()?.website }}</a>
              </span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <a [routerLink]="['/company', company()?.slug]" class="btn btn-outline-white" target="_blank">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Fiche publique</span>
          </a>
          <a routerLink="/dashboard/recruiter/profile" class="btn btn-primary-glass">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>Modifier l'entreprise</span>
          </a>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V4.5a2.25 2.25 0 00-2.25-2.25h-3a2.25 2.25 0 00-2.25 2.25v1.644m6 0a47.4 47.4 0 01-6 0" />
            </svg>
          </div>
          <div class="metric-data">
            <span class="metric-value">{{ stats()?.totalOpportunities ?? 0 }}</span>
            <span class="metric-label">Offres publiées</span>
            <span class="metric-sub">{{ stats()?.activeOpportunities ?? 0 }} en cours</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div class="metric-data">
            <span class="metric-value">{{ stats()?.totalApplications ?? 0 }}</span>
            <span class="metric-label">Candidatures reçues</span>
            <span class="metric-sub highlight">{{ stats()?.pendingApplications ?? 0 }} en attente</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0H9.497m5.003 0A6.75 6.75 0 0018 7.5c0-1.875-.75-3.625-2.025-4.875A1.125 1.125 0 0015 2.25H9c-.435 0-.83.25-1.025.625A6.75 6.75 0 006 7.5c0 3.728 3.022 6.75 6.75 6.75h.75z" />
            </svg>
          </div>
          <div class="metric-data">
            <span class="metric-value">{{ company()?.companyXp ?? 0 }}</span>
            <span class="metric-label">Points d'XP Entreprise</span>
            <span class="metric-sub">{{ stats()?.acceptedApplications ?? 0 }} talents recrutés</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
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
            <div class="quick-icon-box icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div class="quick-text">
              <span class="quick-title">Publier une offre</span>
              <span class="quick-desc">Emploi, stage ou mission</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/events" class="quick-btn">
            <div class="quick-icon-box icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div class="quick-text">
              <span class="quick-title">Organiser un événement tech</span>
              <span class="quick-desc">Webinaire, hackathon, meetup</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/resources" class="quick-btn">
            <div class="quick-icon-box icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div class="quick-text">
              <span class="quick-title">Partager une formation</span>
              <span class="quick-desc">Tutoriel, cours ou ressource</span>
            </div>
          </a>
          <a routerLink="/dashboard/recruiter/team" class="quick-btn">
            <div class="quick-icon-box icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
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
      <div class="recruiter-overview" *ngIf="!errorMessage(); else errorTpl">
        <!-- Skeleton Hero -->
        <div class="company-hero-card sk-shimmer" style="height: 140px;"></div>
        <!-- Skeleton Metrics -->
        <div class="metrics-grid">
          <div class="metric-card sk-shimmer" *ngFor="let i of [1,2,3,4]" style="height: 100px;"></div>
        </div>
        <!-- Skeleton Quick Actions -->
        <div class="quick-actions-bar sk-shimmer" style="height: 120px;"></div>
        <!-- Skeleton Activities -->
        <div class="recent-activities-card sk-shimmer" style="height: 160px;"></div>
      </div>
      <ng-template #errorTpl>
        <div class="loading-state" style="color: #ef4444;">
          <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">{{ errorMessage() }}</p>
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
      width: 76px;
      height: 76px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      color: #10b981;
    }

    .company-logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-svg {
      width: 36px;
      height: 36px;
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
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 2px 9px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .inline-svg {
      width: 13px;
      height: 13px;
    }

    .tagline {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.95rem;
      margin: 0.25rem 0 0.5rem 0;
    }

    .company-meta {
      display: flex;
      gap: 1.15rem;
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
      flex-wrap: wrap;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .meta-svg {
      width: 15px;
      height: 15px;
      color: #10b981;
      flex-shrink: 0;
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
      gap: 7px;
    }

    .btn-svg {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
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
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .metric-icon svg {
      width: 24px;
      height: 24px;
    }

    .metric-purple { background: rgba(168, 85, 247, 0.14); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); }
    .metric-emerald { background: rgba(16, 185, 129, 0.14); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
    .metric-amber { background: rgba(245, 158, 11, 0.14); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }
    .metric-blue { background: rgba(59, 130, 246, 0.14); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); }

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
      gap: 0.85rem;
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

    .quick-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .quick-icon-box svg {
      width: 20px;
      height: 20px;
    }

    .icon-emerald { background: rgba(16, 185, 129, 0.14); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
    .icon-blue { background: rgba(59, 130, 246, 0.14); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); }
    .icon-purple { background: rgba(168, 85, 247, 0.14); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); }
    .icon-amber { background: rgba(245, 158, 11, 0.14); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }

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

    /* Skeletons */
    .sk-shimmer {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.04) 75%);
      background-size: 200% 100%;
      animation: skShimmer 1.5s infinite;
      border-radius: 16px;
    }
    :host-context(body.light-theme) .sk-shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
    }
    @keyframes skShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Light Theme Contrast Enhancements */
    :host-context(body.light-theme) .metric-card,
    :host-context(body.light-theme) .quick-actions-bar,
    :host-context(body.light-theme) .recent-activities-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
    }
    :host-context(body.light-theme) .company-hero-card {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2));
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    :host-context(body.light-theme) .company-title h1,
    :host-context(body.light-theme) .metric-value,
    :host-context(body.light-theme) .quick-actions-bar h3,
    :host-context(body.light-theme) .header-title h3,
    :host-context(body.light-theme) .quick-title {
      color: #0f172a;
    }
    :host-context(body.light-theme) .tagline {
      color: #475569;
    }
    :host-context(body.light-theme) .metric-label,
    :host-context(body.light-theme) .metric-sub,
    :host-context(body.light-theme) .header-title p,
    :host-context(body.light-theme) .act-time {
      color: #64748b;
    }
    :host-context(body.light-theme) .quick-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    :host-context(body.light-theme) .quick-btn:hover {
      background: #f1f5f9;
      border-color: #10b981;
    }
    :host-context(body.light-theme) .activity-row {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    :host-context(body.light-theme) .act-main {
      color: #1e293b;
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

  resolveUrl(url?: string | null): string {
    return resolveUploadedMediaUrl(url);
  }

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.loadStats(res.data.id);
          this.loadActivities(res.data.id);
        } else {
          this.errorMessage.set('Aucune entreprise associée. Créez votre fiche entreprise.');
        }
      },
      error: (err) => {
        const msg = err?.error?.error?.message || err?.message || '';
        if (err?.status === 404 || msg.toLowerCase().includes('entreprise')) {
          this.errorMessage.set('Aucune entreprise associée. Créez votre fiche entreprise.');
        } else {
          this.errorMessage.set('Impossible de charger votre entreprise. Vérifiez que le serveur est bien démarré.');
        }
        console.error('Erreur chargement entreprise:', err);
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
