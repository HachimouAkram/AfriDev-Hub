import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="app-nav" *ngIf="!isDashboardPage()">
      <div class="nav-content">
        <a routerLink="/" (click)="closeAllMenus()" class="logo">
          <img src="/logo-africa.png" alt="AfriDev Hub Logo" class="logo-img" />
          <div class="logo-text-wrapper">
            <span class="logo-text">AfriDev <span class="accent">Hub</span></span>
            <span class="logo-subtitle">Connexion Développeurs Africains</span>
          </div>
        </a>

        <!-- Desktop Nav Links -->
        <div class="nav-links desktop-only">
          <ng-container *ngIf="!isDashboardPage()">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Accueil</a>
            <a routerLink="/projects" routerLinkActive="active" class="nav-link">Vitrine Projets</a>
            <a routerLink="/opportunities" routerLinkActive="active" class="nav-link">Opportunités</a>
            <a routerLink="/network" routerLinkActive="active" class="nav-link">Réseau & Annuaire</a>
          </ng-container>

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
          <a *ngIf="!isLoggedIn()" routerLink="/login" routerLinkActive="active" class="nav-link">Connexion</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" class="btn btn-emerald btn-sm">S'inscrire</a>

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
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <div class="dropdown-menu-list">
                <a routerLink="/" (click)="closeProfileMenu()" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
                  </svg>
                  <span>Voir le site</span>
                </a>

                <a routerLink="/dashboard/profile" (click)="closeProfileMenu()" routerLinkActive="active" class="dropdown-item">
                  <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span>Mon Profil</span>
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
          <a routerLink="/projects" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Vitrine Projets</a>
          <a routerLink="/opportunities" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Opportunités</a>
          <a routerLink="/network" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Réseau & Annuaire</a>
          <a *ngIf="isLoggedIn()" routerLink="/messages" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Messagerie</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard/profile" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Mon Profil</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Tableau de bord</a>
          <a *ngIf="isLoggedIn() && isAdmin()" routerLink="/admin" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Admin</a>
          <a *ngIf="!isLoggedIn()" routerLink="/login" (click)="closeAllMenus()" routerLinkActive="active" class="mobile-nav-link">Connexion</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" (click)="closeAllMenus()" class="btn btn-emerald btn-block">S'inscrire</a>
          
          <button *ngIf="isLoggedIn()" (click)="logout(); closeAllMenus();" class="btn btn-outline btn-block logout-mobile-btn">
            Se Déconnecter
          </button>

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
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-dark);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.85rem 0;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .nav-content {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    }
    .logo-svg {
      width: 1.6rem;
      height: 1.6rem;
      color: var(--emerald-500);
    }
    .accent {
      color: var(--emerald-500);
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.15rem;
    }
    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      transition: color 0.15s ease;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--emerald-500);
    }
    .btn-sm {
      padding: 0.45rem 1rem;
      font-size: 0.85rem;
    }

    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-heading);
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
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
      padding: 0.45rem;
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

    /* MOBILE BREAKPOINT (< 990px) */
    @media (max-width: 990px) {
      .desktop-only {
        display: none !important;
      }
      .mobile-only {
        display: flex !important;
      }
      .mobile-drawer.open {
        display: block !important;
      }
    }
  `]
})
export class AppComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  isMobileMenuOpen = false;
  isProfileMenuOpen = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
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
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDashboardPage(): boolean {
    return this.router.url.startsWith('/dashboard');
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    const u = this.authService.currentUser();
    return u ? (u.role === 'ADMIN' || u.role === 'MODERATOR') : false;
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

  logout(): void {
    this.authService.logout();
    this.closeAllMenus();
    this.router.navigate(['/login']);
  }
}


