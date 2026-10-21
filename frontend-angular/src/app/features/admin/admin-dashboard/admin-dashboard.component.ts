import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AdminService, 
  AdminStats, 
  AuditLog, 
  Report, 
  PlatformAdoptionSummary, 
  CountryAdoptionStats, 
  UserAdmin, 
  ProjectModerateRequest 
} from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  authService = inject(AuthService);

  activeTab: 'adoption' | 'users' | 'reports' | 'audit' = 'adoption';
  isLoading = true;

  // Tab 1: Continental Adoption
  adoptionSummary: PlatformAdoptionSummary | null = null;
  selectedCountryFilter = '';
  filteredCountries: CountryAdoptionStats[] = [];

  // Tab 2: User Directory & Management
  users: UserAdmin[] = [];
  userSearchTerm = '';
  userCountryFilter = '';
  userRoleFilter = '';
  userStatusFilter = '';
  userPage = 0;
  userTotalPages = 1;
  userTotalElements = 0;
  isLoadingUsers = false;

  // Tab 3: Reports & Moderation
  reports: Report[] = [];
  reportStatusFilter: '' | 'PENDING' | 'RESOLVED' | 'DISMISSED' = 'PENDING';
  isLoadingReports = false;

  // Tab 4: Security Audit Logs
  auditLogs: AuditLog[] = [];
  auditSearchTerm = '';
  auditPage = 0;
  auditTotalPages = 1;
  auditTotalElements = 0;
  isLoadingAudit = false;

  // Modals state
  // 1. User Status Action Modal
  showUserStatusModal = false;
  targetUser: UserAdmin | null = null;
  selectedUserAction: 'ACTIVE' | 'SUSPENDED' | 'BANNED' = 'SUSPENDED';
  userActionReason = '';
  isSubmittingUserAction = false;
  userActionFeedback = '';

  // 2. Project Moderation Modal (Freeze / Unpublish)
  showProjectModerateModal = false;
  targetProjectId = '';
  targetProjectTitle = '';
  projectModerateAction: 'HIDDEN' | 'PUBLISHED' | 'DELETED' = 'HIDDEN';
  projectModerateReason = '';
  projectNotifyAuthor = true;
  isSubmittingProjectModeration = false;
  projectActionFeedback = '';

  // Flag helpers
  private countryFlags: { [key: string]: string } = {
    'Sénégal': '🇸🇳',
    'Senegal': '🇸🇳',
    'Côte d\'Ivoire': '🇨🇮',
    'Cote d\'Ivoire': '🇨🇮',
    'Nigeria': '🇳🇬',
    'Nigéria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Rwanda': '🇷🇼',
    'Ghana': '🇬🇭',
    'Cameroun': '🇨🇲',
    'Cameroon': '🇨🇲',
    'Bénin': '🇧🇯',
    'Benin': '🇧🇯',
    'Togo': '🇹🇬',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Guinée': '🇬🇳',
    'Guinea': '🇬🇳',
    'Maroc': '🇲🇦',
    'Morocco': '🇲🇦',
    'Tunisie': '🇹🇳',
    'Tunisia': '🇹🇳',
    'Algérie': '🇩🇿',
    'Algeria': '🇩🇿',
    'Égypte': '🇪🇬',
    'Egypt': '🇪🇬',
    'RD Congo': '🇨🇩',
    'RDC': '🇨🇩',
    'Congo': '🇨🇬',
    'Gabon': '🇬🇦',
    'Madagascar': '🇲🇬',
    'Afrique du Sud': '🇿🇦',
    'South Africa': '🇿🇦'
  };

  ngOnInit(): void {
    this.loadAdoptionStats();
    this.loadUsers();
    this.loadReports();
    this.loadAuditLogs();
  }

  switchTab(tab: 'adoption' | 'users' | 'reports' | 'audit'): void {
    this.activeTab = tab;
    if (tab === 'adoption' && !this.adoptionSummary) {
      this.loadAdoptionStats();
    } else if (tab === 'users' && this.users.length === 0) {
      this.loadUsers();
    } else if (tab === 'reports' && this.reports.length === 0) {
      this.loadReports();
    } else if (tab === 'audit' && this.auditLogs.length === 0) {
      this.loadAuditLogs();
    }
  }

  // --- TAB 1: ADOPTION ANALYTICS ---
  loadAdoptionStats(): void {
    this.isLoading = true;
    this.adminService.getCountryAdoptionStats().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.adoptionSummary = res.data;
          this.applyCountryFilter();
        }
      },
      error: () => {
        this.isLoading = false;
        // Fallback preview
        this.adoptionSummary = {
          totalContinentalUsers: 245,
          totalContinentalProjects: 88,
          totalContinentalOpportunities: 34,
          activeCountriesCount: 8,
          countries: [
            { country: 'Sénégal', userCount: 78, developerCount: 65, recruiterCount: 13, verifiedUsersCount: 42, projectCount: 35, opportunityCount: 12, adoptionPercentage: 31.8, rank: 1 },
            { country: 'Côte d\'Ivoire', userCount: 54, developerCount: 46, recruiterCount: 8, verifiedUsersCount: 29, projectCount: 22, opportunityCount: 9, adoptionPercentage: 22.0, rank: 2 },
            { country: 'Nigéria', userCount: 41, developerCount: 36, recruiterCount: 5, verifiedUsersCount: 21, projectCount: 16, opportunityCount: 6, adoptionPercentage: 16.7, rank: 3 },
            { country: 'Kenya', userCount: 32, developerCount: 28, recruiterCount: 4, verifiedUsersCount: 18, projectCount: 11, opportunityCount: 4, adoptionPercentage: 13.1, rank: 4 },
            { country: 'Rwanda', userCount: 18, developerCount: 15, recruiterCount: 3, verifiedUsersCount: 14, projectCount: 7, opportunityCount: 2, adoptionPercentage: 7.3, rank: 5 },
            { country: 'Ghana', userCount: 12, developerCount: 11, recruiterCount: 1, verifiedUsersCount: 8, projectCount: 5, opportunityCount: 1, adoptionPercentage: 4.9, rank: 6 },
            { country: 'Cameroun', userCount: 6, developerCount: 5, recruiterCount: 1, verifiedUsersCount: 3, projectCount: 2, opportunityCount: 0, adoptionPercentage: 2.4, rank: 7 },
            { country: 'Bénin', userCount: 4, developerCount: 4, recruiterCount: 0, verifiedUsersCount: 2, projectCount: 1, opportunityCount: 0, adoptionPercentage: 1.6, rank: 8 }
          ]
        };
        this.applyCountryFilter();
      }
    });
  }

  applyCountryFilter(): void {
    if (!this.adoptionSummary) return;
    if (!this.selectedCountryFilter) {
      this.filteredCountries = this.adoptionSummary.countries;
    } else {
      const q = this.selectedCountryFilter.toLowerCase().trim();
      this.filteredCountries = this.adoptionSummary.countries.filter(c =>
        c.country.toLowerCase().includes(q)
      );
    }
  }

  // --- TAB 2: USER DIRECTORY ---
  loadUsers(page = 0): void {
    this.isLoadingUsers = true;
    this.userPage = page;

    this.adminService.getAdminUsers({
      search: this.userSearchTerm || undefined,
      country: this.userCountryFilter || undefined,
      role: this.userRoleFilter || undefined,
      status: this.userStatusFilter || undefined,
      page: this.userPage,
      size: 15
    }).subscribe({
      next: (res) => {
        this.isLoadingUsers = false;
        if (res.success && res.data) {
          this.users = res.data.content;
          this.userTotalPages = res.data.totalPages || 1;
          this.userTotalElements = res.data.totalElements || 0;
        }
      },
      error: () => {
        this.isLoadingUsers = false;
        // Fallback data
        this.users = [
          {
            id: 'u-1',
            email: 'kwame.osei@dev.africa',
            role: 'DEVELOPER',
            status: 'ACTIVE',
            emailVerified: true,
            fullName: 'Kwame Osei',
            title: 'Senior Backend & Cloud Engineer',
            country: 'Ghana',
            city: 'Accra',
            projectsCount: 2,
            opportunitiesCount: 0,
            reportsCount: 0,
            createdAt: '2026-09-12T10:00:00Z'
          },
          {
            id: 'u-2',
            email: 'fatou.sow@dev.africa',
            role: 'DEVELOPER',
            status: 'ACTIVE',
            emailVerified: true,
            fullName: 'Fatou Sow',
            title: 'Lead Frontend Architect',
            country: 'Sénégal',
            city: 'Dakar',
            projectsCount: 1,
            opportunitiesCount: 0,
            reportsCount: 0,
            createdAt: '2026-09-14T11:30:00Z'
          },
          {
            id: 'u-3',
            email: 'sarah.recruiter@tech.africa',
            role: 'RECRUITER',
            status: 'ACTIVE',
            emailVerified: true,
            fullName: 'Sarah Mensah',
            title: 'Head of Tech Talent @ PanAfrica Ventures',
            country: 'Kenya',
            city: 'Nairobi',
            projectsCount: 0,
            opportunitiesCount: 6,
            reportsCount: 0,
            createdAt: '2026-09-20T09:15:00Z'
          }
        ];
        this.userTotalElements = this.users.length;
        this.userTotalPages = 1;
      }
    });
  }

  onSearchUsers(): void {
    this.loadUsers(0);
  }

  resetUserFilters(): void {
    this.userSearchTerm = '';
    this.userCountryFilter = '';
    this.userRoleFilter = '';
    this.userStatusFilter = '';
    this.loadUsers(0);
  }

  openUserStatusModal(user: UserAdmin, preferredAction: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): void {
    this.targetUser = user;
    this.selectedUserAction = preferredAction;
    this.userActionReason = '';
    this.userActionFeedback = '';
    this.showUserStatusModal = true;
  }

  closeUserStatusModal(): void {
    this.showUserStatusModal = false;
    this.targetUser = null;
    this.userActionReason = '';
    this.userActionFeedback = '';
  }

  submitUserStatus(): void {
    if (!this.targetUser || !this.userActionReason.trim()) return;

    this.isSubmittingUserAction = true;
    this.adminService.updateUserStatus(this.targetUser.id, this.selectedUserAction, this.userActionReason).subscribe({
      next: (res) => {
        this.isSubmittingUserAction = false;
        if (res.success) {
          this.userActionFeedback = `Compte ${this.targetUser?.email} mis à jour (${this.selectedUserAction}). Email de notification transmis.`;
          setTimeout(() => {
            this.closeUserStatusModal();
            this.loadUsers(this.userPage);
            this.loadAuditLogs();
          }, 1400);
        }
      },
      error: (err) => {
        this.isSubmittingUserAction = false;
        this.userActionFeedback = err?.error?.message || 'Erreur lors de la mise à jour du statut.';
      }
    });
  }

  // --- TAB 3: REPORTS & PROJECT MODERATION ---
  loadReports(): void {
    this.isLoadingReports = true;
    this.adminService.getReports(this.reportStatusFilter || undefined).subscribe({
      next: (res) => {
        this.isLoadingReports = false;
        if (res.success && res.data?.content) {
          this.reports = res.data.content;
        }
      },
      error: () => {
        this.isLoadingReports = false;
        this.reports = [
          {
            id: 'rep-1',
            reporter: {
              id: 'u4',
              email: 'mod@afridev.africa',
              emailVerified: true,
              role: 'MODERATOR',
              status: 'ACTIVE',
              profile: {
                id: 'p4',
                fullName: 'Modérateur AfriDev',
                country: 'Sénégal',
                city: 'Dakar',
                title: 'Modérateur Qualité',
                skills: [],
                availability: 'OPEN',
                completionScore: 100,
                mobileMoneyVerified: true
              }
            },
            resource: 'PROJECT',
            resourceId: 'proj-collab-1',
            reason: 'Soupçon de copie textuelle d\'un repo Github externe sans attribution de licence.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });
  }

  onFilterReports(status: '' | 'PENDING' | 'RESOLVED' | 'DISMISSED'): void {
    this.reportStatusFilter = status;
    this.loadReports();
  }

  onHandleReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): void {
    this.adminService.handleReport(reportId, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadReports();
          this.loadAuditLogs();
        }
      }
    });
  }

  openProjectModerateModal(projectId: string, projectTitle: string): void {
    this.targetProjectId = projectId;
    this.targetProjectTitle = projectTitle;
    this.projectModerateAction = 'HIDDEN';
    this.projectModerateReason = '';
    this.projectNotifyAuthor = true;
    this.projectActionFeedback = '';
    this.showProjectModerateModal = true;
  }

  closeProjectModerateModal(): void {
    this.showProjectModerateModal = false;
    this.targetProjectId = '';
    this.targetProjectTitle = '';
    this.projectModerateReason = '';
  }

  submitProjectModeration(): void {
    if (!this.targetProjectId || !this.projectModerateReason.trim()) return;

    this.isSubmittingProjectModeration = true;
    const request: ProjectModerateRequest = {
      status: this.projectModerateAction,
      reason: this.projectModerateReason,
      notifyAuthor: this.projectNotifyAuthor
    };

    this.adminService.moderateProject(this.targetProjectId, request).subscribe({
      next: (res) => {
        this.isSubmittingProjectModeration = false;
        if (res.success) {
          this.projectActionFeedback = `Le projet « ${this.targetProjectTitle} » a été ${this.projectModerateAction === 'HIDDEN' ? 'gelé et masqué' : 'mis à jour'}.`;
          setTimeout(() => {
            this.closeProjectModerateModal();
            this.loadReports();
            this.loadAuditLogs();
          }, 1400);
        }
      },
      error: (err) => {
        this.isSubmittingProjectModeration = false;
        this.projectActionFeedback = err?.error?.message || 'Erreur lors de la modération du projet.';
      }
    });
  }

  // --- TAB 4: AUDIT LOGS ---
  loadAuditLogs(page = 0): void {
    this.isLoadingAudit = true;
    this.auditPage = page;

    this.adminService.getAuditLogs(this.auditPage, 20).subscribe({
      next: (res) => {
        this.isLoadingAudit = false;
        if (res.success && res.data?.content) {
          this.auditLogs = res.data.content;
          this.auditTotalPages = res.data.totalPages || 1;
          this.auditTotalElements = res.data.totalElements || 0;
        }
      },
      error: () => {
        this.isLoadingAudit = false;
        this.auditLogs = [
          {
            id: 'log-1',
            user: {
              id: 'u0',
              email: 'hachimouisidk@groupeisi.com',
              emailVerified: true,
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              profile: {
                id: 'p0',
                fullName: 'Super Admin Panafricain',
                country: 'Rwanda',
                city: 'Kigali',
                title: 'Directeur des Opérations',
                skills: [],
                availability: 'NOT_AVAILABLE',
                completionScore: 100,
                mobileMoneyVerified: true
              }
            },
            action: 'MODERATE_PROJECT',
            resource: 'PROJECT',
            resourceId: 'proj-demo-99',
            metadataJson: '{"previous_status":"PUBLISHED","new_status":"HIDDEN","reason":"Violation de droit d\'auteur"}',
            ipAddress: '197.234.218.10',
            createdAt: new Date().toISOString()
          }
        ];
        this.auditTotalElements = this.auditLogs.length;
      }
    });
  }

  getFilteredAuditLogs(): AuditLog[] {
    if (!this.auditSearchTerm.trim()) {
      return this.auditLogs;
    }
    const term = this.auditSearchTerm.toLowerCase();
    return this.auditLogs.filter(log =>
      log.action.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term) ||
      (log.user?.email && log.user.email.toLowerCase().includes(term)) ||
      (log.metadataJson && log.metadataJson.toLowerCase().includes(term))
    );
  }

  // Format JSON metadata nicely
  formatMetadata(jsonStr?: string): { key: string; value: string }[] {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));
    } catch {
      return [{ key: 'details', value: jsonStr }];
    }
  }

  getFlag(countryName: string): string {
    return this.countryFlags[countryName] || '🌍';
  }

  isSuperAdmin(): boolean {
    const u = this.authService.currentUser();
    return u?.role === 'SUPER_ADMIN';
  }
}
