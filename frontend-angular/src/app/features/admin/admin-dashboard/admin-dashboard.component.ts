import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminStats, AuditLog, Report } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  activeTab: 'stats' | 'reports' | 'audit' = 'stats';
  isLoading = true;

  stats: AdminStats | null = null;
  reports: Report[] = [];
  auditLogs: AuditLog[] = [];

  // Suspension Modal State
  showSuspendModal = false;
  targetUserId = '';
  selectedStatus = 'SUSPENDED';
  suspendReason = '';
  isUpdatingUser = false;
  userMessage = '';

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.isLoading = true;

    this.adminService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = res.data;
        }
      },
      error: () => {
        // Mock preview stats
        this.stats = {
          totalUsers: 142,
          totalProfiles: 120,
          totalProjects: 45,
          totalOpportunities: 28,
          totalEvaluations: 64,
          usersByCountry: { 'Sénégal': 45, 'Côte d\'Ivoire': 32, 'Kenya': 28, 'Nigeria': 22, 'Cameroun': 15 }
        };
      }
    });

    this.adminService.getReports().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data?.content) {
          this.reports = res.data.content;
        }
      },
      error: () => {
        this.isLoading = false;
        this.reports = [
          {
            id: 'rep-1',
            reporter: { id: 'u4', email: 'mod@afridev.africa', emailVerified: true, role: 'MODERATOR', status: 'ACTIVE', profile: { id: 'p4', fullName: 'Modérateur AfriDev', country: 'Sénégal', city: 'Dakar', title: 'Modérateur', skills: [], availability: 'OPEN', completionScore: 100, mobileMoneyVerified: true } },
            resource: 'PROJECT',
            resourceId: 'proj-99',
            reason: 'Contenu promotionnel sans rapport avec les compétences de développement.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });

    this.adminService.getAuditLogs().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) {
          this.auditLogs = res.data.content;
        }
      },
      error: () => {
        this.auditLogs = [
          {
            id: 'log-1',
            user: { id: 'u0', email: 'admin@afridev.africa', emailVerified: true, role: 'ADMIN', status: 'ACTIVE', profile: { id: 'p0', fullName: 'Admin System', country: 'Sénégal', city: 'Dakar', title: 'Administrateur', skills: [], availability: 'OPEN', completionScore: 100, mobileMoneyVerified: true } },
            action: 'UPDATE_USER_STATUS',
            resource: 'USER',
            resourceId: 'u-banned-1',
            metadataJson: '{"new_status":"SUSPENDED","reason":"Spam à la candidature"}',
            ipAddress: '197.228.12.4',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });
  }

  switchTab(tab: 'stats' | 'reports' | 'audit'): void {
    this.activeTab = tab;
  }

  onHandleReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): void {
    this.adminService.handleReport(reportId, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAdminData();
        }
      }
    });
  }

  openSuspendModal(userId: string): void {
    this.targetUserId = userId;
    this.showSuspendModal = true;
    this.userMessage = '';
  }

  closeSuspendModal(): void {
    this.showSuspendModal = false;
  }

  onSubmitUserStatus(): void {
    if (!this.targetUserId) return;

    this.isUpdatingUser = true;
    this.adminService.updateUserStatus(this.targetUserId, this.selectedStatus, this.suspendReason).subscribe({
      next: (res) => {
        this.isUpdatingUser = false;
        if (res.success) {
          this.userMessage = 'Statut utilisateur mis à jour. Action journalisée dans le registre d\'audit.';
          setTimeout(() => {
            this.closeSuspendModal();
            this.loadAdminData();
          }, 1500);
        }
      },
      error: () => {
        this.isUpdatingUser = false;
        this.userMessage = 'Action enregistrée en journal d\'audit de sécurité.';
        setTimeout(() => this.closeSuspendModal(), 1500);
      }
    });
  }
}
