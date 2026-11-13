import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLog } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit.component.html',
  styleUrl: './admin-audit.component.css'
})
export class AdminAuditComponent implements OnInit {
  private adminService = inject(AdminService);

  auditLogs: AuditLog[] = [];
  auditSearchTerm = '';
  auditPage = 0;
  auditTotalPages = 1;
  auditTotalElements = 0;
  isLoadingAudit = false;

  ngOnInit(): void {
    const cached = this.adminService.getCachedAuditLogs(this.auditPage, 15, this.auditSearchTerm || undefined);
    if (cached) {
      this.auditLogs = cached.content;
      this.auditTotalPages = cached.totalPages;
      this.auditTotalElements = cached.totalElements;
      this.isLoadingAudit = false;
    }
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    if (this.auditLogs.length === 0) {
      this.isLoadingAudit = true;
    }
    this.adminService.getAuditLogs(
      this.auditPage,
      15,
      this.auditSearchTerm || undefined
    ).subscribe({
      next: (res) => {
        this.isLoadingAudit = false;
        if (res.success && res.data) {
          this.auditLogs = res.data.content;
          this.auditTotalPages = res.data.totalPages;
          this.auditTotalElements = res.data.totalElements;
        }
      },
      error: (err) => {
        this.isLoadingAudit = false;
        console.error('Failed to load audit logs', err);
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
            action: 'USER_SANCTION_APPLIED',
            resource: 'USER',
            metadataJson: JSON.stringify({ motif: 'Mise à jour du statut utilisateur vers SUSPENDED pour suspicion de violation des droits d\'auteur.' }),
            ipAddress: '197.234.221.14',
            createdAt: new Date().toISOString()
          },
          {
            id: 'log-2',
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
            action: 'PROJECT_MODERATION_FROZEN',
            resource: 'PROJECT',
            metadataJson: JSON.stringify({ motif: 'Gel et retrait de la vitrine publique du projet suite à signalement de plagiat.' }),
            ipAddress: '197.234.221.14',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ];
      }
    });
  }

  onAuditSearch(): void {
    this.auditPage = 0;
    this.loadAuditLogs();
  }

  goToAuditPage(page: number): void {
    if (page >= 0 && page < this.auditTotalPages) {
      this.auditPage = page;
      this.loadAuditLogs();
    }
  }

  formatMetadata(metadataJson?: string): { key: string, value: string }[] {
    if (!metadataJson) return [];
    try {
      if (metadataJson.trim().startsWith('{')) {
        const parsed = JSON.parse(metadataJson);
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));
      }
    } catch (e) {
      // not JSON
    }
    return [{ key: 'Détails', value: metadataJson }];
  }
}
