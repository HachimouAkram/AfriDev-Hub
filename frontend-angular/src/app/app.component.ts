import { Component, inject, HostListener, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { TranslationService, Language } from './core/services/translation.service';
import { OfflineSyncService } from './core/services/offline-sync.service';
import { GlobalSearchService, GlobalSearchResults } from './core/services/global-search.service';
import { AiAssistantComponent } from './shared/components/ai-assistant/ai-assistant.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, AiAssistantComponent],
  template: `
    <nav class="app-nav" [class.nav-scrolled]="isScrolled" [class.nav-light]="!isDark()" *ngIf="!hideNavAndFooter()">
      <div class="nav-content">
        <!-- Logo Left -->
        <a routerLink="/" (click)="closeAllMenus()" class="logo">
          <img src="/logo-africa.png" alt="AfriDev Hub Logo" class="logo-img" />
          <div class="logo-text-wrapper">
            <span class="logo-text">AfriDev <span class="accent">Hub</span></span>
            <span class="logo-subtitle">Connexion Développeurs Africains</span>
          </div>
        </a>

        <!-- Desktop Top Omnisearch Bar -->
        <div role="search" class="omnisearch-wrapper desktop-search-slot" (click)="$event.stopPropagation()">
          <div class="omnisearch-box">
            <svg class="omnisearch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="search"
              name="globalSearch"
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange($event)" 
              (focus)="onSearchFocus()" 
              (keydown.enter)="goToAllResults()"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              enterkeyhint="search"
              placeholder="Rechercher projet, personne, techno, pays... (ex: React, Hachim, Algérie)" 
              class="omnisearch-input"
              aria-label="Recherche globale AfriDev Hub" />
            <button type="button" *ngIf="searchQuery" (click)="clearSearch($event)" class="omnisearch-clear" title="Effacer" aria-label="Effacer la recherche">✕</button>
          </div>

          <!-- Instant Live Suggestion Dropdown -->
          <div class="omnisearch-dropdown" *ngIf="isSearchOpen && searchQuery.trim().length > 0">
            <div *ngIf="isSearching" class="search-loading-row">
              <span>Recherche intelligente en cours...</span>
            </div>

            <ng-container *ngIf="searchResults && !isSearching">
              <div *ngIf="searchResults.suggestedCorrection" class="search-ai-hint">
                <span>✨ Suggestion IA : vouliez-vous chercher</span>
                <button (click)="applySuggestedTerm(searchResults.suggestedCorrection!)" class="search-ai-hint-btn">
                  « {{ searchResults.suggestedCorrection }} »
                </button>
              </div>

              <div *ngIf="searchResults.totalMatches === 0" class="search-empty-row">
                Aucun résultat exact pour « <strong>{{ searchQuery }}</strong> ». Essayez React, E-Commerce, Hachim, Sénégal...
              </div>

              <!-- Technologies / Tags -->
              <div *ngIf="searchResults.technologies.length > 0" class="search-section">
                <div class="search-section-label">Technologies & Compétences</div>
                <div class="search-tech-chips">
                  <button *ngFor="let tech of searchResults.technologies" (click)="goToTech(tech)" class="search-tech-chip">
                    <span class="tech-hash">#</span> {{ tech }}
                  </button>
                </div>
              </div>

              <!-- Projets -->
              <div *ngIf="searchResults.projects.length > 0" class="search-section">
                <div class="search-section-label">Projets & Réalisations</div>
                <button *ngFor="let p of searchResults.projects" (click)="goToProject(p.id)" class="search-result-item">
                  <div class="res-avatar proj-av">{{ p.title.charAt(0).toUpperCase() }}</div>
                  <div class="res-info">
                    <div class="res-title">{{ p.title }}</div>
                    <div class="res-sub">{{ p.authorName }} <span *ngIf="p.country">• {{ p.country }}</span> • {{ p.stack.join(', ') }}</div>
                  </div>
                  <span class="res-type-badge">{{ p.category }}</span>
                </button>
              </div>

              <!-- Développeurs & Profils -->
              <div *ngIf="searchResults.developers.length > 0" class="search-section">
                <div class="search-section-label">Développeurs & Talents</div>
                <button *ngFor="let dev of searchResults.developers" (click)="goToProfile(dev.id)" class="search-result-item">
                  <div class="res-avatar dev-av">{{ dev.fullName.charAt(0).toUpperCase() }}</div>
                  <div class="res-info">
                    <div class="res-title">{{ dev.fullName }}</div>
                    <div class="res-sub">{{ dev.title }} <span *ngIf="dev.country">• {{ dev.country }}</span></div>
                  </div>
                  <span class="res-type-badge badge-dev">Profil</span>
                </button>
              </div>

              <!-- Événements & Hackathons -->
              <div *ngIf="searchResults.events.length > 0" class="search-section">
                <div class="search-section-label">Événements & Hackathons</div>
                <button *ngFor="let ev of searchResults.events" (click)="goToEvents(ev.title)" class="search-result-item">
                  <div class="res-avatar ev-av">📅</div>
                  <div class="res-info">
                    <div class="res-title">{{ ev.title }}</div>
                    <div class="res-sub">{{ ev.location }} • {{ ev.type }}</div>
                  </div>
                  <span class="res-type-badge">Événement</span>
                </button>
              </div>

              <!-- Opportunités -->
              <div *ngIf="searchResults.opportunities.length > 0" class="search-section">
                <div class="search-section-label">Opportunités & Offres</div>
                <button *ngFor="let opp of searchResults.opportunities" (click)="goToOpportunities(opp.title)" class="search-result-item">
                  <div class="res-avatar opp-av">💼</div>
                  <div class="res-info">
                    <div class="res-title">{{ opp.title }}</div>
                    <div class="res-sub">{{ opp.location }} • {{ opp.type }}</div>
                  </div>
                </button>
              </div>

              <!-- Raccourcis d'exploration globale -->
              <div class="search-quick-hub">
                <button (click)="goToAllResults()" class="search-explore-all">
                  Projets « {{ searchResults.suggestedCorrection || searchQuery }} » →
                </button>
                <div class="search-hub-links">
                  <button (click)="goToEvents(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">📅 Événements</button>
                  <button (click)="goToNetwork(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">👥 Développeurs</button>
                  <button (click)="goToOpportunities(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">💼 Opportunités</button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Desktop Right Actions (Language Switcher, Theme Switcher, Auth & Profile) -->
        <div class="nav-right-actions desktop-only">
          <!-- Language Selector Dropdown with Voice Audio -->
          <div class="lang-dropdown-container notranslate" translate="no">
            <button (click)="toggleLangMenu($event)" class="lang-toggle-btn notranslate" translate="no" title="Changer de langue / Wàllu làkk">
              <span class="lang-code notranslate" translate="no">{{ currentLang().code.toUpperCase() }}</span>
              <svg class="chevron-svg" [class.rotated]="isLangMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <!-- Language Dropdown Menu -->
            <div class="lang-dropdown-card notranslate" translate="no" *ngIf="isLangMenuOpen" (click)="$event.stopPropagation()">
              <div class="lang-menu-header notranslate" translate="no">
                <span>Choisir une langue</span>
              </div>
              <div class="lang-menu-list notranslate" translate="no">
                <div *ngFor="let lang of availableLanguages" 
                     class="lang-menu-item notranslate" 
                     translate="no"
                     [class.selected]="lang.code === currentLang().code"
                     (click)="selectLanguage(lang, $event)">
                  <div class="lang-item-left notranslate" translate="no">
                    <span class="lang-code-pill notranslate" translate="no">{{ lang.code.toUpperCase() }}</span>
                    <span class="lang-name notranslate" translate="no">{{ lang.label }}</span>
                  </div>
                  <button type="button" 
                          class="voice-btn notranslate" 
                          translate="no"
                          (click)="speakVoice(lang, $event)" 
                          [title]="'Écouter en ' + lang.label">
                    <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Theme Switcher Desktop Button -->
          <button (click)="toggleTheme()" class="theme-toggle-btn icon-only" [title]="isDark() ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'" aria-label="Changer le thème">
            <svg *ngIf="isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.364 6.364l-1.591-1.591M6.759 6.759L5.168 5.168m12.728 0l-1.591 1.591M6.759 17.241l-1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
            </svg>
            <svg *ngIf="!isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </button>

          <!-- Logged out Buttons -->
          <a *ngIf="!isLoggedIn()" routerLink="/login" routerLinkActive="active" class="nav-link nav-login-link notranslate" translate="no">{{ t('nav.login') }}</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" class="btn btn-emerald btn-sm nav-register-btn notranslate" translate="no">{{ t('nav.register') }}</a>

          <!-- Logged in Profile Menu Dropdown -->
          <div *ngIf="isLoggedIn()" class="profile-dropdown-container">
            <button (click)="toggleProfileMenu($event)" class="avatar-menu-btn" title="Menu Mon Compte">
              <span class="avatar-circle">
                {{ getUserInitial() }}
              </span>
              <svg class="chevron-svg" [class.rotated]="isProfileMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <!-- Profile Dropdown Popup Card -->
            <div class="profile-dropdown-card" *ngIf="isProfileMenuOpen" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <div class="dropdown-user-avatar">
                  {{ getUserInitial() }}
                </div>
                <div class="dropdown-user-info">
                  <span class="user-name">{{ getUserFullName() }}</span>
                  <span class="user-role">{{ getUserTitle() }}</span>
                  <div class="dropdown-gamification-row" *ngIf="getUserXp() !== null">
                    <span class="dropdown-level-tag">{{ getUserLevelBadge() }} {{ getUserLevelTitle() }}</span>
                    <span class="dropdown-xp-pill">{{ getUserXp() }} XP</span>
                  </div>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <div class="dropdown-menu-list">
                <a routerLink="/dashboard/profile" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span>Mon Profil</span>
                </a>

                <a routerLink="/leaderboard" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item highlight-leaderboard-link">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0V5.625c0-.621-.504-1.125-1.125-1.125H9.625c-.621 0-1.125.504-1.125 1.125v8.625m5.004 0H9.625" />
                  </svg>
                  <span>Classement</span>
                </a>

                <a routerLink="/messages" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.743-.598l.147-1.44a5.962 5.962 0 01-1.814-4.432C3 10.444 7.03 6.75 12 6.75s9 3.694 9 8.25z" />
                  </svg>
                  <span>Messagerie</span>
                </a>

                <a routerLink="/dashboard" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  <span>Tableau de bord</span>
                </a>

                <a *ngIf="isAdmin()" routerLink="/admin" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>Administration</span>
                </a>
              </div>

              <div class="dropdown-divider"></div>

              <button (click)="logout()" class="dropdown-item logout-item">
                <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                </svg>
                <span>Se Déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Controls (Language + Theme Toggle + Hamburger Toggle) -->
        <div class="mobile-controls mobile-only">
          <div class="lang-dropdown-container mobile-lang-dropdown notranslate" translate="no">
            <button type="button" (click)="toggleLangMenu($event)" class="lang-toggle-btn mobile-lang-btn notranslate" translate="no" aria-label="Changer de langue" title="Changer de langue / Wàllu làkk">
              <span class="lang-code notranslate" translate="no">{{ currentLang().code.toUpperCase() }}</span>
              <svg class="chevron-svg" [class.rotated]="isLangMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <div class="lang-dropdown-card mobile-lang-card notranslate" translate="no" *ngIf="isLangMenuOpen" (click)="$event.stopPropagation()">
              <div class="lang-menu-header notranslate" translate="no">
                <span>Choisir une langue</span>
              </div>
              <div class="lang-menu-list notranslate" translate="no">
                <div *ngFor="let lang of availableLanguages"
                     class="lang-menu-item notranslate"
                     translate="no"
                     [class.selected]="lang.code === currentLang().code"
                     (click)="selectLanguage(lang, $event)">
                  <div class="lang-item-left notranslate" translate="no">
                    <span class="lang-code-pill notranslate" translate="no">{{ lang.code.toUpperCase() }}</span>
                    <span class="lang-name notranslate" translate="no">{{ lang.label }}</span>
                  </div>
                  <button type="button"
                          class="voice-btn notranslate"
                          translate="no"
                          (click)="speakVoice(lang, $event)"
                          [title]="'Écouter en ' + lang.label">
                    <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button type="button" (click)="toggleTheme()" class="theme-toggle-btn icon-only" [title]="isDark() ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'" aria-label="Changer le thème">
            <svg *ngIf="isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.364 6.364l-1.591-1.591M6.759 6.759L5.168 5.168m12.728 0l-1.591 1.591M6.759 17.241l-1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
            </svg>
            <svg *ngIf="!isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </button>

          <button (click)="toggleMobileMenu()" class="mobile-toggle-btn" aria-label="Menu">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path *ngIf="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              <path *ngIf="isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Desktop Sub-Navbar Row (Lowered neatly under the Search Bar) -->
      <div class="nav-sub-row desktop-only notranslate" translate="no" *ngIf="!isDashboardPage()">
        <div class="nav-center-pill notranslate" translate="no">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link notranslate" translate="no">{{ t('nav.home') }}</a>
          <a routerLink="/projects" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link notranslate" translate="no">{{ t('nav.projects') }}</a>
          <a routerLink="/opportunities" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.opportunities') }}</a>
          <a routerLink="/network" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.network') }}</a>
          <a routerLink="/events" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.events') }}</a>
          <a routerLink="/communautes" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.communities') }}</a>
          <a routerLink="/resources" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.resources') }}</a>
          <a routerLink="/leaderboard" routerLinkActive="active" class="nav-link notranslate" translate="no">{{ t('nav.leaderboard') }}</a>
        </div>
      </div>

      <!-- Mobile Sticky Omnisearch Strip -->
      <div class="mobile-search-strip mobile-only" (click)="$event.stopPropagation()">
        <div role="search" class="omnisearch-wrapper">
          <div class="omnisearch-box">
            <svg class="omnisearch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="search"
              name="mobileGlobalSearch"
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange($event)" 
              (focus)="onSearchFocus()" 
              (keydown.enter)="goToAllResults()"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              enterkeyhint="search"
              placeholder="Rechercher projet, personne, techno, pays..." 
              class="omnisearch-input"
              aria-label="Recherche globale mobile AfriDev Hub" />
            <button type="button" *ngIf="searchQuery" (click)="clearSearch($event)" class="omnisearch-clear" aria-label="Effacer la recherche">✕</button>
          </div>

          <div class="omnisearch-dropdown mobile-dropdown" *ngIf="isSearchOpen && searchQuery.trim().length > 0">
            <div *ngIf="isSearching" class="search-loading-row">
              <span>Recherche intelligente...</span>
            </div>
            <ng-container *ngIf="searchResults && !isSearching">
              <div *ngIf="searchResults.suggestedCorrection" class="search-ai-hint">
                <span>✨ Suggestion IA :</span>
                <button (click)="applySuggestedTerm(searchResults.suggestedCorrection!)" class="search-ai-hint-btn">
                  « {{ searchResults.suggestedCorrection }} »
                </button>
              </div>
              <div *ngIf="searchResults.totalMatches === 0" class="search-empty-row">
                Aucun résultat pour « <strong>{{ searchQuery }}</strong> ».
              </div>
              <div *ngIf="searchResults.technologies.length > 0" class="search-section">
                <div class="search-section-label">Technologies</div>
                <div class="search-tech-chips">
                  <button *ngFor="let tech of searchResults.technologies" (click)="goToTech(tech)" class="search-tech-chip">
                    <span class="tech-hash">#</span> {{ tech }}
                  </button>
                </div>
              </div>
              <div *ngIf="searchResults.projects.length > 0" class="search-section">
                <div class="search-section-label">Projets</div>
                <button *ngFor="let p of searchResults.projects" (click)="goToProject(p.id)" class="search-result-item">
                  <div class="res-avatar proj-av">{{ p.title.charAt(0).toUpperCase() }}</div>
                  <div class="res-info">
                    <div class="res-title">{{ p.title }}</div>
                    <div class="res-sub">{{ p.authorName }} • {{ p.stack.join(', ') }}</div>
                  </div>
                </button>
              </div>
              <div *ngIf="searchResults.developers.length > 0" class="search-section">
                <div class="search-section-label">Développeurs</div>
                <button *ngFor="let dev of searchResults.developers" (click)="goToProfile(dev.id)" class="search-result-item">
                  <div class="res-avatar dev-av">{{ dev.fullName.charAt(0).toUpperCase() }}</div>
                  <div class="res-info">
                    <div class="res-title">{{ dev.fullName }}</div>
                    <div class="res-sub">{{ dev.title }} <span *ngIf="dev.country">• {{ dev.country }}</span></div>
                  </div>
                </button>
              </div>
              <div *ngIf="searchResults.events.length > 0" class="search-section">
                <div class="search-section-label">Événements</div>
                <button *ngFor="let ev of searchResults.events" (click)="goToEvents(ev.title)" class="search-result-item">
                  <div class="res-avatar ev-av">📅</div>
                  <div class="res-info">
                    <div class="res-title">{{ ev.title }}</div>
                    <div class="res-sub">{{ ev.location }} • {{ ev.type }}</div>
                  </div>
                </button>
              </div>
              <div *ngIf="searchResults.opportunities.length > 0" class="search-section">
                <div class="search-section-label">Opportunités</div>
                <button *ngFor="let opp of searchResults.opportunities" (click)="goToOpportunities(opp.title)" class="search-result-item">
                  <div class="res-avatar opp-av">💼</div>
                  <div class="res-info">
                    <div class="res-title">{{ opp.title }}</div>
                    <div class="res-sub">{{ opp.location }}</div>
                  </div>
                </button>
              </div>
              <div class="search-quick-hub">
                <button (click)="goToAllResults()" class="search-explore-all">
                  Voir projets « {{ searchResults.suggestedCorrection || searchQuery }} » →
                </button>
                <div class="search-hub-links">
                  <button (click)="goToEvents(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">📅 Événements</button>
                  <button (click)="goToNetwork(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">👥 Réseau</button>
                  <button (click)="goToOpportunities(searchResults.suggestedCorrection || searchQuery)" class="search-hub-pill">💼 Offres</button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer notranslate" translate="no" [class.open]="isMobileMenuOpen">
        <div class="mobile-drawer-links notranslate" translate="no">
          <a routerLink="/" (click)="closeAllMenus()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="mobile-nav-link notranslate" translate="no">{{ t('nav.home') }}</a>
          <a routerLink="/projects" (click)="closeAllMenus()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="mobile-nav-link notranslate" translate="no">{{ t('nav.projects') }}</a>
          <a routerLink="/opportunities" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.opportunities') }}</a>
          <a routerLink="/network" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.network') }}</a>
          <a routerLink="/events" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.events') }}</a>
          <a routerLink="/communautes" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.communities') }}</a>
          <a routerLink="/resources" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.resources') }}</a>
          <a routerLink="/leaderboard" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.leaderboard') }}</a>
          <a *ngIf="isLoggedIn()" routerLink="/messages" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.messages') }}</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard/profile" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.profile') }}</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.dashboard') }}</a>
          <a *ngIf="isLoggedIn() && isAdmin()" routerLink="/admin" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.admin') }}</a>
          <a *ngIf="!isLoggedIn()" routerLink="/login" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link notranslate" translate="no">{{ t('nav.login') }}</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" (click)="closeAllMenus()" class="btn btn-emerald btn-block notranslate" translate="no">{{ t('nav.register') }}</a>
          
          <button *ngIf="isLoggedIn()" (click)="logout(); closeAllMenus();" class="btn btn-outline btn-block logout-mobile-btn notranslate" translate="no">
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Offline banner & sync toast -->
    <div class="offline-banner" *ngIf="!offlineSync.isOnline()">
      <span>📡 {{ t('offline.banner') }} ({{ offlineSync.pendingCount() }} {{ t('offline.pending') }})</span>
    </div>
    <div class="sync-toast-banner" *ngIf="offlineSync.lastSyncMessage()">
      <span>✓ {{ offlineSync.lastSyncMessage() }}</span>
    </div>

    <main [class.has-fixed-nav]="!hideNavAndFooter()">
      <router-outlet></router-outlet>
    </main>

    <!-- ELEGANT PROFESSIONAL FOOTER -->
    <footer class="app-footer" *ngIf="!hideNavAndFooter()">
      <div class="footer-container">
        <div class="footer-grid">
          
          <!-- Column 1: Brand & Mission -->
          <div class="footer-col col-brand">
            <a routerLink="/" class="footer-logo">
              <img src="/logo-africa.png" alt="AfriDev Hub Logo" class="footer-logo-img" />
              <div class="logo-text-wrapper">
                <span class="logo-text">AfriDev <span class="accent">Hub</span></span>
                <span class="logo-subtitle">Infrastructure de Réputation Panafricaine</span>
              </div>
            </a>
            <p class="brand-desc">
              La première plateforme panafricaine certifiant la réputation, les projets réels et les compétences des développeurs africains auprès des pairs et des recruteurs du monde entier.
            </p>
            <div class="community-status-badge">
              <span class="pulse-indicator"></span>
              <span>Réseau actif dans 54 pays africains</span>
            </div>
          </div>

          <!-- Column 2: Navigation Plateforme -->
          <div class="footer-col">
            <h4 class="col-title">Plateforme</h4>
            <ul class="footer-links">
              <li><a routerLink="/projects">Vitrine de Projets</a></li>
              <li><a routerLink="/opportunities">Offres & Freelance</a></li>
              <li><a routerLink="/network">Annuaire des Développeurs</a></li>
              <li><a routerLink="/evaluations">Évaluations par les Pairs</a></li>
              <li><a routerLink="/messages">Messagerie Directe</a></li>
            </ul>
          </div>

          <!-- Column 3: Confiance & Sécurité -->
          <div class="footer-col">
            <h4 class="col-title">Confiance & Tech</h4>
            <ul class="footer-links">
              <li><span class="static-link">Synchronisation GitHub Live</span></li>
              <li><span class="static-link">Badge Mobile Money Vérifié</span></li>
              <li><span class="static-link">Algorithme de Score (FastAPI)</span></li>
              <li><span class="static-link">Architecture Microservices</span></li>
              <li><span class="static-link">Conformité OWASP & JWT</span></li>
            </ul>
          </div>

          <!-- Column 4: Newsletter & Communauté -->
          <div class="footer-col col-newsletter">
            <h4 class="col-title">Restez Connecté</h4>
            <p class="newsletter-desc">Recevez les meilleures opportunités Tech et collaborations open-source directement.</p>
            <form class="newsletter-form" (submit)="$event.preventDefault()">
              <input type="email" name="newsletterEmail" autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="send" aria-label="Votre adresse email pour la newsletter" placeholder="Votre adresse email..." class="newsletter-input" />
              <button type="submit" class="btn btn-emerald btn-sm btn-newsletter" aria-label="S'abonner aux alertes Tech">
                <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <div class="social-pills">
              <span class="social-pill" title="GitHub"><i class="ri-github-fill"></i> GitHub</span>
              <span class="social-pill" title="LinkedIn"><i class="ri-linkedin-fill"></i> LinkedIn</span>
              <span class="social-pill" title="Discord"><i class="ri-discord-fill"></i> Discord</span>
            </div>
          </div>

        </div>

        <!-- Bottom Copyright Row -->
        <div class="footer-bottom-row">
          <div class="copyright-text">
            &copy; 2026 <strong>AfriDev Hub</strong> &bull; Conçu avec fierté pour les développeurs africains 🌍
          </div>
          <div class="footer-legal-links">
            <span class="legal-link">Conditions d'Utilisation</span>
            <span class="dot-sep">&bull;</span>
            <span class="legal-link">Confidentialité</span>
            <span class="dot-sep">&bull;</span>
            <span class="legal-link">Sécurité OWASP</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Public Multimodal & Voice AI Assistant (Gemini) -->
    <app-ai-assistant></app-ai-assistant>
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 112px;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: #000;
      text-align: center;
      padding: 0.4rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
      z-index: 1001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .sync-toast-banner {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: #fff;
      padding: 0.6rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 700;
      z-index: 2000;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .app-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 1000;
      background: rgba(11, 15, 25, 0.9);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.6rem 0 0.5rem;
      transition: background-color 0.25s ease, border-color 0.25s ease, padding 0.25s ease, box-shadow 0.25s ease;
    }
    .app-nav.nav-scrolled {
      background: rgba(11, 15, 25, 0.97);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      border-bottom-color: var(--border-light);
      padding: 0.48rem 0 0.4rem;
    }
    .app-nav.nav-light,
    :host-context(body.light-theme) .app-nav {
      background: rgba(255, 255, 255, 0.95);
      border-bottom-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .app-nav.nav-light.nav-scrolled,
    :host-context(body.light-theme) .app-nav.nav-scrolled {
      background: rgba(255, 255, 255, 0.99);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-bottom-color: rgba(0, 0, 0, 0.12);
    }
    .app-nav.nav-light .logo-text,
    :host-context(body.light-theme) .logo-text {
      color: #0F172A;
    }
    .app-nav.nav-light .logo-subtitle,
    :host-context(body.light-theme) .logo-subtitle {
      color: #64748B;
    }
    main.has-fixed-nav {
      padding-top: 122px;
    }

    /* OMNISEARCH BAR & SUB-NAVBAR */
    .omnisearch-wrapper {
      position: relative;
      flex: 1;
      max-width: 560px;
      margin: 0 1rem;
    }
    .omnisearch-box {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      padding: 0.48rem 0.9rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .omnisearch-box:focus-within {
      background: rgba(15, 23, 42, 0.96);
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
    }
    .app-nav.nav-light .omnisearch-box,
    :host-context(body.light-theme) .omnisearch-box {
      background: #F1F5F9;
      border-color: rgba(15, 23, 42, 0.1);
    }
    .app-nav.nav-light .omnisearch-box:focus-within,
    :host-context(body.light-theme) .omnisearch-box:focus-within {
      background: #FFFFFF;
      border-color: var(--emerald-500);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.14);
    }
    .omnisearch-icon {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .omnisearch-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-heading);
      font-size: 0.9rem;
      font-weight: 500;
      min-width: 0;
      appearance: none;
      -webkit-appearance: none;
    }
    .omnisearch-input::-webkit-search-decoration,
    .omnisearch-input::-webkit-search-cancel-button,
    .omnisearch-input::-webkit-search-results-button,
    .omnisearch-input::-webkit-search-results-decoration {
      -webkit-appearance: none;
      appearance: none;
    }
    .app-nav.nav-light .omnisearch-input,
    :host-context(body.light-theme) .omnisearch-input {
      color: #0F172A;
    }
    .omnisearch-input::placeholder {
      color: var(--text-muted);
      opacity: 0.85;
    }
    .omnisearch-clear {
      position: relative;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.12);
      color: var(--text-heading);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    @media (max-width: 1140px), (pointer: coarse) {
      .omnisearch-input {
        font-size: max(1rem, 1em);
      }
      .mobile-search-strip .omnisearch-box {
        min-block-size: 44px;
        padding: 0.35rem 0.55rem 0.35rem 0.9rem;
      }
      .omnisearch-clear::after {
        content: "";
        position: absolute;
        inset: -10px;
      }
    }
    .app-nav.nav-light .omnisearch-clear,
    :host-context(body.light-theme) .omnisearch-clear {
      background: rgba(15, 23, 42, 0.08);
      color: #334155;
    }
    .omnisearch-clear:hover {
      background: #EF4444;
      color: #FFFFFF;
    }
    .omnisearch-dropdown {
      position: absolute;
      top: calc(100% + 0.55rem);
      left: 0;
      right: 0;
      max-height: 70dvh;
      overflow-y: auto;
      background: #0F172A;
      border: 1px solid var(--border-light);
      border-radius: 16px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
      z-index: 1100;
      padding: 0.65rem;
      animation: dropdownFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .app-nav.nav-light .omnisearch-dropdown,
    :host-context(body.light-theme) .omnisearch-dropdown {
      background: #FFFFFF;
      border-color: rgba(15, 23, 42, 0.1);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
    }
    .search-loading-row,
    .search-empty-row {
      padding: 1rem 0.75rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .search-section {
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .search-section:last-of-type {
      border-bottom: none;
    }
    .app-nav.nav-light .search-section,
    :host-context(body.light-theme) .search-section {
      border-bottom-color: rgba(15, 23, 42, 0.06);
    }
    .search-section-label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--emerald-500);
      padding: 0.25rem 0.6rem 0.35rem;
    }
    .search-tech-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0.25rem 0.6rem 0.45rem;
    }
    .search-tech-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: var(--emerald-400);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .app-nav.nav-light .search-tech-chip,
    :host-context(body.light-theme) .search-tech-chip {
      color: #059669;
      background: #ECFDF5;
    }
    .search-tech-chip:hover {
      background: var(--emerald-500);
      color: #FFFFFF;
    }
    .search-result-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.65rem;
      border-radius: 10px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .search-result-item:hover {
      background: rgba(16, 185, 129, 0.1);
    }
    .res-avatar {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.88rem;
      flex-shrink: 0;
    }
    .res-avatar.proj-av {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .res-avatar.dev-av {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
    }
    .res-avatar.opp-av {
      background: rgba(245, 158, 11, 0.16);
      font-size: 1rem;
    }
    .res-avatar.ev-av {
      background: rgba(139, 92, 246, 0.16);
      font-size: 1rem;
    }
    .search-ai-hint {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      padding: 0.5rem 0.7rem;
      margin-bottom: 0.35rem;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px dashed rgba(16, 185, 129, 0.35);
      font-size: 0.8rem;
      color: var(--emerald-400);
    }
    .search-ai-hint-btn {
      background: var(--emerald-500);
      color: #FFFFFF;
      border: none;
      border-radius: 999px;
      padding: 0.18rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .search-quick-hub {
      margin-top: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .search-hub-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .search-hub-pill {
      flex: 1;
      min-width: 90px;
      padding: 0.42rem 0.6rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-heading);
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .app-nav.nav-light .search-hub-pill,
    :host-context(body.light-theme) .search-hub-pill {
      background: #F8FAFC;
      border-color: rgba(15, 23, 42, 0.1);
      color: #334155;
    }
    .search-hub-pill:hover {
      border-color: var(--emerald-500);
      color: var(--emerald-500);
    }
    .res-info {
      flex: 1;
      min-width: 0;
    }
    .res-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .app-nav.nav-light .res-title,
    :host-context(body.light-theme) .res-title {
      color: #0F172A;
    }
    .res-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.1rem;
    }
    .res-type-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.18rem 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .app-nav.nav-light .res-type-badge,
    :host-context(body.light-theme) .res-type-badge {
      background: #F1F5F9;
      color: #475569;
    }
    .res-type-badge.badge-dev {
      background: rgba(59, 130, 246, 0.14);
      color: #60a5fa;
    }
    .app-nav.nav-light .res-type-badge.badge-dev,
    :host-context(body.light-theme) .res-type-badge.badge-dev {
      color: #2563EB;
    }
    .search-explore-all {
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      border: 1px solid rgba(16, 185, 129, 0.25);
      background: rgba(16, 185, 129, 0.1);
      color: var(--emerald-400);
      font-size: 0.83rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }
    .app-nav.nav-light .search-explore-all,
    :host-context(body.light-theme) .search-explore-all {
      color: #059669;
      background: #ECFDF5;
    }
    .search-explore-all:hover {
      background: var(--emerald-500);
      color: #FFFFFF;
    }
    .nav-sub-row {
      max-width: 1440px;
      margin: 0.45rem auto 0;
      padding: 0 1rem;
      justify-content: center;
    }
    .mobile-search-strip {
      padding: 0.5rem 0.9rem 0.55rem;
      border-top: 1px solid var(--border-subtle);
      width: 100%;
      box-sizing: border-box;
    }
    .app-nav.nav-light .mobile-search-strip,
    :host-context(body.light-theme) .mobile-search-strip {
      border-top-color: rgba(15, 23, 42, 0.06);
    }
    .mobile-search-strip .omnisearch-wrapper {
      margin: 0;
      max-width: 100%;
      width: 100%;
    }
    .mobile-search-strip .omnisearch-dropdown.mobile-dropdown {
      max-height: 62dvh;
    }
    .nav-content {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      position: relative;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-family: var(--font-heading);
      font-size: 1.35rem;
      font-weight: 800;
      text-decoration: none;
      color: var(--text-heading);
      flex-shrink: 0;
    }
    .logo-svg {
      width: 1.6rem;
      height: 1.6rem;
      color: var(--emerald-500);
    }
    .accent {
      color: var(--emerald-500);
    }

    /* CENTERED FLOATING PILL NAVIGATION */
    .nav-center-pill {
      display: flex;
      align-items: center;
      gap: 0.15rem;
      padding: 0.25rem 0.45rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      margin: 0 auto;
      flex-shrink: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .app-nav.nav-light .nav-center-pill,
    :host-context(body.light-theme) .nav-center-pill {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .nav-center-pill:hover {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.08);
    }

    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.835rem;
      padding: 0.42rem 0.75rem;
      border-radius: 999px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      white-space: nowrap;
    }
    .app-nav.nav-light .nav-link,
    :host-context(body.light-theme) .nav-link {
      color: #475569;
    }
    .nav-link:hover {
      color: var(--text-heading);
      background: rgba(255, 255, 255, 0.06);
    }
    .app-nav.nav-light .nav-link:hover,
    :host-context(body.light-theme) .nav-link:hover {
      color: #0F172A;
      background: rgba(0, 0, 0, 0.05);
    }
    .nav-link.active {
      color: #10B981 !important;
      background: rgba(16, 185, 129, 0.12);
      font-weight: 700;
    }
    .app-nav.nav-light .nav-link.active,
    :host-context(body.light-theme) .nav-link.active {
      color: #059669 !important;
      background: rgba(16, 185, 129, 0.14);
    }

    .app-nav.nav-light .lang-toggle-btn,
    .app-nav.nav-light .theme-toggle-btn,
    .app-nav.nav-light .mobile-toggle-btn,
    :host-context(body.light-theme) .lang-toggle-btn,
    :host-context(body.light-theme) .theme-toggle-btn,
    :host-context(body.light-theme) .mobile-toggle-btn {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.1);
      color: #0F172A;
    }
    .app-nav.nav-light .lang-toggle-btn:hover,
    .app-nav.nav-light .theme-toggle-btn:hover,
    .app-nav.nav-light .mobile-toggle-btn:hover,
    :host-context(body.light-theme) .lang-toggle-btn:hover,
    :host-context(body.light-theme) .theme-toggle-btn:hover,
    :host-context(body.light-theme) .mobile-toggle-btn:hover {
      background: rgba(0, 0, 0, 0.08);
      border-color: var(--emerald-500);
      color: var(--emerald-600);
    }

    .app-nav.nav-light .lang-dropdown-card,
    .app-nav.nav-light .profile-dropdown-card,
    :host-context(body.light-theme) .lang-dropdown-card,
    :host-context(body.light-theme) .profile-dropdown-card {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }
    .app-nav.nav-light .lang-name,
    :host-context(body.light-theme) .lang-name {
      color: #0F172A;
    }
    .app-nav.nav-light .dropdown-user-info .user-name,
    :host-context(body.light-theme) .dropdown-user-info .user-name {
      color: #0F172A;
    }
    .app-nav.nav-light .dropdown-item,
    :host-context(body.light-theme) .dropdown-item {
      color: #334155;
    }
    .app-nav.nav-light .dropdown-item:hover,
    .app-nav.nav-light .dropdown-item.active,
    :host-context(body.light-theme) .dropdown-item:hover,
    :host-context(body.light-theme) .dropdown-item.active {
      background: #F1F5F9;
      color: #059669;
    }
    .app-nav.nav-light .dropdown-divider,
    :host-context(body.light-theme) .dropdown-divider {
      background: rgba(0, 0, 0, 0.08);
    }
    .app-nav.nav-light .mobile-drawer,
    :host-context(body.light-theme) .mobile-drawer {
      background: #FFFFFF;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .app-nav.nav-light .mobile-nav-link,
    :host-context(body.light-theme) .mobile-nav-link {
      color: #0F172A;
      border-bottom-color: rgba(0, 0, 0, 0.06);
    }
    .app-nav.nav-light .mobile-nav-link.active,
    :host-context(body.light-theme) .mobile-nav-link.active {
      color: #059669;
    }

    /* RIGHT ACTIONS CONTAINER */
    .nav-right-actions {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .nav-login-link {
      white-space: nowrap !important;
      flex-shrink: 0;
      padding: 0.42rem 0.85rem !important;
    }
    .nav-register-btn {
      white-space: nowrap !important;
      flex-shrink: 0;
    }

    /* LANGUAGE SELECTOR DROPDOWN */
    .lang-dropdown-container {
      position: relative;
    }
    .lang-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.75rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      color: var(--text-heading);
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .lang-toggle-btn:hover {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.4);
      color: var(--emerald-500);
    }
    .lang-flag {
      font-size: 1.05rem;
      line-height: 1;
    }
    .lang-code {
      letter-spacing: 0.04em;
    }
    .lang-dropdown-card {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 220px;
      background: var(--bg-surface-card);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
      z-index: 500;
      padding: 0.5rem;
      animation: dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lang-menu-header {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 0.35rem;
    }
    .lang-menu-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .lang-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
      -webkit-user-select: none;
    }
    .lang-menu-item:hover {
      background: rgba(16, 185, 129, 0.1);
    }
    .lang-menu-item.selected {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .lang-item-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      pointer-events: none;
    }
    .lang-code-pill {
      font-size: 0.725rem;
      font-weight: 700;
      color: var(--emerald-500);
      background: rgba(16, 185, 129, 0.12);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .mobile-lang-code {
      color: var(--emerald-500);
      font-weight: 800;
      margin-right: 0.35rem;
    }
    .lang-flag-sm {
      font-size: 1.15rem;
    }
    .lang-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-heading);
    }
    .voice-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 0.25rem 0.4rem;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .voice-btn:hover {
      background: var(--emerald-500);
      color: #022C22;
      border-color: var(--emerald-500);
      transform: scale(1.08);
    }

    .btn-sm {
      padding: 0.42rem 0.85rem;
      font-size: 0.835rem;
      white-space: nowrap;
    }

    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--text-heading);
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .theme-toggle-btn:hover {
      background: rgba(16, 185, 129, 0.12);
      border-color: var(--emerald-500);
      color: var(--emerald-500);
    }
    .theme-toggle-btn.icon-only {
      width: 38px;
      height: 38px;
      padding: 0;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.05);
    }

    /* Profile Menu Dropdown */
    .profile-dropdown-container {
      position: relative;
    }
    .avatar-menu-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 999px;
      transition: opacity 0.15s ease;
    }
    .avatar-menu-btn:hover {
      opacity: 0.85;
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--emerald-500) 0%, var(--emerald-700) 100%);
      color: #022C22;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px var(--emerald-glow);
    }
    .chevron-svg {
      width: 14px;
      height: 14px;
      color: var(--text-muted);
      transition: transform 0.2s ease;
    }
    .chevron-svg.rotated {
      transform: rotate(180deg);
    }
    .profile-dropdown-card {
      position: absolute;
      top: calc(100% + 0.6rem);
      right: 0;
      width: 240px;
      background: var(--bg-surface-card);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      z-index: 500;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      animation: dropdownFadeIn 0.15s ease;
    }
    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.4rem 0.5rem 0.6rem;
    }
    .dropdown-user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--emerald-500) 0%, var(--emerald-700) 100%);
      color: #022C22;
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .dropdown-user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .dropdown-user-info .user-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-user-info .user-role {
      font-size: 0.775rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.4rem 0;
    }
    .dropdown-menu-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      color: var(--text-body);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: all 0.15s ease;
    }
    .dropdown-item:hover, .dropdown-item.active {
      background: var(--bg-surface-hover);
      color: var(--emerald-500);
    }
    .logout-item {
      color: #EF4444;
    }
    .logout-item:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    .logout-mobile-btn {
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.3);
      margin-top: 0.5rem;
    }
    .logout-mobile-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #EF4444;
    }

    .mobile-controls {
      display: flex;
      align-items: center;
      gap: 0.42rem;
      flex-shrink: 0;
    }
    .mobile-lang-btn {
      padding: 0.38rem 0.6rem;
      font-size: 0.78rem;
      gap: 0.3rem;
      min-height: 34px;
    }
    .mobile-lang-card {
      right: -2.4rem;
      width: min(230px, calc(100vw - 1.5rem));
      z-index: 1200;
    }
    @media (max-width: 400px) {
      .nav-content {
        padding: 0 0.7rem;
        gap: 0.4rem;
      }
      .logo {
        font-size: 1.12rem;
        gap: 0.42rem;
      }
      .mobile-controls {
        gap: 0.3rem;
      }
      .mobile-lang-btn {
        padding: 0.34rem 0.5rem;
        font-size: 0.74rem;
      }
      .mobile-controls .theme-toggle-btn.icon-only,
      .mobile-controls .mobile-toggle-btn {
        padding: 0.36rem;
      }
    }

    /* DESKTOP DEFAULT: Hide mobile elements */
    .desktop-only {
      display: flex !important;
    }
    .mobile-only {
      display: none !important;
    }
    .mobile-toggle-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-heading);
      border-radius: 8px;
      padding: 0.4rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mobile-drawer {
      display: none !important;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 1rem 1.5rem 1.5rem 1.5rem;
    }
    .mobile-drawer-links {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .mobile-nav-link {
      color: var(--text-heading);
      text-decoration: none;
      font-size: 1rem;
      font-weight: 600;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .mobile-nav-link.active {
      color: var(--emerald-500);
    }
    .btn-block {
      width: 100%;
      text-align: center;
      margin-top: 0.5rem;
    }

    /* COMPACT DESKTOP (1140px - 1340px): Prevent horizontal overflow of the 7-item nav pill */
    @media (max-width: 1340px) {
      .logo-subtitle {
        display: none !important;
      }
      .nav-link {
        padding: 0.38rem 0.58rem;
        font-size: 0.8rem;
      }
      .nav-center-pill {
        padding: 0.2rem 0.35rem;
        gap: 0.1rem;
      }
      .nav-right-actions {
        gap: 0.45rem;
      }
      .btn-sm {
        padding: 0.38rem 0.75rem;
        font-size: 0.8rem;
      }
    }

    /* MOBILE & TABLET BREAKPOINT (< 1140px): Switch cleanly to mobile drawer */
    @media (max-width: 1140px) {
      .desktop-only,
      .desktop-search-slot {
        display: none !important;
      }
      .mobile-only {
        display: flex !important;
      }
      .mobile-drawer.open {
        display: block !important;
        max-height: calc(100dvh - 110px);
        overflow-y: auto;
      }
      main.has-fixed-nav {
        padding-top: 124px;
      }
    }

    /* ==========================================================================
       MODERN PROFESSIONAL FOOTER STYLES
       ========================================================================== */
    .app-footer {
      position: relative;
      background: var(--bg-surface-card);
      border-top: 1px solid var(--border-subtle);
      margin-top: clamp(2.75rem, 5vw, 4rem);
      padding-top: clamp(2.25rem, 4vw, 3.25rem);
      overflow: clip;
      width: 100%;
      box-sizing: border-box;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 clamp(1rem, 3vw, 1.5rem) max(5.25rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)));
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      box-sizing: border-box;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 2.5rem;
    }

    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
    }

    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: var(--text-heading);
    }

    .footer-logo-img {
      width: 32px;
      height: 32px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.4));
    }

    .brand-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 360px;
    }

    .community-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid var(--border-emerald);
      border-radius: 999px;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--emerald-400);
      width: fit-content;
    }

    .pulse-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald-500);
      box-shadow: 0 0 8px var(--emerald-500);
      animation: pulseDot 2s infinite;
    }

    .col-title {
      font-family: var(--font-heading);
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-heading);
      letter-spacing: -0.01em;
      margin: 0;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .footer-links a {
      color: var(--text-muted);
      font-size: 0.875rem;
      text-decoration: none;
      transition: color 0.15s ease, transform 0.15s ease;
      display: inline-block;
    }

    .footer-links a:hover {
      color: var(--emerald-400);
      transform: translateX(3px);
    }

    .static-link {
      font-size: 0.875rem;
      color: var(--text-dim);
    }

    .newsletter-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .newsletter-form {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 0.25rem 0.25rem 0.25rem 0.75rem;
      transition: border-color 0.2s ease;
    }

    .newsletter-form:focus-within {
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 2px var(--emerald-glow);
    }

    .newsletter-input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-heading);
      font-size: 0.875rem;
      flex: 1;
      width: 100%;
      min-width: 0;
    }

    @media (max-width: 900px), (pointer: coarse) {
      .newsletter-input {
        font-size: max(1rem, 1em);
        min-block-size: 38px;
      }
    }

    .btn-newsletter {
      padding: 0.45rem 0.75rem !important;
      border-radius: 7px;
      min-block-size: 38px;
      min-inline-size: 40px;
    }

    .social-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.25rem;
    }

    .social-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .social-pill:hover {
      background: var(--bg-surface-hover);
      color: var(--emerald-400);
      border-color: var(--border-emerald);
      transform: translateY(-1px);
    }

    .footer-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 1.5rem;
      padding-right: clamp(0rem, 8vw, 8.5rem);
      border-top: 1px solid var(--border-subtle);
      font-size: 0.825rem;
      color: var(--text-muted);
    }

    .footer-legal-links {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem 0.65rem;
    }

    @media (max-width: 768px) {
      .footer-bottom-row {
        flex-direction: column;
        align-items: flex-start;
        padding-right: 0;
        gap: 0.75rem;
      }
    }

    .legal-link {
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .legal-link:hover {
      color: var(--emerald-400);
    }

    .dot-sep {
      color: var(--border-light);
    }

    .nav-xp-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 999px;
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--emerald-400, #34d399);
      text-decoration: none;
      transition: all 0.2s ease;
      margin-right: 0.35rem;
    }

    .nav-xp-badge:hover {
      background: rgba(16, 185, 129, 0.22);
      transform: scale(1.04);
    }

    .dropdown-gamification-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.25rem;
      flex-wrap: wrap;
    }

    .dropdown-level-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .dropdown-xp-pill {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .highlight-leaderboard-link {
      color: var(--emerald-400) !important;
      font-weight: 600 !important;
    }
  `]
})
export class AppComponent implements OnDestroy {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  public offlineSync = inject(OfflineSyncService);
  private globalSearchService = inject(GlobalSearchService);
  private router = inject(Router);

  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  isLangMenuOpen = false;
  isScrolled = false;

  // Global Omnisearch State
  searchQuery = '';
  searchResults: GlobalSearchResults | null = null;
  isSearchOpen = false;
  isSearching = false;
  private searchTimer: any;
  private searchSub?: Subscription;

  availableLanguages = this.translationService.languages;
  currentLang = this.translationService.currentLang;

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
    this.searchSub?.unsubscribe();
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  onSearchChange(val: string): void {
    clearTimeout(this.searchTimer);
    this.searchSub?.unsubscribe();

    if (!val || !val.trim()) {
      this.searchResults = null;
      this.isSearchOpen = false;
      this.isSearching = false;
      return;
    }

    this.isSearchOpen = true;
    this.isSearching = true;
    this.searchTimer = setTimeout(() => {
      this.searchSub = this.globalSearchService.search(val).subscribe({
        next: (res) => {
          this.searchResults = res;
          this.isSearching = false;
        },
        error: () => {
          this.isSearching = false;
        }
      });
    }, 100);
  }

  onSearchFocus(): void {
    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      this.isSearchOpen = true;
      if (!this.searchResults) {
        this.onSearchChange(this.searchQuery);
      }
    }
  }

  clearSearch(event?: Event): void {
    event?.stopPropagation();
    clearTimeout(this.searchTimer);
    this.searchSub?.unsubscribe();
    this.searchQuery = '';
    this.searchResults = null;
    this.isSearchOpen = false;
    this.isSearching = false;
  }

  goToProject(id: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/projects', id]);
  }

  goToProfile(id: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/profile', id]);
  }

  goToTech(tech: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/projects'], { queryParams: { tech } });
  }

  goToOpportunities(q: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/opportunities'], { queryParams: { q } });
  }

  goToEvents(q: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/events'], { queryParams: { q } });
  }

  goToNetwork(q: string): void {
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/network'], { queryParams: { q } });
  }

  applySuggestedTerm(term: string): void {
    this.searchQuery = term;
    this.onSearchChange(term);
  }

  goToAllResults(): void {
    const q = (this.searchResults?.suggestedCorrection || this.searchQuery).trim();
    if (!q) return;
    this.clearSearch();
    this.closeAllMenus();
    this.router.navigate(['/projects'], { queryParams: { q } });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 15;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
    this.isSearchOpen = false;
  }

  toggleLangMenu(event: Event): void {
    event.stopPropagation();
    this.isLangMenuOpen = !this.isLangMenuOpen;
    this.isProfileMenuOpen = false;
    this.isSearchOpen = false;
  }

  selectLanguage(lang: Language, event?: Event): void {
    if (event) event.stopPropagation();
    this.isLangMenuOpen = false;
    this.translationService.setLanguage(lang);
  }

  speakVoice(lang: Language, event: Event): void {
    event.stopPropagation();
    this.translationService.speakGreeting(lang);
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isLangMenuOpen = false;
    this.isSearchOpen = false;
    if (this.isProfileMenuOpen && this.authService.isLoggedIn()) {
      this.authService.refreshCurrentUser().subscribe({ error: () => {} });
    }
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isLangMenuOpen = false;
    this.isSearchOpen = false;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  closeAllMenus(): void {
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
    this.isSearchOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDashboardPage(): boolean {
    return this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/admin');
  }

  hideNavAndFooter(): boolean {
    const url = this.router.url.split('?')[0];
    return url.startsWith('/dashboard') || 
           url.startsWith('/admin') ||
           url.startsWith('/ai-assistant') ||
           url === '/login' || 
           url === '/register' || 
           url === '/verify-otp';
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    const u = this.authService.currentUser();
    return u ? (u.role === 'ADMIN' || u.role === 'MODERATOR' || u.role === 'SUPER_ADMIN') : false;
  }

  getUserInitial(): string {
    const u = this.authService.currentUser();
    if (!u) return 'U';
    const name = u.profile?.fullName || u.email;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  getUserFullName(): string {
    const u = this.authService.currentUser();
    if (!u) return 'Utilisateur';
    return u.profile?.fullName || u.email || 'Membre AfriDev';
  }

  getUserTitle(): string {
    const u = this.authService.currentUser();
    if (!u) return '';
    return u.profile?.title || (u.role === 'RECRUITER' ? 'Recruteur' : 'Développeur');
  }

  getUserXp(): number | null {
    const u = this.authService.currentUser();
    if (!u || u.role !== 'DEVELOPER') return null;
    return u.profile?.xpPoints ?? 0;
  }

  getUserLevelTitle(): string {
    const xp = this.getUserXp() ?? 0;
    if (xp >= 7000) return 'Leader';
    if (xp >= 4000) return 'Tech';
    if (xp >= 2000) return 'Expert';
    if (xp >= 500) return 'Senior';
    return 'Junior';
  }

  getUserLevelBadge(): string {
    const xp = this.getUserXp() ?? 0;
    if (xp >= 7000) return '👑';
    if (xp >= 4000) return '🟠';
    if (xp >= 2000) return '🟣';
    if (xp >= 500) return '🔵';
    return '🟢';
  }

  logout(): void {
    this.authService.logout();
    this.closeAllMenus();
    this.router.navigate(['/login']);
  }
}


