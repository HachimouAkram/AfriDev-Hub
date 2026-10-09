import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService, ReputationScore } from '../../../../core/services/evaluation.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { AdminService, AdminStats } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.css'
})
export class DashboardOverviewComponent implements OnInit {
  private authService = inject(AuthService);
  private evaluationService = inject(EvaluationService);
  private profileService = inject(ProfileService);
  private adminService = inject(AdminService);

  user = this.authService.currentUser;
  reputationScore = signal<ReputationScore | null>(null);
  adminStats = signal<AdminStats | null>(null);
  syncingGithub = signal<boolean>(false);
  githubMessage = signal<string>('');
  toastMessage = signal<string>('');

  ngOnInit(): void {
    const u = this.user();
    if (!u) return;

    if (u.role === 'DEVELOPER') {
      this.loadDeveloperData(u.id);
    } else if (u.role === 'ADMIN' || u.role === 'MODERATOR') {
      this.loadAdminData();
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
  }

  loadAdminData(): void {
    this.adminService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.adminStats.set(res.data);
        }
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
          this.githubMessage.set('✓ Synchronisation GitHub réussie !');
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
          this.showToast('✓ Compte vérifié avec succès via Mobile Money !');
          window.location.reload();
        }
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 4000);
  }
}
