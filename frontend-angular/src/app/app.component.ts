import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="app-nav">
      <div class="nav-content">
        <a routerLink="/" class="logo">
          <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
          </svg>
          <span class="logo-text">AfriDev <span class="accent">Hub</span></span>
        </a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Accueil</a>
          <a routerLink="/projects" routerLinkActive="active" class="nav-link">Vitrine Projets</a>
          <a routerLink="/opportunities" routerLinkActive="active" class="nav-link">Opportunités</a>
          <a routerLink="/network" routerLinkActive="active" class="nav-link">Réseau & Annuaire</a>
          <a routerLink="/evaluations" routerLinkActive="active" class="nav-link">Réputation Pairs</a>
          <a *ngIf="isLoggedIn()" routerLink="/profile" routerLinkActive="active" class="nav-link">Mon Profil</a>
          <a *ngIf="isLoggedIn()" routerLink="/dashboard" routerLinkActive="active" class="nav-link">Tableau de bord</a>
          <a *ngIf="isLoggedIn() && isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-link">Admin</a>
          <a *ngIf="!isLoggedIn()" routerLink="/login" routerLinkActive="active" class="nav-link">Connexion</a>
          <a *ngIf="!isLoggedIn()" routerLink="/register" class="btn btn-emerald btn-sm">S'inscrire</a>
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
      background: rgba(11, 15, 25, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.85rem 0;
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
      gap: 1.25rem;
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
  `]
})
export class AppComponent {
  private authService = inject(AuthService);

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    const u = this.authService.currentUser();
    return u ? (u.role === 'ADMIN' || u.role === 'MODERATOR') : false;
  }
}
