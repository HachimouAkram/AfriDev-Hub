import { Component, inject, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { OpportunityService } from '../../../core/services/opportunity.service';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';

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
  private translationService = inject(TranslationService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  user = this.authService.currentUser;
  isProfileMenuOpen = false;
  isMobileSidebarOpen = signal<boolean>(false);
  isSidebarCollapsed = signal<boolean>(false);

  // Notifications
  isNotifMenuOpen = false;
  notifications = this.notificationService.notifications;
  unreadNotifsCount = this.notificationService.unreadCount;

  // Multilingual & Speech
  isLangMenuOpen = false;
  currentLang = this.translationService.currentLang;
  availableLanguages = this.translationService.languages;

  submittedAppsCount = signal<number>(0);
  receivedAppsCount = signal<number>(0);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.refreshCurrentUser().subscribe({ error: () => {} });
    }
    this.loadCounts();
    this.loadNotifications();
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

  loadNotifications(): void {
    this.notificationService.getUserNotifications().subscribe();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
    this.isNotifMenuOpen = false;
    this.isMobileSidebarOpen.set(false);
  }

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(v => !v);
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
    this.isLangMenuOpen = false;
    this.isNotifMenuOpen = false;
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen && this.authService.isLoggedIn()) {
      this.authService.refreshCurrentUser().subscribe({ error: () => {} });
    }
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleLangMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = false;
    this.isNotifMenuOpen = false;
    this.isLangMenuOpen = !this.isLangMenuOpen;
  }

  selectLanguage(lang: Language): void {
    this.translationService.setLanguage(lang);
    this.isLangMenuOpen = false;
    this.speakVoice(lang);
  }

  speakVoice(lang: Language, event?: Event): void {
    if (event) event.stopPropagation();
    this.translationService.speakGreeting(lang);
  }

  toggleNotifMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = false;
    this.isLangMenuOpen = false;
    this.isNotifMenuOpen = !this.isNotifMenuOpen;
    if (this.isNotifMenuOpen) {
      this.loadNotifications();
    }
  }

  markAllNotifsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  markNotifRead(notif: NotificationItem, event?: Event): void {
    if (event) event.stopPropagation();
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
      this.isNotifMenuOpen = false;
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  isAdminOverviewActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/admin' || url === '/admin/' || url.startsWith('/admin/overview');
  }

  isAdoptionActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url.startsWith('/admin/adoption');
  }

  isAdminProfileActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url.startsWith('/admin/profile') || (this.isAdmin() && url.startsWith('/dashboard/profile'));
  }

  isSuperAdmin(): boolean {
    return this.user()?.role === 'SUPER_ADMIN';
  }

  isAdmin(): boolean {
    const r = this.user()?.role;
    return r === 'SUPER_ADMIN' || r === 'ADMIN';
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url === '/admin' || url === '/admin/' || url.includes('/admin/overview')) return 'Tableau de bord';
    if (url.includes('/admin/adoption')) return 'Adoption';
    if (url.includes('/admin/users')) return 'Utilisateurs';
    if (url.includes('/admin/moderation')) return 'Modération';
    if (url.includes('/admin/audit')) return 'Audit';
    if (url.includes('/admin/profile')) return this.isSuperAdmin() ? 'Mon Profil Super Administrateur' : 'Mon Profil Administrateur';
    if (url.includes('/dashboard/applications')) return 'Mes candidatures';
    if (url.includes('/dashboard/offers')) return 'Offres & Demandes reçues';
    if (url.includes('/dashboard/messages')) return 'Messagerie';
    if (url.includes('/dashboard/projects')) return 'Mes projets vitrine';
    if (url.includes('/dashboard/evaluations')) return 'Réputation & Évaluations par les Pairs';
    if (url.includes('/dashboard/leaderboard')) return 'Classement des Développeurs d\'Afrique';
    if (url.includes('/dashboard/profile')) return this.isSuperAdmin() ? 'Mon Profil Super Administrateur' : (this.isAdmin() ? 'Mon Profil Administrateur' : 'Mon Profil Développeur');
    return 'Tableau de bord';
  }

  isMessagesPage(): boolean {
    return this.router.url.includes('/messages');
  }

  getLevelBadge(levelNumber?: number): string {
    switch (levelNumber) {
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
    this.closeProfileMenu();
    this.closeMobileSidebar();
    this.router.navigate(['/login']);
  }
}
