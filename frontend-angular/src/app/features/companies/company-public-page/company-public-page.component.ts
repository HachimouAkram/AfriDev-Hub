import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompanyService, Company, CompanyLeaderboardItem } from '../../../core/services/company.service';
import { CompanyBadgeComponent } from '../../../shared/components/company-badge/company-badge.component';
import { OpportunityService, Opportunity } from '../../../core/services/opportunity.service';

@Component({
  selector: 'app-company-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CompanyBadgeComponent],
  template: `
    <div class="company-public-wrapper" *ngIf="company(); else loadingTpl">
      <!-- Cover Banner -->
      <div class="company-cover" [style.background-image]="company()?.coverUrl ? 'url(' + company()?.coverUrl + ')' : ''">
        <div class="cover-overlay"></div>
      </div>

      <!-- Main Profile Header Card -->
      <div class="company-header-container">
        <div class="header-card">
          <div class="logo-box">
            <img *ngIf="company()?.logoUrl; else letterLogo" [src]="company()?.logoUrl" [alt]="company()?.name" />
            <ng-template #letterLogo>
              <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8" style="width: 48px; height: 48px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </ng-template>
          </div>

          <div class="info-box">
            <div class="title-row">
              <h1 class="company-name">{{ company()?.name }}</h1>
              <app-company-badge [level]="company()?.companyLevel || 'STARTUP'" [xp]="company()?.companyXp" [showXp]="true"></app-company-badge>
              <span class="verified-tag" *ngIf="company()?.verified">Vérifiée AfriDev</span>
            </div>
            <p class="tagline" *ngIf="company()?.tagline">{{ company()?.tagline }}</p>
            <div class="meta-row">
              <span class="meta-inline" *ngIf="company()?.country || company()?.city">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {{ company()?.city }}{{ company()?.city && company()?.country ? ', ' : '' }}{{ company()?.country }}
              </span>
              <span class="meta-inline" *ngIf="company()?.sector">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
                {{ company()?.sector }}
              </span>
              <span class="meta-inline" *ngIf="company()?.companySize">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {{ company()?.companySize }} collaborateurs
              </span>
              <span class="meta-inline" *ngIf="company()?.foundedYear">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Fondée en {{ company()?.foundedYear }}
              </span>
              <span class="meta-inline" *ngIf="company()?.website">
                <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <a [href]="company()?.website" target="_blank" rel="noopener">{{ company()?.website }}</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Sections Grid -->
      <div class="company-content-grid">
        <!-- Left: About & Culture -->
        <div class="main-column">
          <div class="content-card" *ngIf="company()?.description">
            <h2>À propos de l'Entreprise</h2>
            <p class="description-text">{{ company()?.description }}</p>
          </div>

          <!-- Active Job Opportunities -->
          <div class="content-card">
            <div class="card-title-row">
              <h2>Offres d'emploi & missions actives</h2>
              <span class="count-pill">{{ company()?.activeOpportunitiesCount ?? 0 }}</span>
            </div>

            <div class="opportunities-list" *ngIf="opportunities().length > 0; else noOffersTpl">
              <div class="opt-item" *ngFor="let opt of opportunities()">
                <div class="opt-left">
                  <span class="badge" [ngClass]="'badge-' + opt.type.toLowerCase()">{{ opt.type }}</span>
                  <h3 class="opt-title">{{ opt.title }}</h3>
                  <div class="opt-meta">
                    <span>{{ opt.location }}</span>
                    <span *ngIf="opt.isRemote">• Télétravail</span>
                    <span *ngIf="opt.budget" class="opt-budget">• {{ opt.budget }}</span>
                  </div>
                </div>
                <a routerLink="/opportunities" [queryParams]="{ q: company()?.name }" class="btn btn-outline-primary">
                  Postuler →
                </a>
              </div>
            </div>

            <ng-template #noOffersTpl>
              <div class="empty-substate">
                <p>Aucune offre ouverte pour le moment chez {{ company()?.name }}.</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Right Sidebar: Stats & Level Info -->
        <div class="side-column">
          <div class="side-card">
            <h3>Niveau d'Entreprise</h3>
            <div class="level-display">
              <app-company-badge [level]="company()?.companyLevel || 'STARTUP'"></app-company-badge>
              <div class="xp-score">
                <strong>{{ company()?.companyXp ?? 0 }}</strong>
                <span>Points d'XP accumulés</span>
              </div>
            </div>
            <p class="level-explain">
              L'XP d'entreprise est gagnée par les recrutements réussis, les opportunités publiées et la contribution active à l'écosystème tech africain.
            </p>
          </div>

          <div class="side-card">
            <h3>Équipe de Recrutement</h3>
            <p class="side-muted">
              {{ company()?.membersCount ?? 1 }} recruteur(s) actif(s) sur AfriDev Hub pour cette entreprise.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="page-loading">
        <div class="spinner"></div>
        <p>Chargement du profil entreprise...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .company-public-wrapper {
      min-height: 100vh;
      background: var(--bg-dark, #0b1120);
      color: var(--text-primary, #f8fafc);
      padding-bottom: 4rem;
    }

    .company-cover {
      height: 240px;
      background: linear-gradient(135deg, #064e3b, #0f172a);
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .cover-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(11, 17, 32, 0.2), rgba(11, 17, 32, 0.95));
    }

    .company-header-container {
      max-width: 1200px;
      margin: -60px auto 2rem auto;
      padding: 0 1.5rem;
      position: relative;
      z-index: 2;
    }

    .header-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .logo-box {
      width: 110px;
      height: 110px;
      border-radius: 20px;
      background: #0f172a;
      border: 2px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }

    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .letter-placeholder {
      font-size: 3.5rem;
    }

    .info-box {
      flex: 1;
      min-width: 280px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .company-name {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
    }

    .verified-tag {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .tagline {
      font-size: 1.05rem;
      color: #cbd5e1;
      margin: 0.5rem 0 1rem 0;
    }

    .meta-row {
      display: flex;
      gap: 1.25rem;
      font-size: 0.85rem;
      color: #94a3b8;
      flex-wrap: wrap;
    }

    .meta-inline {
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

    .meta-row a {
      color: #10b981;
      text-decoration: none;
    }

    .company-content-grid {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 900px) {
      .company-content-grid {
        grid-template-columns: 1fr;
      }
    }

    .main-column, .side-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .content-card, .side-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .content-card h2, .side-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      color: #f8fafc;
    }

    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-title-row h2 {
      margin: 0;
    }

    .count-pill {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .description-text {
      line-height: 1.6;
      color: #cbd5e1;
      white-space: pre-line;
      margin: 0;
    }

    .opportunities-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .opt-item {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .opt-title {
      font-size: 1.05rem;
      margin: 0.5rem 0;
      color: #f8fafc;
    }

    .opt-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #94a3b8;
      flex-wrap: wrap;
    }

    .opt-budget {
      color: #10b981;
      font-weight: 600;
    }

    .badge {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 700;
    }

    .badge-job { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .badge-freelance { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .badge-collaboration { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-internship { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    .btn {
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-outline-primary {
      background: transparent;
      border: 1px solid #10b981;
      color: #10b981;
    }

    .btn-outline-primary:hover {
      background: #10b981;
      color: #064e3b;
    }

    .level-display {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
    }

    .xp-score strong {
      display: block;
      font-size: 1.4rem;
      color: #10b981;
    }

    .xp-score span {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .level-explain {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
      margin: 0;
    }

    .side-muted {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
    }

    .page-loading, .empty-substate {
      text-align: center;
      padding: 2.5rem 1rem;
      color: #94a3b8;
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
export class CompanyPublicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);
  private opportunityService = inject(OpportunityService);

  company = signal<Company | null>(null);
  opportunities = signal<Opportunity[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadCompany(slug);
      }
    });
  }

  loadCompany(slug: string): void {
    this.companyService.getCompanyBySlug(slug).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.loadCompanyOpportunities(res.data.name);
        }
      }
    });
  }

  loadCompanyOpportunities(companyName: string): void {
    this.opportunityService.getOpportunities(undefined, 0, 10).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list = res.data.content || res.data;
          this.opportunities.set(Array.isArray(list) ? list.filter((o: Opportunity) => o.companyName === companyName) : []);
        }
      }
    });
  }
}

