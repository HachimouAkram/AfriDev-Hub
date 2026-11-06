import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { TranslationService, Language } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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

        <!-- Desktop Nav Links - Centered Pill Navigation -->
        <div class="nav-center-pill desktop-only">
          <ng-container *ngIf="!isDashboardPage()">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Accueil</a>
            <a routerLink="/projects" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Projets</a>
            <a routerLink="/opportunities" routerLinkActive="active" class="nav-link">Opportunités</a>
            <a routerLink="/network" routerLinkActive="active" class="nav-link">Réseau</a>
            <a routerLink="/events" routerLinkActive="active" class="nav-link">Événements</a>
            <a routerLink="/communautes" routerLinkActive="active" class="nav-link">Communautés</a>
            <a routerLink="/leaderboard" routerLinkActive="active" class="nav-link">Classement</a>
          </ng-container>
        </div>

        <!-- Desktop Right Actions (Language Switcher, Theme Switcher, Auth & Profile) -->
        <div class="nav-right-actions desktop-only">
          <!-- Language Selector Dropdown with Voice Audio -->
          <div class="lang-dropdown-container">
            <button (click)="toggleLangMenu($event)" class="lang-toggle-btn" title="Changer de langue / Wàllu làkk">
              <span class="lang-code">{{ currentLang().code.toUpperCase() }}</span>
              <svg class="chevron-svg" [class.rotated]="isLangMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <!-- Language Dropdown Menu -->
            <div class="lang-dropdown-card" *ngIf="isLangMenuOpen" (click)="$event.stopPropagation()">
              <div class="lang-menu-header">
                <span>Choisir une langue</span>
              </div>
              <div class="lang-menu-list">
                <div *ngFor="let lang of availableLanguages" 
                     class="lang-menu-item" 
                     [class.selected]="lang.code === currentLang().code"
                     (click)="selectLanguage(lang)">
                  <div class="lang-item-left">
                    <span class="lang-code-pill">{{ lang.code.toUpperCase() }}</span>
                    <span class="lang-name">{{ lang.label }}</span>
                  </div>
                  <button type="button" 
                          class="voice-btn" 
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
          <a *ngIf="!isLoggedIn()" routerLink="/login" routerLinkActive="active" class="nav-link nav-login-link">Connexion</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" class="btn btn-emerald btn-sm nav-register-btn">S'inscrire</a>

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

        <!-- Mobile Controls (Theme Toggle + Hamburger Toggle) -->
        <div class="mobile-controls mobile-only">
          <button (click)="toggleTheme()" class="theme-toggle-btn icon-only" [title]="isDark() ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'">
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

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" [class.open]="isMobileMenuOpen">
        <div class="mobile-drawer-links">
          <a routerLink="/" (click)="closeAllMenus()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="mobile-nav-link">Accueil</a>
          <a routerLink="/projects" (click)="closeAllMenus()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="mobile-nav-link">Projets</a>
          <a routerLink="/opportunities" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Opportunités</a>
          <a routerLink="/network" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Réseau</a>
          <a routerLink="/events" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Événements</a>
          <a routerLink="/communautes" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Communautés</a>
          <a routerLink="/leaderboard" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Classement</a>
          <a *ngIf="isLoggedIn()" routerLink="/messages" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Messagerie</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard/profile" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Mon Profil</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Tableau de bord</a>
          <a *ngIf="isLoggedIn() && isAdmin()" routerLink="/admin" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Admin</a>
          <a *ngIf="!isLoggedIn()" routerLink="/login" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Connexion</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" (click)="closeAllMenus()" class="btn btn-emerald btn-block">S'inscrire</a>
          
          <button *ngIf="isLoggedIn()" (click)="logout(); closeAllMenus();" class="btn btn-outline btn-block logout-mobile-btn">
            Se Déconnecter
          </button>

          <!-- Mobile Language Selector with Voice -->
          <div class="mobile-lang-section">
            <span class="mobile-lang-label">Langue & Voix / Wàllu làkk :</span>
            <div class="mobile-lang-grid">
              <button *ngFor="let lang of availableLanguages" 
                      type="button"
                      class="mobile-lang-chip"
                      [class.active]="lang.code === currentLang().code"
                      (click)="selectLanguage(lang)">
                <span><strong class="mobile-lang-code">{{ lang.code.toUpperCase() }}</strong> {{ lang.label }}</span>
                <span class="voice-icon-mini" (click)="speakVoice(lang, $event)" [title]="'Écouter en ' + lang.label">🔊</span>
              </button>
            </div>
          </div>

          <button (click)="toggleTheme(); closeAllMenus();" class="theme-toggle-btn mobile-theme-btn">
            <svg *ngIf="isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25M4.284 12h-2.25m15.364 6.364l-1.591-1.591M6.759 6.759L5.168 5.168m12.728 0l-1.591 1.591M6.759 17.241l-1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
            </svg>
            <svg *ngIf="!isDark()" class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span>Passer au Mode {{ isDark() ? 'Clair' : 'Sombre' }}</span>
          </button>
        </div>
      </div>
    </nav>
    <main [class.has-fixed-nav]="!hideNavAndFooter()">
      <router-outlet></router-outlet>
    </main>

    <!-- ELEGANT PROFESSIONAL FOOTER -->
    <footer class="app-footer" *ngIf="!hideNavAndFooter()">
      <div class="footer-top-glow"></div>
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
            <div class="newsletter-form">
              <input type="email" placeholder="Votre adresse email..." class="newsletter-input" />
              <button class="btn btn-emerald btn-sm btn-newsletter">
                <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
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
  `,
  styles: [`
    .app-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 1000;
      background: rgba(11, 15, 25, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.85rem 0;
      transition: background-color 0.25s ease, border-color 0.25s ease, padding 0.25s ease, box-shadow 0.25s ease;
    }
    .app-nav.nav-scrolled {
      background: rgba(11, 15, 25, 0.96);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      border-bottom-color: var(--border-light);
      padding: 0.65rem 0;
    }
    .app-nav.nav-light,
    :host-context(body.light-theme) .app-nav {
      background: rgba(255, 255, 255, 0.94);
      border-bottom-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .app-nav.nav-light.nav-scrolled,
    :host-context(body.light-theme) .app-nav.nav-scrolled {
      background: rgba(255, 255, 255, 0.98);
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
      padding-top: 74px;
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

    /* Mobile Language Drawer Styles */
    .mobile-lang-section {
      padding: 0.75rem 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin: 0.5rem 0;
    }
    .mobile-lang-label {
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }
    .mobile-lang-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .mobile-lang-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-heading);
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
    }
    .mobile-lang-chip.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--emerald-500);
      color: var(--emerald-500);
    }
    .voice-icon-mini {
      font-size: 0.9rem;
      padding-left: 0.35rem;
    }

    .btn-sm {
      padding: 0.42rem 0.85rem;
      font-size: 0.835rem;
      white-space: nowrap;
    }

    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-heading);
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .theme-toggle-btn:hover {
      background: var(--bg-surface-hover);
      border-color: var(--emerald-500);
      color: var(--emerald-500);
    }
    .theme-toggle-btn.icon-only {
      padding: 0.45rem 0.65rem;
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

    .mobile-theme-btn {
      width: 100%;
      justify-content: center;
      margin-top: 0.5rem;
      padding: 0.65rem;
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
      gap: 0.5rem;
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
      .desktop-only {
        display: none !important;
      }
      .mobile-only {
        display: flex !important;
      }
      .mobile-drawer.open {
        display: block !important;
        max-height: calc(100vh - 72px);
        overflow-y: auto;
      }
    }

    /* ==========================================================================
       MODERN PROFESSIONAL FOOTER STYLES
       ========================================================================== */
    .app-footer {
      position: relative;
      background: var(--bg-surface-card);
      border-top: 1px solid var(--border-subtle);
      margin-top: 4rem;
      padding-top: 3.5rem;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .footer-top-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: min(800px, 90vw);
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--emerald-500), transparent);
      box-shadow: 0 0 20px var(--emerald-500);
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 3rem;
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
      font-size: 0.85rem;
      flex: 1;
      width: 100%;
    }

    .btn-newsletter {
      padding: 0.45rem 0.75rem !important;
      border-radius: 7px;
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
      border-top: 1px solid var(--border-subtle);
      font-size: 0.825rem;
      color: var(--text-muted);
    }

    .footer-legal-links {
      display: flex;
      align-items: center;
      gap: 0.65rem;
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
export class AppComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private router = inject(Router);

  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  isLangMenuOpen = false;
  isScrolled = false;

  availableLanguages = this.translationService.languages;
  currentLang = this.translationService.currentLang;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 15;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
  }

  toggleLangMenu(event: Event): void {
    event.stopPropagation();
    this.isLangMenuOpen = !this.isLangMenuOpen;
    this.isProfileMenuOpen = false;
  }

  selectLanguage(lang: Language): void {
    this.translationService.setLanguage(lang);
    this.isLangMenuOpen = false;
    this.translationService.speakGreeting(lang);
  }

  speakVoice(lang: Language, event: Event): void {
    event.stopPropagation();
    this.translationService.speakGreeting(lang);
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isLangMenuOpen = false;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  closeAllMenus(): void {
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
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
    if (!u || u.role === 'RECRUITER') return null;
    return u.profile?.xpPoints ?? 0;
  }

  getUserLevelTitle(): string {
    const u = this.authService.currentUser();
    return u?.profile?.levelTitle || 'Junior';
  }

  getUserLevelBadge(): string {
    const u = this.authService.currentUser();
    const num = u?.profile?.levelNumber || 1;
    switch (num) {
      case 5: return '👑';
      case 4: return '🟠';
      case 3: return '🟣';
      case 2: return '🔵';
      case 1:
      default: return '🟢';
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeAllMenus();
    this.router.navigate(['/login']);
  }
}


