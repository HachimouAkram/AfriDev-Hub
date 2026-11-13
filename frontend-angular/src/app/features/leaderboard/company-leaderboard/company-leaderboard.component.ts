import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, CompanyLeaderboardItem, CompanyLeaderboardResponse } from '../../../core/services/company.service';
import { LeaderboardService } from '../../../core/services/leaderboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyBadgeComponent } from '../../../shared/components/company-badge/company-badge.component';

@Component({
  selector: 'app-company-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompanyBadgeComponent],
  styleUrls: ['../leaderboard.component.css'],
  styles: [`
    .controls-filter-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
      width: 100%;
    }
    .sector-select {
      padding: 0.85rem 1.25rem;
      background: var(--bg-surface-card);
      border: 1.5px solid var(--border-subtle);
      border-radius: 14px;
      color: var(--text-heading);
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 190px;
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sector-select:focus {
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .badge-opportunities {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(16, 185, 129, 0.14);
      color: #10b981;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    @media (max-width: 768px) {
      .sector-select {
        width: 100%;
      }
    }
  `],
  template: `
    <div class="leaderboard-page">
      <!-- 1. Header Section (Identique au Classement des Développeurs) -->
      <header class="header-section app-card">
        <div class="header-text">
          <div style="display:inline-flex;gap:6px;background:rgba(30,41,59,0.7);padding:4px;border-radius:9999px;border:1px solid rgba(255,255,255,0.1);margin-bottom:0.75rem;">
            <a routerLink="/leaderboard" style="display:inline-flex;align-items:center;gap:6px;color:#94a3b8;font-size:0.8rem;font-weight:600;padding:6px 14px;text-decoration:none;border-radius:9999px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
              <span>Développeurs</span>
            </a>
            <span style="display:inline-flex;align-items:center;gap:6px;background:#10b981;color:#064e3b;font-weight:700;font-size:0.8rem;padding:6px 14px;border-radius:9999px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
              <span>Entreprises</span>
            </span>
          </div>
          <h1>Classement des Entreprises & Recruteurs Tech</h1>
          <p>
            Découvrez les entreprises les plus actives qui forment, recrutent et dynamisent l'écosystème numérique africain.
          </p>
        </div>

        <!-- Stats Pills -->
        <div class="stats-pills">
          <div class="stat-pill">
            <span class="stat-val">{{ totalCompanies() }}</span>
            <span class="stat-lbl">Entreprises classées</span>
          </div>
          <div class="stat-pill">
            <span class="stat-val">5 Paliers</span>
            <span class="stat-lbl">Startup à Élite Afrique</span>
          </div>
          <div class="stat-pill highlight">
            <span class="stat-val">100%</span>
            <span class="stat-lbl">Impact & Recrutement</span>
          </div>
        </div>
      </header>

      <!-- 2. Controls & Search Card (Identique au Classement Développeurs) -->
      <section class="controls-card app-card">
        <form (submit)="onSearch(); $event.preventDefault()" class="search-bar-form">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              name="query"
              placeholder="Rechercher une entreprise par nom, pays ou secteur..."
              class="search-input"
            />
            <button *ngIf="searchQuery" type="button" (click)="clearSearch()" class="clear-btn" aria-label="Effacer">
              ✕
            </button>
          </div>

          <select [(ngModel)]="selectedSector" name="sector" (change)="loadLeaderboard()" class="sector-select">
            <option value="">Tous les secteurs</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="EdTech">EdTech</option>
            <option value="E-commerce">E-commerce</option>
            <option value="AgriTech">AgriTech</option>
            <option value="SaaS">SaaS & Cloud</option>
          </select>

          <button type="submit" class="search-submit-btn" aria-label="Lancer la recherche">
            <svg class="search-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span>Rechercher</span>
          </button>
        </form>
      </section>

      <!-- Loading Skeleton -->
      <div class="sk-stack" style="width: 100%; margin: 1rem 0;" *ngIf="isLoading()" aria-busy="true" aria-label="Chargement du classement">
        <div class="sk-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="sk-card" *ngFor="let i of [1,2,3]">
            <div class="sk-meta-row">
              <div class="sk-avatar sk-avatar-round sk-shimmer"></div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
                <div class="sk-line sk-shimmer" style="width: 68%;"></div>
                <div class="sk-line-sm sk-shimmer" style="width: 45%;"></div>
              </div>
            </div>
            <div class="sk-line-lg sk-shimmer" style="width: 42%;"></div>
          </div>
        </div>
        <div class="sk-row" *ngFor="let r of [1,2,3,4,5]">
          <div class="sk-pill sk-shimmer" style="width: 36px;"></div>
          <div class="sk-avatar sk-avatar-round sk-shimmer"></div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
            <div class="sk-line sk-shimmer" style="width: 44%;"></div>
            <div class="sk-line-sm sk-shimmer" style="width: 30%;"></div>
          </div>
          <div class="sk-pill sk-shimmer" style="width: 80px;"></div>
        </div>
      </div>

      <!-- Error State -->
      <div class="alert alert-error" *ngIf="errorMessage() && !isLoading()">
        {{ errorMessage() }}
        <button (click)="loadLeaderboard()" class="btn btn-sm btn-outline">Réessayer</button>
      </div>

      <main class="leaderboard-main" *ngIf="!isLoading()">

        <!-- Realtime Sync Indicator -->
        <div class="cache-sync-indicator">
          <div class="cache-badge">
            <span class="pulse-indicator"></span>
            <span class="cache-label">
              ⚡ <strong>Classement Entreprises en direct</strong> • Données synchronisées
            </span>
          </div>
        </div>

        <!-- 3. Current User's Company Position Banner (If Logged In & Has Company) -->
        <section class="current-user-card" *ngIf="myCompany() as mc">
          <div class="cur-card-left">
            <div class="cur-avatar-wrap">
              <img *ngIf="mc.logoUrl" [src]="mc.logoUrl" [alt]="mc.name" class="cur-avatar" />
              <div *ngIf="!mc.logoUrl" class="cur-avatar-fallback">
                {{ getInitials(mc.name) }}
              </div>
            </div>
            <div class="cur-details">
              <div class="cur-meta-row">
                <span class="cur-tag">POSITION DE VOTRE ENTREPRISE</span>
                <span class="cur-country" *ngIf="mc.country">
                  <img *ngIf="getFlagUrl(mc.country)" [src]="getFlagUrl(mc.country)" class="inline-flag-img" [alt]="mc.country" />
                  <span>{{ mc.city ? mc.city + ', ' : '' }}{{ mc.country }}</span>
                </span>
              </div>
              <h2 class="cur-name">{{ mc.name }}</h2>
              <p class="cur-title">{{ mc.sector || 'Entreprise Tech & Recrutement' }}</p>
            </div>
          </div>

          <div class="cur-card-right">
            <div class="cur-rank-box">
              <span class="rank-label">Rang</span>
              <span class="rank-number">#{{ mc.rank }}</span>
            </div>
            <div class="cur-xp-box">
              <span class="xp-label">Total XP</span>
              <span class="xp-number">{{ mc.companyXp | number }} XP</span>
              <span class="level-pill" [style.color]="getLevelColor(mc.levelNumber, mc.companyLevel)">
                {{ mc.companyLevel || 'Startup' }}
              </span>
            </div>
          </div>
        </section>

        <!-- 4. Top 5 Podium Section -->
        <section class="podium-section" *ngIf="podium().length > 0">
          <div class="section-header">
            <h2 class="section-title">
              <svg class="section-title-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0H9.497m5.003 0A6.75 6.75 0 0018 7.5c0-1.875-.75-3.625-2.025-4.875A1.125 1.125 0 0015 2.25H9c-.435 0-.83.25-1.025.625A6.75 6.75 0 006 7.5c0 3.728 3.022 6.75 6.75 6.75h.75z" />
              </svg>
              Le Podium Panafricain des Entreprises (Top {{ podium().length }})
            </h2>
            <p class="section-desc">Les entreprises les plus engagées dans le recrutement, la formation et l'innovation en Afrique.</p>
          </div>

          <div class="podium-grid">
            <div *ngFor="let comp of podium()" class="podium-card"
              [class.podium-gold]="comp.rank === 1"
              [class.podium-silver]="comp.rank === 2"
              [class.podium-bronze]="comp.rank === 3"
              [class.is-current-user]="myCompany()?.id === comp.id">
              <div class="podium-rank-tag">
                <span *ngIf="comp.rank === 1">1er</span>
                <span *ngIf="comp.rank === 2">2e</span>
                <span *ngIf="comp.rank === 3">3e</span>
                <span *ngIf="comp.rank > 3">{{ comp.rank }}e</span>
              </div>

              <span *ngIf="myCompany()?.id === comp.id" class="you-badge">VOTRE ENTREPRISE</span>

              <div class="podium-avatar-wrapper">
                <img *ngIf="comp.logoUrl" [src]="comp.logoUrl" [alt]="comp.name" class="podium-avatar" />
                <div *ngIf="!comp.logoUrl" class="podium-avatar-fallback">
                  {{ getInitials(comp.name) }}
                </div>
                <div class="podium-flag-pill" *ngIf="getFlagUrl(comp.country)" [title]="comp.country">
                  <img [src]="getFlagUrl(comp.country)" [alt]="comp.country" class="podium-flag-img" />
                </div>
              </div>

              <h3 class="podium-name">
                <a [routerLink]="['/company', comp.slug]" class="name-link">
                  {{ comp.name }}
                </a>
              </h3>
              <p class="podium-title">{{ comp.sector || 'Tech & Innovation' }}</p>
              <div class="podium-country-tag" *ngIf="comp.country">
                <img *ngIf="getFlagUrl(comp.country)" [src]="getFlagUrl(comp.country)" class="mini-flag" [alt]="comp.country" />
                <span>{{ comp.city ? comp.city + ', ' : '' }}{{ comp.country }}</span>
              </div>

              <div class="podium-stats">
                <div class="podium-xp">
                  <span class="xp-val">{{ comp.companyXp | number }}</span>
                  <span class="xp-unit">XP</span>
                </div>
                <span class="podium-level-pill" [style.borderColor]="getLevelColor(comp.levelNumber, comp.companyLevel)">
                  {{ comp.companyLevel || 'Startup' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. Classement Complet des Entreprises -->
        <section class="neighborhood-section">
          <div class="neighborhood-divider">
            <span class="dots">••••••</span>
            <span class="divider-title">
              <span *ngIf="!searchQuery && !selectedSector">Classement Général des Entreprises</span>
              <span *ngIf="searchQuery || selectedSector">Résultats filtrés ({{ companies().length }})</span>
            </span>
            <span class="dots">••••••</span>
          </div>

          <div class="neighborhood-table-wrap" *ngIf="companies().length > 0; else emptyTpl">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th class="col-rank">Rang</th>
                  <th class="col-dev">Entreprise</th>
                  <th class="col-country">Localisation</th>
                  <th class="col-level">Palier</th>
                  <th>Offres actives</th>
                  <th class="col-xp">Points XP</th>
                  <th class="col-action">Fiche</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of companies()" class="table-row"
                  [class.highlight-row]="myCompany()?.id === row.id">
                  <td class="col-rank">
                    <span class="rank-circle" [ngClass]="getRankBadgeClass(row.rank)">
                      {{ row.rank }}
                    </span>
                  </td>
                  <td class="col-dev">
                    <div class="dev-cell">
                      <div class="dev-avatar-sm">
                        <img *ngIf="row.logoUrl" [src]="row.logoUrl" [alt]="row.name" />
                        <div *ngIf="!row.logoUrl" class="avatar-fallback-sm">
                          {{ getInitials(row.name) }}
                        </div>
                      </div>
                      <div class="dev-info-col">
                        <div class="dev-name-wrap">
                          <span class="dev-name">{{ row.name }}</span>
                          <span *ngIf="row.verified" title="Entreprise vérifiée">✅</span>
                          <span *ngIf="myCompany()?.id === row.id" class="badge-you">VOUS</span>
                        </div>
                        <span class="dev-title-sm">{{ row.sector || 'Tech & Recrutement' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-country">
                    <span class="country-pill" *ngIf="row.country || row.city">
                      <img *ngIf="getFlagUrl(row.country)" [src]="getFlagUrl(row.country)" class="inline-flag-img" [alt]="row.country" />
                      <span class="country-name">{{ row.city ? row.city + ', ' : '' }}{{ row.country }}</span>
                    </span>
                    <span *ngIf="!row.country && !row.city" style="color: var(--text-muted);">—</span>
                  </td>
                  <td class="col-level">
                    <app-company-badge [level]="row.companyLevel"></app-company-badge>
                  </td>
                  <td>
                    <span class="badge-opportunities" *ngIf="row.activeOpportunitiesCount > 0">
                      {{ row.activeOpportunitiesCount }} offre(s)
                    </span>
                    <span *ngIf="!row.activeOpportunitiesCount" style="color: var(--text-muted); font-size: 0.8rem;">—</span>
                  </td>
                  <td class="col-xp">
                    <span class="xp-amount">{{ row.companyXp | number }}</span>
                    <span class="xp-text">XP</span>
                  </td>
                  <td class="col-action">
                    <a [routerLink]="['/company', row.slug]" class="btn-profile-link">
                      Voir →
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #emptyTpl>
            <div class="neighborhood-table-wrap" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
              <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">Aucune entreprise trouvée avec ces critères.</p>
              <button *ngIf="searchQuery || selectedSector" (click)="clearSearch()" class="btn-profile-link" style="cursor: pointer; background: transparent;">
                Réinitialiser les filtres
              </button>
            </div>
          </ng-template>

          <!-- Guest CTA Banner -->
          <div class="guest-cta-banner" *ngIf="!authService.isLoggedIn()">
            <div class="cta-text">
              <h3>Vous recrutez des talents tech en Afrique ?</h3>
              <p>Créez votre compte Recruteur, publiez vos offres et gagnez des points XP pour hisser votre entreprise au sommet.</p>
            </div>
            <div class="cta-buttons">
              <a routerLink="/register" class="btn btn-primary">Inscrire mon Entreprise</a>
              <a routerLink="/login" class="btn btn-outline">Se Connecter</a>
            </div>
          </div>
        </section>

        <!-- 7. Engagement Guide (Spécifique aux Entreprises - sans barème chiffré) -->
        <section class="rules-guide-section">
          <div class="guide-header">
            <h3 class="guide-title">Comment évolue le statut d'une Entreprise ?</h3>
            <p class="guide-subtitle">La progression est évaluée automatiquement par la plateforme selon l'impact réel auprès des talents africains.</p>
          </div>

          <div class="rules-grid">
            <div class="rule-card">
              <div class="rule-icon icon-project">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="rule-info">
                <h4>Identité & Transparence</h4>
                <p>Présentez la fiche officielle, la mission et l'équipe de votre entreprise.</p>
              </div>
            </div>

            <div class="rule-card">
              <div class="rule-icon icon-job">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div class="rule-info">
                <h4>Opportunités Ouvertes</h4>
                <p>Proposez des emplois, stages et missions aux développeurs de la plateforme.</p>
              </div>
            </div>

            <div class="rule-card">
              <div class="rule-icon icon-eval">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div class="rule-info">
                <h4>Événements & Partage</h4>
                <p>Animez des événements tech et partagez des ressources avec la communauté.</p>
              </div>
            </div>

            <div class="rule-card">
              <div class="rule-icon icon-support">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div class="rule-info">
                <h4>Recrutements Confirmés</h4>
                <p>Intégrez des talents tech au sein de vos équipes via AfriDev Hub.</p>
              </div>
            </div>
          </div>

          <!-- Levels Recap -->
          <div class="levels-recap-bar">
            <div class="level-chip">
              <span class="lvl-label"><span class="lvl-dot lvl-junior"></span>Startup</span>
            </div>
            <div class="level-chip">
              <span class="lvl-label"><span class="lvl-dot lvl-senior"></span>Reconnue</span>
            </div>
            <div class="level-chip">
              <span class="lvl-label"><span class="lvl-dot lvl-expert"></span>Certifiée</span>
            </div>
            <div class="level-chip">
              <span class="lvl-label"><span class="lvl-dot lvl-tech"></span>Partenaire</span>
            </div>
            <div class="level-chip">
              <span class="lvl-label"><span class="lvl-dot lvl-leader"></span>Élite Afrique</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  `
})
export class CompanyLeaderboardComponent implements OnInit {
  private companyService = inject(CompanyService);
  private leaderboardService = inject(LeaderboardService);
  public authService = inject(AuthService);

  companies = signal<CompanyLeaderboardItem[]>([]);
  podium = signal<CompanyLeaderboardItem[]>([]);
  myCompany = signal<CompanyLeaderboardItem | null>(null);
  totalCompanies = signal<number>(0);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  searchQuery = '';
  selectedSector = '';

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  onSearch(): void {
    this.loadLeaderboard();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedSector = '';
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.companyService.getCompanyLeaderboard(
      0,
      50,
      undefined,
      this.selectedSector || undefined,
      this.searchQuery.trim() || undefined
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list = res.data.topCompanies ?? [];
          this.companies.set(list);
          this.myCompany.set(res.data.myCompany ?? null);
          this.totalCompanies.set(res.data.totalCompanies ?? list.length);
          if (!this.searchQuery && !this.selectedSector && list.length > 0) {
            this.podium.set(list.slice(0, 5));
          } else {
            this.podium.set([]);
          }
        } else {
          this.companies.set([]);
          this.podium.set([]);
          this.errorMessage.set('Impossible de charger le classement des entreprises.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.companies.set([]);
        this.podium.set([]);
        this.errorMessage.set('Erreur de connexion au serveur de classement.');
        this.isLoading.set(false);
      }
    });
  }

  getFlagUrl(country?: string): string | null {
    return this.leaderboardService.getCountryFlagUrl(country);
  }

  getInitials(name?: string): string {
    if (!name) return 'E';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  getLevelColor(levelNumber?: number, levelName?: string): string {
    const lvl = levelName?.toUpperCase() || '';
    if (levelNumber === 5 || lvl.includes('ELITE')) return '#f59e0b';
    if (levelNumber === 4 || lvl.includes('PARTENAIRE')) return '#f97316';
    if (levelNumber === 3 || lvl.includes('CERTIF')) return '#a855f7';
    if (levelNumber === 2 || lvl.includes('RECONNUE')) return '#3b82f6';
    return '#10b981';
  }

  getLevelBadge(levelNumber?: number, levelName?: string): string {
    const lvl = levelName?.toUpperCase() || '';
    if (levelNumber === 5 || lvl.includes('ELITE')) return '👑';
    if (levelNumber === 4 || lvl.includes('PARTENAIRE')) return '🤝';
    if (levelNumber === 3 || lvl.includes('CERTIF')) return '✅';
    if (levelNumber === 2 || lvl.includes('RECONNUE')) return '🏢';
    return '🌱';
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    if (rank <= 5) return 'rank-top5';
    return 'rank-standard';
  }
}
