import { Component, inject, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { OpportunityService } from '../../../core/services/opportunity.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private opportunityService = inject(OpportunityService);
  private router = inject(Router);

  user = this.authService.currentUser;
  isProfileMenuOpen = false;
  isMobileSidebarOpen = signal<boolean>(false);

  submittedAppsCount = signal<number>(0);
  receivedAppsCount = signal<number>(0);

  ngOnInit(): void {
    this.loadCounts();
  }

  loadCounts(): void {
    this.opportunityService.getMyApplications().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.submittedAppsCount.set(res.data.length);
        }
      }
    });

    this.opportunityService.getReceivedApplications().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.receivedAppsCount.set(res.data.length);
        }
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
    this.isMobileSidebarOpen.set(false);
  }

  toggleMobileSidebar(event?: Event): void {
    if (event) event.stopPropagation();
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard/applications')) return 'Mes candidatures';
    if (url.includes('/dashboard/offers')) return 'Offres & Demandes reçues';
    if (url.includes('/dashboard/messages')) return 'Messagerie';
    if (url.includes('/dashboard/projects')) return 'Mes projets vitrine';
    if (url.includes('/dashboard/evaluations')) return 'Réputation & Évaluations par les Pairs';
    if (url.includes('/dashboard/profile')) return 'Mon Profil Développeur';
    return 'Tableau de bord';
  }

  isMessagesPage(): boolean {
    return this.router.url.includes('/messages');
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.router.navigate(['/login']);
  }
}
