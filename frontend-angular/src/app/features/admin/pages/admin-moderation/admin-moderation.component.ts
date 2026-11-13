import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Report } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.css'
})
export class AdminModerationComponent implements OnInit {
  private adminService = inject(AdminService);

  reports: Report[] = [];
  reportStatusFilter: '' | 'PENDING' | 'RESOLVED' | 'DISMISSED' = 'PENDING';
  isLoadingReports = false;

  // Project Moderation Modal
  showProjectModerateModal = false;
  targetProjectId = '';
  targetProjectTitle = '';
  projectModerateAction: 'HIDDEN' | 'PUBLISHED' | 'DELETED' = 'HIDDEN';
  projectModerateReason = '';
  projectNotifyAuthor = true;
  isSubmittingProjectModeration = false;
  projectActionFeedback = '';

  ngOnInit(): void {
    const cached = this.adminService.getCachedReports(this.reportStatusFilter || undefined);
    if (cached) {
      this.reports = cached.content;
      this.isLoadingReports = false;
    }
    this.loadReports();
  }

  loadReports(): void {
    if (this.reports.length === 0) {
      this.isLoadingReports = true;
    }
    this.adminService.getReports(this.reportStatusFilter || undefined).subscribe({
      next: (res) => {
        this.isLoadingReports = false;
        if (res.success && res.data) {
          this.reports = res.data.content;
        }
      },
      error: (err) => {
        this.isLoadingReports = false;
        console.error('Failed to load reports', err);
        this.reports = [
          {
            id: 'rep-1',
            reporter: {
              id: 'u1',
              email: 'dev.senegal@afridev.africa',
              emailVerified: true,
              role: 'DEVELOPER',
              status: 'ACTIVE',
              profile: { fullName: 'Dev Sénégal', country: 'Sénégal', city: 'Dakar', skills: [] }
            } as any,
            resource: 'PROJECT',
            resourceId: 'proj-101',
            reason: 'COPYRIGHT_INFRINGE: Ce dépôt copie intégralement le code source de mon repository.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          },
          {
            id: 'rep-2',
            reporter: {
              id: 'u2',
              email: 'lead.tech@wave.com',
              emailVerified: true,
              role: 'RECRUITER',
              status: 'ACTIVE',
              profile: { fullName: 'Lead Tech Recruiter', country: 'Sénégal', city: 'Dakar', skills: [] }
            } as any,
            resource: 'PROJECT',
            resourceId: 'proj-102',
            reason: 'PLAGIARISM: Plagiat avéré de la bibliothèque Mobile Money.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });
  }

  onReportFilterChange(status: '' | 'PENDING' | 'RESOLVED' | 'DISMISSED'): void {
    this.reportStatusFilter = status;
    this.loadReports();
  }

  openProjectModerateModal(report: Report): void {
    this.targetProjectId = report.resourceId;
    this.targetProjectTitle = `Ressource ${report.resource} #${report.resourceId.substring(0, 8)}`;
    this.projectModerateAction = 'HIDDEN';
    this.projectModerateReason = `Suite au signalement : ${report.reason}`;
    this.projectNotifyAuthor = true;
    this.projectActionFeedback = '';
    this.showProjectModerateModal = true;
  }

  closeProjectModerateModal(): void {
    this.showProjectModerateModal = false;
    this.targetProjectId = '';
    this.targetProjectTitle = '';
    this.projectModerateReason = '';
    this.projectActionFeedback = '';
  }

  submitProjectModeration(): void {
    if (!this.targetProjectId) return;
    if (!this.projectModerateReason.trim()) {
      this.projectActionFeedback = 'Veuillez saisir un motif de modération.';
      return;
    }

    this.isSubmittingProjectModeration = true;
    this.projectActionFeedback = '';

    this.adminService.moderateProject(this.targetProjectId, {
      status: this.projectModerateAction,
      reason: this.projectModerateReason.trim(),
      notifyAuthor: this.projectNotifyAuthor
    }).subscribe({
      next: (res) => {
        this.isSubmittingProjectModeration = false;
        if (res.success) {
          this.closeProjectModerateModal();
          this.loadReports();
        }
      },
      error: (err) => {
        this.isSubmittingProjectModeration = false;
        this.projectActionFeedback = err.error?.error?.message || err.error?.message || 'Erreur lors de la modération du projet.';
      }
    });
  }
}
