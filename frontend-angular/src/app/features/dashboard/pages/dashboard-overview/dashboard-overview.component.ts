import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService, ReputationScore } from '../../../../core/services/evaluation.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { AdminService, AdminStats } from '../../../../core/services/admin.service';
import { ProjectService, Project } from '../../../../core/services/project.service';
import { OpportunityService } from '../../../../core/services/opportunity.service';
import { NetworkService } from '../../../../core/services/network.service';
import { FollowService } from '../../../../core/services/follow.service';
import { ProjectCollaborationService, ProjectProgress } from '../../../../core/services/project-collaboration.service';

export interface TopViewedProject {
  id: string;
  title: string;
  category: string;
  stack: string[];
  views: number;
  recognitions: number;
  percentage: number;
  color: string;
}

export interface ActivityMonthPoint {
  month: string;
  demandes: number;
  offres: number;
  candidatures: number;
  heightPercent: number;
}

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
  private projectService = inject(ProjectService);
  private opportunityService = inject(OpportunityService);
  private networkService = inject(NetworkService);
  private followService = inject(FollowService);
  private collaborationService = inject(ProjectCollaborationService);

  user = this.authService.currentUser;
  reputationScore = signal<ReputationScore | null>(null);
  adminStats = signal<AdminStats | null>(null);
  syncingGithub = signal<boolean>(false);
  githubMessage = signal<string>('');
  toastMessage = signal<string>('');

  // Real KPI Metrics
  totalProjectsCount = signal<number>(0);
  totalOpportunitiesCount = signal<number>(0);
  totalRelationsCount = signal<number>(0);
  totalApplicationsCount = signal<number>(0);

  // Collaboration Workspace Metrics & Projects
  collaborations = signal<ProjectProgress[]>([]);
  isLoadingCollab = signal<boolean>(true);

  totalCollabTasks = computed(() => this.collaborations().reduce((acc, c) => acc + (c.totalTasks || 0), 0));
  inProgressCollabTasks = computed(() => this.collaborations().reduce((acc, c) => acc + (c.inProgressTasks || 0), 0));
  completedCollabTasks = computed(() => this.collaborations().reduce((acc, c) => acc + (c.completedTasks || 0), 0));
  overdueCollabTasks = computed(() => this.collaborations().reduce((acc, c) => acc + (c.overdueTasks || 0), 0));
  averageCollabProgress = computed(() => {
    const list = this.collaborations();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, c) => acc + (c.completionPercentage || 0), 0);
    return Math.round(sum / list.length);
  });

  // Top 3 Most Viewed Projects
  topProjects = signal<TopViewedProject[]>([]);
  maxViews = computed(() => {
    const list = this.topProjects();
    if (!list.length) return 1;
    return Math.max(...list.map(p => p.views), 1);
  });

  // Requests & Applications Activity Timeline
  activityTimeline = signal<ActivityMonthPoint[]>([
    { month: 'Mai', demandes: 4, offres: 3, candidatures: 2, heightPercent: 45 },
    { month: 'Juin', demandes: 7, offres: 5, candidatures: 6, heightPercent: 70 },
    { month: 'Juil', demandes: 5, offres: 4, candidatures: 4, heightPercent: 55 },
    { month: 'Août', demandes: 9, offres: 8, candidatures: 7, heightPercent: 88 },
    { month: 'Sept', demandes: 12, offres: 10, candidatures: 11, heightPercent: 100 },
    { month: 'Oct', demandes: 8, offres: 6, candidatures: 7, heightPercent: 75 },
  ]);

  activePeriodFilter = signal<'ALL' | 'MONTH' | 'WEEK'>('MONTH');

  ngOnInit(): void {
    const u = this.user();
    if (!u) return;

    this.loadGlobalKPIs();
    this.loadCollaborations();

    if (u.role === 'DEVELOPER') {
      this.loadDeveloperData(u.id);
    } else if (u.role === 'ADMIN' || u.role === 'MODERATOR') {
      this.loadAdminData();
    }
  }

  loadCollaborations(): void {
    this.isLoadingCollab.set(true);
    this.collaborationService.getMyCollaborations().subscribe({
      next: (res) => {
        this.isLoadingCollab.set(false);
        if (res?.success && res.data) {
          this.collaborations.set(res.data);
        }
      },
      error: (err) => {
        this.isLoadingCollab.set(false);
        console.error('Erreur chargement collaborations', err);
      }
    });
  }

  loadGlobalKPIs(): void {
    const u = this.user();
    if (!u) return;

    // 1. Load the CURRENT USER'S OWN projects
    this.projectService.getMyProjects(0, 50).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const projects: Project[] = res.data.content || res.data || [];
          this.totalProjectsCount.set(res.data.totalElements || projects.length);
          this.calculateTopProjects(projects);
        }
      }
    });

    // 2. Load MY OWN applications (as developer) AND my posted opportunities (as recruiter)
    this.opportunityService.getMyApplications().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalApplicationsCount.set(res.data.length);
          // Build personal activity timeline from real data
          this.buildPersonalActivityTimeline(res.data);
        }
      }
    });

    // 3. My posted opportunities count
    this.opportunityService.getMyPostedOpportunities().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalOpportunitiesCount.set(res.data.length);
        }
      }
    });

    // 4. Relations: utilisateurs suivis par l'utilisateur connecté
    if (u?.id) {
      this.followService.getStats(u.id).subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.totalRelationsCount.set(res.data.followingCount ?? 0);
          } else {
            this.totalRelationsCount.set(0);
          }
        },
        error: () => {
          this.totalRelationsCount.set(0);
        }
      });
    } else {
      this.totalRelationsCount.set(0);
    }
  }

  private buildPersonalActivityTimeline(applications: any[]): void {
    // Group applications by month
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const last6: ActivityMonthPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const yr = d.getFullYear();
      const mo = d.getMonth();

      const count = applications.filter(app => {
        if (!app.appliedAt && !app.createdAt) return false;
        const dt = new Date(app.appliedAt || app.createdAt);
        return dt.getFullYear() === yr && dt.getMonth() === mo;
      }).length;

      last6.push({ month: monthLabel, demandes: count, offres: 0, candidatures: count, heightPercent: 0 });
    }

    const maxVal = Math.max(...last6.map(p => p.demandes), 1);
    last6.forEach(p => { p.heightPercent = Math.round((p.demandes / maxVal) * 100); });
    this.activityTimeline.set(last6);
  }

  private calculateTopProjects(projects: Project[]): void {
    if (!projects || projects.length === 0) {
      // User has no projects yet → show empty/encouragement state
      this.topProjects.set([]);
      return;
    }

    // Sort by real viewsCount (descending), secondary sort by recognitionsCount
    const sorted = [...projects].sort((a, b) => {
      const vDiff = (b.viewsCount || 0) - (a.viewsCount || 0);
      if (vDiff !== 0) return vDiff;
      return (b.recognitionsCount || 0) - (a.recognitionsCount || 0);
    });
    const top3 = sorted.slice(0, 3);
    const colors = ['#10B981', '#06B6D4', '#8B5CF6'];

    // Map each project to top viewed item using real database views
    const maxRealViews = Math.max(...top3.map(p => p.viewsCount || 0));
    const highestScore = Math.max(maxRealViews, 1);

    const mapped: TopViewedProject[] = top3.map((p, idx) => {
      const views = p.viewsCount || 0;
      const percentage = maxRealViews > 0 ? Math.max(Math.round((views / highestScore) * 100), 5) : 5;
      return {
        id: p.id,
        title: p.title,
        category: p.projectType || (p.isOpenSource ? 'Open-Source' : 'Produit Pro'),
        stack: p.stack && p.stack.length ? p.stack.slice(0, 3) : ['Tech'],
        views: views,
        recognitions: p.recognitionsCount || 0,
        percentage: percentage,
        color: colors[idx % colors.length]
      };
    });

    this.topProjects.set(mapped);
  }

  setPeriod(filter: 'ALL' | 'MONTH' | 'WEEK'): void {
    this.activePeriodFilter.set(filter);
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

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 4000);
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

  getXpProgress(xp: number = 0): { percent: number; nextLevelXp: number; remainingXp: number; nextLevelTitle: string } {
    if (xp >= 3501) {
      return { percent: 100, nextLevelXp: 3501, remainingXp: 0, nextLevelTitle: 'Leader' };
    } else if (xp >= 1801) {
      const min = 1801, max = 3500;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 3501, remainingXp: 3501 - xp, nextLevelTitle: 'Leader' };
    } else if (xp >= 751) {
      const min = 751, max = 1800;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 1801, remainingXp: 1801 - xp, nextLevelTitle: 'Tech' };
    } else if (xp >= 251) {
      const min = 251, max = 750;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 751, remainingXp: 751 - xp, nextLevelTitle: 'Expert' };
    } else {
      const max = 250;
      const percent = Math.min(100, Math.max(0, Math.round((xp / max) * 100)));
      return { percent, nextLevelXp: 251, remainingXp: 251 - xp, nextLevelTitle: 'Senior' };
    }
  }
}
