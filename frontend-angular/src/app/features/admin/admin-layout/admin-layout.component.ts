import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  user = this.authService.currentUser;
  isDark = this.themeService.isDark;

  isSidebarCollapsed = signal<boolean>(false);
  isMobileSidebarOpen = signal<boolean>(false);
  isProfileMenuOpen = false;

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(event?: Event): void {
    event?.stopPropagation();
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProfileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isSuperAdmin(): boolean {
    return this.user()?.role === 'SUPER_ADMIN';
  }

  isAdoptionActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/admin' || url === '/admin/' || url.startsWith('/admin/adoption');
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin/users')) {
      return 'Annuaire des Talents & Gestion des Comptes';
    }
    if (url.includes('/admin/moderation')) {
      return 'Modération des Projets & Droits d\'Auteur';
    }
    if (url.includes('/admin/audit')) {
      return 'Registre d\'Audit & Sécurité Immuable';
    }
    return 'Adoption Panafricaine & Statistiques (54 Pays)';
  }
}
