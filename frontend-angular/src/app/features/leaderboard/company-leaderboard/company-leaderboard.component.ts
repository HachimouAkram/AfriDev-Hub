import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, CompanyLeaderboardItem } from '../../../core/services/company.service';
import { CompanyBadgeComponent } from '../../../shared/components/company-badge/company-badge.component';

@Component({
  selector: 'app-company-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompanyBadgeComponent],
  template: `
    <div class="leaderboard-page-wrapper">
      <!-- Hero Header -->
      <div class="leaderboard-header">
        <div class="header-content">
          <div class="badge-tag">🏆 CLASSEMENT OFFICIEL AFRIQUE</div>
          <h1 class="page-title">Top Entreprises & Recruteurs Tech</h1>
          <p class="page-subtitle">
            Découvrez les entreprises les plus actives qui forment, recrutent et dynamisent l'écosystème numérique africain.
          </p>

          <!-- Tab Switcher between Developers and Companies -->
          <div class="tab-switcher">
            <a routerLink="/leaderboard" class="tab-btn">
              👨‍💻 Classement Développeurs
            </a>
            <a routerLink="/leaderboard/companies" class="tab-btn active">
              🏢 Classement Entreprises
            </a>
          </div>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="filters-container">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher une entreprise, pays, secteur..."
            class="search-input"
          />
        </div>

        <div class="select-group">
          <select [(ngModel)]="selectedSector" (change)="loadLeaderboard()" class="filter-select">
            <option value="">Tous les secteurs</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="EdTech">EdTech</option>
            <option value="E-commerce">E-commerce</option>
            <option value="AgriTech">AgriTech</option>
            <option value="SaaS">SaaS & Cloud</option>
          </select>
        </div>
      </div>

      <!-- Podium Top 3 -->
      <div class="podium-section" *ngIf="podium().length >= 3 && !isLoading()">
        <!-- 2ème Place -->
        <div class="podium-card rank-2" *ngIf="podium()[1] as second">
          <div class="medal-circle">🥈 2e</div>
          <div class="company-logo-circle">
            <img *ngIf="second.logoUrl; else l2" [src]="second.logoUrl" [alt]="second.name" />
            <ng-template #l2>🏢</ng-template>
          </div>
          <h3 class="podium-name">
            <a [routerLink]="['/company', second.slug]">{{ second.name }}</a>
          </h3>
          <app-company-badge [level]="second.companyLevel"></app-company-badge>
          <div class="podium-xp">{{ second.companyXp }} XP</div>
          <span class="podium-loc" *ngIf="second.country">📍 {{ second.country }}</span>
        </div>

        <!-- 1ère Place -->
        <div class="podium-card rank-1" *ngIf="podium()[0] as first">
          <div class="crown-icon">👑</div>
          <div class="medal-circle gold">🥇 1er</div>
          <div class="company-logo-circle large">
            <img *ngIf="first.logoUrl; else l1" [src]="first.logoUrl" [alt]="first.name" />
            <ng-template #l1>🏢</ng-template>
          </div>
          <h3 class="podium-name">
            <a [routerLink]="['/company', first.slug]">{{ first.name }}</a>
          </h3>
          <app-company-badge [level]="first.companyLevel"></app-company-badge>
          <div class="podium-xp highlight">{{ first.companyXp }} XP</div>
          <span class="podium-loc" *ngIf="first.country">📍 {{ first.country }}</span>
        </div>

        <!-- 3ème Place -->
        <div class="podium-card rank-3" *ngIf="podium()[2] as third">
          <div class="medal-circle">🥉 3e</div>
          <div class="company-logo-circle">
            <img *ngIf="third.logoUrl; else l3" [src]="third.logoUrl" [alt]="third.name" />
            <ng-template #l3>🏢</ng-template>
          </div>
          <h3 class="podium-name">
            <a [routerLink]="['/company', third.slug]">{{ third.name }}</a>
          </h3>
          <app-company-badge [level]="third.companyLevel"></app-company-badge>
          <div class="podium-xp">{{ third.companyXp }} XP</div>
          <span class="podium-loc" *ngIf="third.country">📍 {{ third.country }}</span>
        </div>
      </div>

      <!-- Full Table List -->
      <div class="table-card">
        <div class="table-responsive" *ngIf="!isLoading(); else loadingTpl">
          <table class="leaderboard-table" *ngIf="companies().length > 0; else emptyTpl">
            <thead>
              <tr>
                <th style="width: 70px;">Rang</th>
                <th>Entreprise</th>
                <th>Niveau</th>
                <th>Localisation</th>
                <th>Offres actives</th>
                <th style="text-align: right;">Points XP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of companies()" [class.top-tier]="item.rank <= 3">
                <td class="rank-cell">
                  <span class="rank-number" [ngClass]="'rank-' + item.rank">
                    {{ item.rank }}
                  </span>
                </td>
                <td class="company-cell">
                  <a [routerLink]="['/company', item.slug]" class="company-link">
                    <div class="comp-avatar">
                      <img *ngIf="item.logoUrl; else compAvatarLet" [src]="item.logoUrl" [alt]="item.name" />
                      <ng-template #compAvatarLet>🏢</ng-template>
                    </div>
                    <div class="comp-text">
                      <span class="comp-title">{{ item.name }}</span>
                      <span class="comp-sector" *ngIf="item.sector">{{ item.sector }}</span>
                    </div>
                  </a>
                </td>
                <td>
                  <app-company-badge [level]="item.companyLevel"></app-company-badge>
                </td>
                <td class="loc-cell">
                  <span *ngIf="item.city || item.country">
                    {{ item.city }}{{ item.city && item.country ? ', ' : '' }}{{ item.country }}
                  </span>
                  <span *ngIf="!item.city && !item.country" class="text-muted">—</span>
                </td>
                <td>
                  <span class="badge-opportunities" *ngIf="item.activeOpportunitiesCount > 0">
                    {{ item.activeOpportunitiesCount }} opportunité(s)
                  </span>
                  <span class="text-muted" *ngIf="!item.activeOpportunitiesCount">—</span>
                </td>
                <td class="xp-cell">
                  <strong>{{ item.companyXp }}</strong> XP
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyTpl>
            <div class="empty-state">
              <p>Aucune entreprise trouvée avec ces critères.</p>
            </div>
          </ng-template>
        </div>

        <ng-template #loadingTpl>
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement du classement...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-page-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem 1.5rem;
      color: var(--text-primary, #f8fafc);
    }

    .leaderboard-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .badge-tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      font-weight: 700;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .page-title {
      font-size: 2.4rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-subtitle {
      color: #94a3b8;
      font-size: 1.05rem;
      max-width: 650px;
      margin: 0 auto 1.5rem auto;
    }

    .tab-switcher {
      display: inline-flex;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      padding: 4px;
      gap: 4px;
    }

    .tab-btn {
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: #10b981;
      color: #064e3b;
      font-weight: 700;
    }

    /* Filters */
    .filters-container {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 260px;
    }

    .search-input, .filter-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      font-size: 0.9rem;
      outline: none;
      box-sizing: border-box;
    }

    .search-input:focus, .filter-select:focus {
      border-color: #10b981;
    }

    /* Podium */
    .podium-section {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1fr;
      align-items: flex-end;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    @media (max-width: 768px) {
      .podium-section {
        grid-template-columns: 1fr;
      }
    }

    .podium-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 2rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .podium-card.rank-1 {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.9));
      border-color: rgba(245, 158, 11, 0.4);
      padding-top: 2.5rem;
      transform: translateY(-10px);
    }

    .crown-icon {
      position: absolute;
      top: -24px;
      font-size: 2.2rem;
    }

    .medal-circle {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
      margin-bottom: 1rem;
    }

    .medal-circle.gold {
      background: rgba(245, 158, 11, 0.25);
      color: #f59e0b;
    }

    .company-logo-circle {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .company-logo-circle.large {
      width: 90px;
      height: 90px;
      border-color: #f59e0b;
    }

    .company-logo-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .podium-name a {
      color: #f8fafc;
      text-decoration: none;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .podium-xp {
      font-size: 1.3rem;
      font-weight: 800;
      color: #94a3b8;
      margin: 0.75rem 0 0.25rem 0;
    }

    .podium-xp.highlight {
      color: #10b981;
      font-size: 1.5rem;
    }

    .podium-loc {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Table */
    .table-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .leaderboard-table th {
      padding: 1rem 1.25rem;
      background: rgba(15, 23, 42, 0.6);
      color: #94a3b8;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .leaderboard-table td {
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    .leaderboard-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .rank-cell {
      font-weight: 700;
    }

    .rank-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
    }

    .rank-number.rank-1 { background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-weight: 800; }
    .rank-number.rank-2 { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
    .rank-number.rank-3 { background: rgba(180, 83, 9, 0.2); color: #d97706; }

    .company-cell {
      min-width: 200px;
    }

    .company-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }

    .comp-avatar {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .comp-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .comp-text {
      display: flex;
      flex-direction: column;
    }

    .comp-title {
      font-weight: 700;
      color: #f8fafc;
    }

    .comp-sector {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .badge-opportunities {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .xp-cell {
      text-align: right;
      color: #94a3b8;
    }

    .xp-cell strong {
      color: #10b981;
      font-size: 1.05rem;
    }

    .text-muted {
      color: #64748b;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
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
export class CompanyLeaderboardComponent implements OnInit {
  private companyService = inject(CompanyService);

  companies = signal<CompanyLeaderboardItem[]>([]);
  podium = signal<CompanyLeaderboardItem[]>([]);
  isLoading = signal<boolean>(true);

  searchQuery = '';
  selectedSector = '';

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  onSearchChange(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading.set(true);
    this.companyService.getCompanyLeaderboard(0, 50, undefined, this.selectedSector || undefined, this.searchQuery.trim() || undefined).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companies.set(res.data.items);
          if (!this.searchQuery && !this.selectedSector && res.data.items.length >= 3) {
            this.podium.set(res.data.items.slice(0, 3));
          } else {
            this.podium.set([]);
          }
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

