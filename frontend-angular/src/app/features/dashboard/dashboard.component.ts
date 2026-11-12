import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { OpportunityService, Opportunity, Application } from '../../core/services/opportunity.service';
import { EvaluationService, ReputationScore } from '../../core/services/evaluation.service';
import { ProfileService } from '../../core/services/profile.service';
import { AdminService, AdminStats } from '../../core/services/admin.service';
import { MessageService, DirectMessage } from '../../core/services/message.service';

import { ThemeService } from '../../core/services/theme.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private projectService = inject(ProjectService);
  private opportunityService = inject(OpportunityService);
  private evaluationService = inject(EvaluationService);
  private profileService = inject(ProfileService);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  user = this.authService.currentUser;

  // Profile menu dropdown state inside Dashboard header
  isProfileMenuOpen = false;

  // Active Tab: OVERVIEW | MY_APPLICATIONS | MY_OFFERS
  activeTab = signal<'OVERVIEW' | 'MY_APPLICATIONS' | 'MY_OFFERS'>('OVERVIEW');

  // Developer & User State
  reputationScore = signal<ReputationScore | null>(null);
  myProjects = signal<Project[]>([]);
  
  // Applications & Opportunities Tracking
  mySubmittedApplications = signal<Application[]>([]);
  myPostedOpportunities = signal<Opportunity[]>([]);
  myReceivedApplications = signal<Application[]>([]);

  // Admin State
  adminStats = signal<AdminStats | null>(null);

  loading = signal<boolean>(true);
  syncingGithub = signal<boolean>(false);
  githubMessage = signal<string>('');
  toastMessage = signal<string>('');

  // Modals state
  // Chat Modal
  showChatModal = false;
  chatRecipient: User | null = null;
  chatMessages: DirectMessage[] = [];
  newChatMessage = '';
  isSendingMessage = false;

  // Report Modal
  showReportModal = false;
  reportTargetApplication: Application | null = null;
  reportReason = '';
  isSubmittingReport = false;
  reportSuccessMessage = '';
  reportErrorMessage = '';

  ngOnInit(): void {
    const u = this.user();
    if (!u) return;

    if (u.role === 'DEVELOPER') {
      this.loadDeveloperData(u.id);
    } else if (u.role === 'RECRUITER') {
      this.loadRecruiterData();
    } else if (u.role === 'ADMIN' || u.role === 'MODERATOR' || u.role === 'SUPER_ADMIN') {
      this.loadAdminData();
    } else {
      this.loading.set(false);
    }

    // Always load applications data for any authenticated user!
    this.loadMyApplications();
    this.loadMyPostedData();
  }

  switchTab(tab: 'OVERVIEW' | 'MY_APPLICATIONS' | 'MY_OFFERS'): void {
    this.activeTab.set(tab);
    if (tab === 'MY_APPLICATIONS') {
      this.loadMyApplications();
    } else if (tab === 'MY_OFFERS') {
      this.loadMyPostedData();
    }
  }

  loadDeveloperData(userId: string): void {
    this.evaluationService.getReputationScore(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reputationScore.set(res.data);
        }
      }
    });

    this.projectService.getProjects(0, 5).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.content) {
          this.myProjects.set(res.data.content);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadRecruiterData(): void {
    this.loading.set(false);
  }

  loadAdminData(): void {
    this.adminService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.adminStats.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMyApplications(): void {
    this.opportunityService.getMyApplications().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mySubmittedApplications.set(res.data);
        }
      }
    });
  }

  loadMyPostedData(): void {
    this.opportunityService.getMyPostedOpportunities().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myPostedOpportunities.set(res.data);
        }
      }
    });

    this.opportunityService.getReceivedApplications().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myReceivedApplications.set(res.data);
        }
      }
    });
  }

  // Update Application Status (Accept / Reject)
  onUpdateStatus(app: Application, status: 'ACCEPTED' | 'REJECTED' | 'REVIEWED'): void {
    this.opportunityService.updateApplicationStatus(app.id, status).subscribe({
      next: (res) => {
        if (res.success) {
          const statusText = status === 'ACCEPTED' ? 'acceptée' : (status === 'REJECTED' ? 'refusée' : 'mise à jour');
          this.showToast(`Candidature de ${app.applicant.profile?.fullName || app.applicant.email} ${statusText} !`);
          this.loadMyPostedData();
        }
      },
      error: (err) => {
        alert('Erreur lors de la mise à jour du statut: ' + (err.error?.message || err.message));
      }
    });
  }

  // Messaging Chat Modal Handler
  openChatModal(recipient: User): void {
    this.chatRecipient = recipient;
    this.showChatModal = true;
    this.loadConversation(recipient.id);
  }

  closeChatModal(): void {
    this.showChatModal = false;
    this.chatRecipient = null;
    this.chatMessages = [];
    this.newChatMessage = '';
  }

  loadConversation(targetUserId: string): void {
    this.messageService.getConversation(targetUserId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.chatMessages = res.data;
        }
      }
    });
  }

  sendChatMessage(): void {
    if (!this.chatRecipient || !this.newChatMessage.trim() || this.isSendingMessage) return;

    this.isSendingMessage = true;
    const recipientId = this.chatRecipient.id;
    const content = this.newChatMessage.trim();

    this.messageService.sendMessage(recipientId, content).subscribe({
      next: (res) => {
        this.isSendingMessage = false;
        if (res.success) {
          this.newChatMessage = '';
          this.loadConversation(recipientId);
        }
      },
      error: () => {
        this.isSendingMessage = false;
      }
    });
  }

  // Report Candidate Modal Handler
  openReportModal(app: Application): void {
    this.reportTargetApplication = app;
    this.reportReason = '';
    this.reportSuccessMessage = '';
    this.reportErrorMessage = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportTargetApplication = null;
    this.reportReason = '';
  }

  submitReport(): void {
    if (!this.reportTargetApplication || !this.reportReason.trim() || this.isSubmittingReport) return;

    this.isSubmittingReport = true;
    this.reportErrorMessage = '';
    this.reportSuccessMessage = '';

    const reasonText = `Signalement candidature [AppID: ${this.reportTargetApplication.id}] pour l'offre [${this.reportTargetApplication.opportunityTitle}]: ${this.reportReason}`;

    this.adminService.createReport('APPLICATION', this.reportTargetApplication.id, reasonText).subscribe({
      next: (res) => {
        this.isSubmittingReport = false;
        if (res.success) {
          this.reportSuccessMessage = 'Signalement transmis aux modérateurs avec succès.';
          setTimeout(() => this.closeReportModal(), 1800);
        }
      },
      error: (err) => {
        this.isSubmittingReport = false;
        this.reportErrorMessage = err.error?.message || 'Erreur lors de l\'envoi du signalement.';
      }
    });
  }

  onSyncGithub(): void {
    const u = this.user();
    if (!u || !u.profile?.githubUrl) {
      this.githubMessage.set('Veuillez renseigner votre pseudo GitHub dans votre profil.');
      return;
    }

    const username = u.profile.githubUrl.split('/').pop() || '';
    this.syncingGithub.set(true);
    this.githubMessage.set('');

    this.profileService.syncGithub(username).subscribe({
      next: (res) => {
        this.syncingGithub.set(false);
        if (res.success) {
          this.githubMessage.set('Synchronisation GitHub réussie !');
        } else {
          this.githubMessage.set('Erreur lors de la synchronisation.');
        }
      },
      error: () => {
        this.syncingGithub.set(false);
        this.githubMessage.set('Impossible de synchroniser les données GitHub.');
      }
    });
  }

  verifyMobileMoney(): void {
    this.profileService.verifyMobileMoney().subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('Compte vérifié avec succès via Mobile Money !');
          window.location.reload();
        }
      }
    });
  }

  getCvViewerUrl(url?: string): string {
    return this.profileService.getPdfViewerUrl(url);
  }

  viewCv(url?: string): void {
    if (url) {
      this.profileService.openPdfInNewTab(url, 'CV_Candidature.pdf');
    }
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 4000);
  }

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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
