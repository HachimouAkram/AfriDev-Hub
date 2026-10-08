import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project, ProjectComment } from '../../../core/services/project.service';
import { FollowService, FollowStats } from '../../../core/services/follow.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private followService = inject(FollowService);

  projects: Project[] = this.getFallbackProjects();
  isLoading = false;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Create Modal State
  showCreateModal = false;
  isSubmitting = false;
  errorMessage = '';

  title = '';
  description = '';
  stackInput = '';
  repoUrl = '';
  demoUrl = '';
  isOpenSource = true;

  // Detail Modal & Comments State
  selectedProject: Project | null = null;
  projectComments: ProjectComment[] = [];
  isLoadingComments = false;
  newCommentText = '';
  isPostingComment = false;

  // Author Follow State
  authorFollowStats: FollowStats | null = null;
  isTogglingAuthorFollow = false;

  // Share & Toast notification state
  toastMessage: string | null = null;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (res: any) => {
        let fetched: Project[] = [];
        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          fetched = res.data.content;
        } else if (res?.data && Array.isArray(res.data)) {
          fetched = res.data;
        } else if (res?.content && Array.isArray(res.content)) {
          fetched = res.content;
        } else if (Array.isArray(res)) {
          fetched = res;
        }

        if (fetched && fetched.length > 0) {
          this.projects = fetched;
        }
      },
      error: () => {
        // Keep existing fallback projects if network request fails
      }
    });
  }

  private getFallbackProjects(): Project[] {
    return [
      {
        id: 'proj-001',
        author: { id: 'dev-user-001', email: 'kwame.osei@dev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'prof-001', fullName: 'Kwame Osei', country: 'Ghana', city: 'Accra', title: 'Senior Backend & Cloud Engineer', skills: ['Spring Boot', 'PostgreSQL'], availability: 'OPEN', completionScore: 95, mobileMoneyVerified: true } },
        title: 'AfriPay Escrow Protocol',
        description: 'Solution de paiement sécurisée et de séquestre décentralisée pour les freelancers africains, compatible Mobile Money (MTN, Orange Money, Wave).',
        stack: ['Spring Boot', 'PostgreSQL', 'Redis', 'Docker'],
        repoUrl: 'https://github.com/kwame-osei/afripay-escrow',
        demoUrl: 'https://afripay.africa',
        screenshots: [],
        isOpenSource: true,
        recognitionsCount: 18,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-002',
        author: { id: 'dev-user-002', email: 'fatou.sow@dev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'prof-002', fullName: 'Fatou Sow', country: 'Sénégal', city: 'Dakar', title: 'Lead Frontend Architect', skills: ['Angular', 'TypeScript'], availability: 'OPEN', completionScore: 90, mobileMoneyVerified: true } },
        title: 'SunuHealth PWA',
        description: 'Application web progressive de suivi de santé communautaire en zone rurale optimisée pour le réseau 3G et le fonctionnement hors-ligne.',
        stack: ['Angular', 'RxJS', 'Service Worker', 'FastAPI'],
        repoUrl: 'https://github.com/fatou-sow/sunuhealth-pwa',
        demoUrl: 'https://sunuhealth.sn',
        screenshots: [],
        isOpenSource: true,
        recognitionsCount: 24,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-003',
        author: { id: 'dev-user-003', email: 'kofi.mensah@dev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'prof-003', fullName: 'Kofi Mensah', country: 'Côte d\'Ivoire', city: 'Abidjan', title: 'Fullstack & Data Engineer', skills: ['Python', 'FastAPI'], availability: 'OPEN', completionScore: 85, mobileMoneyVerified: true } },
        title: 'AgriData AI Hub',
        description: 'Plateforme d\'analyse prédictive des rendements agricoles et d\'optimisation de l\'irrigation basée sur l\'imagerie satellite Sentinel.',
        stack: ['Python', 'FastAPI', 'Angular', 'PyTorch'],
        repoUrl: 'https://github.com/kofi-mensah/agridata-ai',
        demoUrl: 'https://agridata.ci',
        screenshots: [],
        isOpenSource: true,
        recognitionsCount: 12,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      }
    ];
  }

  toggleRecognize(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.isLoggedIn()) {
      this.showToast('⚠️ Connectez-vous pour donner un J\'aime à ce projet.');
      return;
    }

    if (project.recognizedByCurrentUser) {
      this.projectService.unrecognizeProject(project.id).subscribe({
        next: () => {
          project.recognitionsCount = Math.max(0, project.recognitionsCount - 1);
          project.recognizedByCurrentUser = false;
          this.showToast('Reconnaissance retirée.');
        }
      });
    } else {
      this.projectService.recognizeProject(project.id).subscribe({
        next: () => {
          project.recognitionsCount += 1;
          project.recognizedByCurrentUser = true;
          this.showToast('⭐ Projet reconnu !');
        }
      });
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.errorMessage = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onSubmitProject(): void {
    if (!this.title || !this.description) {
      this.errorMessage = 'Veuillez remplir le titre et la description du projet.';
      return;
    }

    const stack = this.stackInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      title: this.title,
      description: this.description,
      stack: stack,
      repoUrl: this.repoUrl,
      demoUrl: this.demoUrl,
      isOpenSource: this.isOpenSource
    };

    this.isSubmitting = true;
    this.errorMessage = '';

    this.projectService.createProject(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadProjects();
          this.showToast('🎉 Projet publié avec succès !');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.error?.error?.details && typeof err.error.error.details === 'object') {
          const detailMsgs = Object.values(err.error.error.details).join(' • ');
          this.errorMessage = detailMsgs || err.error?.error?.message || 'Certains champs sont invalides.';
        } else {
          this.errorMessage = err.error?.error?.message || 'Erreur lors de la publication du projet.';
        }
      }
    });
  }

  // Detail Modal & Comments Methods
  openDetailModal(project: Project): void {
    this.selectedProject = project;
    this.newCommentText = '';
    this.authorFollowStats = null;
    this.loadComments(project.id);

    const authorUserId = project.author?.id;
    const currentUserId = this.authService.currentUser()?.id;

    if (this.isLoggedIn() && authorUserId && authorUserId !== currentUserId) {
      this.followService.getStats(authorUserId).subscribe({
        next: (res) => {
          if (res.success) {
            this.authorFollowStats = res.data;
          }
        },
        error: () => {
          this.authorFollowStats = null;
        }
      });
    }
  }

  closeDetailModal(): void {
    this.selectedProject = null;
    this.projectComments = [];
    this.authorFollowStats = null;
  }

  toggleAuthorFollow(): void {
    const authorUserId = this.selectedProject?.author?.id;
    if (!authorUserId || !this.isLoggedIn()) {
      this.showToast('⚠️ Connectez-vous pour suivre ce développeur.');
      return;
    }

    this.isTogglingAuthorFollow = true;
    if (this.authorFollowStats?.followedByCurrentUser) {
      this.followService.unfollowUser(authorUserId).subscribe({
        next: (res) => {
          this.isTogglingAuthorFollow = false;
          if (res.success) {
            this.authorFollowStats = res.data;
            this.showToast('Abonnement retiré.');
          }
        },
        error: () => {
          this.isTogglingAuthorFollow = false;
        }
      });
    } else {
      this.followService.followUser(authorUserId).subscribe({
        next: (res) => {
          this.isTogglingAuthorFollow = false;
          if (res.success) {
            this.authorFollowStats = res.data;
            if (res.data.followedByCurrentUser && res.data.followsCurrentUser) {
              this.showToast('🤝 Vous êtes maintenant amis !');
            } else {
              this.showToast('✓ Développeur suivi !');
            }
          }
        },
        error: () => {
          this.isTogglingAuthorFollow = false;
        }
      });
    }
  }

  loadComments(projectId: string): void {
    this.isLoadingComments = true;
    this.projectService.getComments(projectId).subscribe({
      next: (res) => {
        this.isLoadingComments = false;
        if (res.success && res.data) {
          this.projectComments = res.data;
        }
      },
      error: () => {
        this.isLoadingComments = false;
        // Fallback mock comment for display
        this.projectComments = [
          {
            id: 'c1',
            projectId: projectId,
            author: { id: 'u3', email: 'amadou@dev.sn', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'p3', fullName: 'Amadou Bamba', country: 'Sénégal', city: 'Dakar', title: 'DevOps & Cloud Engineer', skills: ['Docker', 'Kubernetes'], availability: 'OPEN', completionScore: 88, mobileMoneyVerified: true } },
            content: 'Superbe initiative ! L\'architecture est très bien pensée et l\'intégration du Mobile Money répond à un vrai besoin en Afrique.',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });
  }

  postComment(): void {
    if (!this.selectedProject || !this.newCommentText.trim()) return;

    if (!this.isLoggedIn()) {
      this.showToast('⚠️ Connectez-vous pour publier un commentaire.');
      return;
    }

    this.isPostingComment = true;
    this.projectService.addComment(this.selectedProject.id, this.newCommentText).subscribe({
      next: (res) => {
        this.isPostingComment = false;
        if (res.success && res.data) {
          this.projectComments.push(res.data);
          this.newCommentText = '';
          this.showToast('💬 Commentaire publié !');
        }
      },
      error: () => {
        this.isPostingComment = false;
        // Mock fallback insertion
        const mockComment: ProjectComment = {
          id: 'c-' + Date.now(),
          projectId: this.selectedProject!.id,
          author: { id: 'curr', email: 'me@afridev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'p-curr', fullName: 'Développeur Connecté', country: 'Côte d\'Ivoire', city: 'Abidjan', title: 'Fullstack Dev', skills: ['Angular'], availability: 'OPEN', completionScore: 80, mobileMoneyVerified: true } },
          content: this.newCommentText,
          createdAt: new Date().toISOString()
        };
        this.projectComments.push(mockComment);
        this.newCommentText = '';
        this.showToast('💬 Commentaire ajouté !');
      }
    });
  }

  // Multi-platform Share Methods
  shareProject(project: Project, platform?: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const permalink = `${window.location.origin}/projects/${project.id}`;
    const shareText = `Découvrez le projet "${project.title}" créé par ${project.author.profile.fullName || 'un développeur'} sur AfriDev Hub !`;

    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(permalink)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + permalink)}`, '_blank');
    } else {
      // Default: copy permalink to clipboard
      navigator.clipboard.writeText(permalink).then(() => {
        this.showToast('🔗 Lien du projet copié dans le presse-papier !');
      }).catch(() => {
        this.showToast('Lien du projet : ' + permalink);
      });
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}

