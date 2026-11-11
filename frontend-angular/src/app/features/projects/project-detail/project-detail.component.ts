import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project, ProjectComment, ProjectType } from '../../../core/services/project.service';
import { FollowService, FollowStats } from '../../../core/services/follow.service';
import { ProjectCollaborationService, ProjectMember, ProjectTask, ProjectProgress, TaskStatus } from '../../../core/services/project-collaboration.service';
import { PaymentService, PaymentProvider, PaymentMethod, PAYMENT_LOGOS } from '../../../core/services/payment.service';
import { AIService, AIAuditResult } from '../../../core/services/ai.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private followService = inject(FollowService);
  private collaborationService = inject(ProjectCollaborationService);
  private sanitizer = inject(DomSanitizer);
  private paymentService = inject(PaymentService);
  private aiService = inject(AIService);
  public translationService = inject(TranslationService);

  projectId: string | null = null;
  project: Project | null = null;
  isLoading = true;
  errorMessage = '';

  // Comments
  comments: ProjectComment[] = [];
  isLoadingComments = false;
  newCommentText = '';
  isPostingComment = false;

  // Author Follow
  authorFollowStats: FollowStats | null = null;
  isTogglingAuthorFollow = false;

  // Collaboration
  activeTab: 'overview' | 'collaboration' = 'overview';
  projectProgress: ProjectProgress | null = null;
  projectMembers: ProjectMember[] = [];
  projectTasks: ProjectTask[] = [];
  isLoadingCollabData = false;
  showApplyModal = false;
  applyRole = '';
  applyMessage = '';
  applyCvUrl = '';
  hasProfileCv = false;
  useProfileCv = true;
  uploadedCvName = '';
  isUploadingCv = false;
  cvUploadError = '';
  isSubmittingApply = false;

  // AI Translation & Audit
  isTranslating = false;
  translatedDescription: string | null = null;
  isAuditingProject = false;
  aiAuditResult: AIAuditResult | null = null;

  // Purchase & Payment
  readonly paymentLogos = PAYMENT_LOGOS;
  isProcessingPurchase = false;

  // Toast
  toastMessage: string | null = null;

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.loadProject(this.projectId);
    } else {
      this.errorMessage = 'Identifiant du projet manquant.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {}

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/projects']);
    }
  }

  loadProject(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.project = res.data;
          this.loadComments(id);
          this.loadCollaborationData(id);
          this.recordView(id);
          this.loadAuthorFollowStats();
        } else {
          this.errorMessage = 'Projet introuvable.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Impossible de charger ce projet.';
      }
    });
  }

  private recordView(id: string): void {
    this.projectService.recordView(id).subscribe({
      next: (res) => {
        if (res?.success && res.data && this.project) {
          this.project.viewsCount = res.data.viewsCount;
        }
      },
      error: () => {
        if (this.project) {
          this.project.viewsCount = (this.project.viewsCount || 0) + 1;
        }
      }
    });
  }

  private loadAuthorFollowStats(): void {
    const authorId = this.project?.author?.id;
    const currentUserId = this.authService.currentUser()?.id;
    if (this.isLoggedIn() && authorId && authorId !== currentUserId) {
      this.followService.getStats(authorId).subscribe({
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

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  t(key: string, fallback?: string): string {
    return this.translationService.t(key, fallback);
  }

  getYouTubeEmbedUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[2]}`);
    }
    return null;
  }

  getProjectTypeBadge(type?: ProjectType): { label: string; class: string } {
    switch (type) {
      case 'OPEN_SOURCE': return { label: 'Open Source', class: 'badge-emerald' };
      case 'COLLABORATIVE': return { label: 'Collaboratif', class: 'badge-teal' };
      case 'FOR_SALE': return { label: 'En Vente', class: 'badge-amber' };
      case 'SAAS': return { label: 'SaaS', class: 'badge-purple' };
      case 'PORTFOLIO': return { label: 'Portfolio', class: 'badge-blue' };
      case 'ENTERPRISE': return { label: 'Entreprise (NDA)', class: 'badge-slate' };
      default: return { label: 'Projet', class: 'badge-emerald' };
    }
  }

  getMediaUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `/api/v1${url}`;
    }
    if (url.startsWith('/api/v1')) {
      return url;
    }
    return `/api/v1/uploads/files/${url}`;
  }

  toggleRecognize(): void {
    if (!this.project) return;
    if (!this.isLoggedIn()) {
      this.showToast('Connectez-vous pour voter pour ce projet.');
      return;
    }

    if (this.project.recognizedByCurrentUser) {
      this.projectService.unrecognizeProject(this.project.id).subscribe({
        next: () => {
          if (this.project) {
            this.project.recognitionsCount = Math.max(0, this.project.recognitionsCount - 1);
            this.project.recognizedByCurrentUser = false;
            this.showToast('Reconnaissance retirée.');
          }
        }
      });
    } else {
      this.projectService.recognizeProject(this.project.id).subscribe({
        next: () => {
          if (this.project) {
            this.project.recognitionsCount += 1;
            this.project.recognizedByCurrentUser = true;
            this.showToast('Projet soutenu !');
          }
        }
      });
    }
  }

  toggleAuthorFollow(): void {
    const authorUserId = this.project?.author?.id;
    if (!authorUserId || !this.isLoggedIn()) {
      this.showToast('Connectez-vous pour suivre ce développeur.');
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
            this.showToast('Développeur suivi !');
          }
        },
        error: () => {
          this.isTogglingAuthorFollow = false;
        }
      });
    }
  }

  contactAuthor(inquiryType: 'BUY' | 'DEMO' | 'COLLAB'): void {
    if (!this.isLoggedIn()) {
      this.showToast('Veuillez vous connecter pour contacter le créateur.');
      return;
    }
    const authorId = this.project?.author?.id;
    if (!authorId || !this.project) return;

    let initialText = '';
    if (inquiryType === 'BUY') {
      initialText = `Bonjour, je suis intéressé(e) par l'achat de votre projet "${this.project.title}" (${this.project.price ? this.project.price + ' ' + (this.project.currency || 'XOF') : 'Prix sur demande'}) affiché sur AfriDev Hub.`;
    } else if (inquiryType === 'DEMO') {
      initialText = `Bonjour, je souhaiterais tester votre produit SaaS "${this.project.title}".`;
    } else {
      initialText = `Bonjour, j'ai vu votre projet "${this.project.title}" sur AfriDev Hub et je souhaite échanger avec vous.`;
    }

    this.router.navigate(['/dashboard/messages'], {
      queryParams: { user: authorId, text: initialText }
    });
  }

  buyWithSasPay(): void {
    if (!this.project) return;
    this.isProcessingPurchase = true;

    const currentUser = this.authService.currentUser();
    const customerPhone = currentUser?.profile?.whatsappNumber || '';
    const customerName = currentUser?.profile?.fullName || currentUser?.email || 'Acheteur AfriDev';
    const customerEmail = currentUser?.email || 'client@afridev.africa';

    this.paymentService.initiatePayment({
      targetType: 'PROJECT',
      targetId: this.project.id,
      provider: 'SASPAY',
      method: 'WAVE',
      customerPhone,
      customerName,
      customerEmail,
      country: 'SN'
    }).subscribe({
      next: (res) => {
        this.isProcessingPurchase = false;
        const targetUrl = res.paymentUrl || `https://link.saspay.me/bpz950t0zto?amount=${res.totalBuyerAmount}&reference=${res.orderNumber}`;
        window.location.href = targetUrl;
      },
      error: () => {
        this.isProcessingPurchase = false;
        const total = Math.round((this.project?.price || 0) * 1.07);
        window.location.href = `https://link.saspay.me/bpz950t0zto?amount=${total}&reference=ORD-${this.project?.id}`;
      }
    });
  }

  canContactWhatsApp(): boolean {
    const prof = this.project?.author?.profile;
    return !!(prof && (prof.whatsappEnabled || prof.whatsappNumber));
  }

  openWhatsApp(): void {
    if (!this.project) return;
    const prof = this.project.author?.profile;
    const phone = prof?.whatsappNumber || prof?.phone;
    if (!phone) {
      this.showToast('Numéro WhatsApp non renseigné par le développeur.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const authorName = prof?.fullName || 'Développeur';
    const msg = encodeURIComponent(
      `Bonjour ${authorName}, j'ai vu votre projet "${this.project.title}" sur AfriDev Hub et je souhaite échanger avec vous !`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  translateDescription(): void {
    if (!this.project) return;
    if (this.translatedDescription) {
      this.translatedDescription = null;
      return;
    }
    this.isTranslating = true;
    const currentLang = this.translationService.currentLang().code;
    this.aiService.translate(this.project.description, currentLang).subscribe({
      next: (res) => {
        this.isTranslating = false;
        this.translatedDescription = res;
        this.showToast('Description traduite en ' + this.translationService.currentLang().label);
      },
      error: () => {
        this.isTranslating = false;
        this.showToast('Traduction temporairement indisponible.');
      }
    });
  }

  runAIAudit(): void {
    if (!this.project) return;
    this.isAuditingProject = true;
    this.aiAuditResult = null;

    this.aiService.auditProject(
      this.project.repoUrl || '',
      this.project.title,
      this.project.description,
      this.project.stack || []
    ).subscribe({
      next: (res) => {
        this.isAuditingProject = false;
        this.aiAuditResult = res;
      },
      error: () => {
        this.isAuditingProject = false;
        this.showToast('Audit IA indisponible pour le moment.');
      }
    });
  }

  closeAIAudit(): void {
    this.aiAuditResult = null;
  }

  shareProject(platform?: string): void {
    if (!this.project) return;
    const permalink = window.location.href;
    const shareText = `Découvrez le projet "${this.project.title}" sur AfriDev Hub !`;

    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(permalink)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + permalink)}`, '_blank');
    } else {
      navigator.clipboard.writeText(permalink).then(() => {
        this.showToast('Lien du projet copié dans le presse-papier !');
      }).catch(() => {
        this.showToast('Lien du projet : ' + permalink);
      });
    }
  }

  loadComments(projectId: string): void {
    this.isLoadingComments = true;
    this.projectService.getComments(projectId).subscribe({
      next: (res) => {
        this.isLoadingComments = false;
        if (res.success && res.data) {
          this.comments = res.data;
        }
      },
      error: () => {
        this.isLoadingComments = false;
      }
    });
  }

  postComment(): void {
    if (!this.project || !this.newCommentText.trim()) return;
    if (!this.isLoggedIn()) {
      this.showToast('Connectez-vous pour publier un commentaire.');
      return;
    }

    this.isPostingComment = true;
    this.projectService.addComment(this.project.id, this.newCommentText).subscribe({
      next: (res) => {
        this.isPostingComment = false;
        if (res.success && res.data) {
          this.comments.push(res.data);
          this.newCommentText = '';
          this.showToast('Commentaire publié !');
        }
      },
      error: () => {
        this.isPostingComment = false;
        this.showToast('Erreur lors de l\'envoi du commentaire.');
      }
    });
  }

  // Collaboration Methods
  loadCollaborationData(projectId: string): void {
    this.isLoadingCollabData = true;
    this.collaborationService.getProgress(projectId).subscribe({
      next: (res) => {
        if (res.success) this.projectProgress = res.data;
      },
      error: () => {}
    });

    this.collaborationService.getMembers(projectId).subscribe({
      next: (res) => {
        if (res.success) this.projectMembers = res.data;
      },
      error: () => {}
    });

    this.collaborationService.getTasks(projectId).subscribe({
      next: (res) => {
        this.isLoadingCollabData = false;
        if (res.success) this.projectTasks = res.data;
      },
      error: () => {
        this.isLoadingCollabData = false;
      }
    });
  }

  filterTasksByStatus(status: TaskStatus): ProjectTask[] {
    return this.projectTasks.filter(t => t.status === status);
  }

  isCurrentUserLead(): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    return !!(currentUserId && this.project?.author?.id === currentUserId);
  }

  isCurrentUserMember(): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return false;
    return this.projectMembers.some(m => m.userId === currentUserId && m.status === 'ACCEPTED');
  }

  isCurrentUserPendingMember(): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return false;
    return this.projectMembers.some(m => m.userId === currentUserId && m.status === 'PENDING');
  }

  openApplyModal(): void {
    if (!this.isLoggedIn()) {
      this.showToast('Connectez-vous pour postuler à ce projet.');
      this.router.navigate(['/login']);
      return;
    }
    this.applyRole = '';
    this.applyMessage = '';
    this.cvUploadError = '';
    this.isUploadingCv = false;

    const profileCv = this.authService.currentUser()?.profile?.cvUrl;
    if (profileCv && profileCv.trim()) {
      this.applyCvUrl = profileCv;
      this.hasProfileCv = true;
      this.useProfileCv = true;
      this.uploadedCvName = 'Mon_CV_Profil.pdf';
    } else {
      this.applyCvUrl = '';
      this.hasProfileCv = false;
      this.useProfileCv = false;
      this.uploadedCvName = '';
    }

    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  toggleReplaceCv(): void {
    this.useProfileCv = false;
    this.applyCvUrl = '';
    this.uploadedCvName = '';
  }

  reuseProfileCv(): void {
    const profileCv = this.authService.currentUser()?.profile?.cvUrl;
    if (profileCv) {
      this.applyCvUrl = profileCv;
      this.useProfileCv = true;
      this.uploadedCvName = 'Mon_CV_Profil.pdf';
    }
  }

  removeUploadedCv(): void {
    this.applyCvUrl = '';
    this.uploadedCvName = '';
  }

  onCvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.cvUploadError = 'Veuillez sélectionner un fichier PDF valide.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.cvUploadError = 'Le fichier est trop volumineux (max 10 Mo).';
      return;
    }

    this.isUploadingCv = true;
    this.cvUploadError = '';

    this.projectService.uploadPdf(file).subscribe({
      next: (res) => {
        this.isUploadingCv = false;
        if (res.success && res.data?.url) {
          this.applyCvUrl = res.data.url;
          this.uploadedCvName = file.name;
          this.useProfileCv = false;
          this.showToast('CV PDF téléversé avec succès !');
        }
      },
      error: (err) => {
        this.isUploadingCv = false;
        this.cvUploadError = err.error?.error?.message || 'Erreur lors du téléversement du CV.';
      }
    });
  }

  submitApplication(): void {
    if (!this.project || !this.applyRole.trim()) return;

    this.isSubmittingApply = true;
    this.collaborationService.applyToJoin(
      this.project.id,
      this.applyRole,
      this.applyMessage,
      this.applyCvUrl
    ).subscribe({
      next: (res) => {
        this.isSubmittingApply = false;
        if (res.success) {
          this.showApplyModal = false;
          this.showToast('Candidature envoyée avec succès !');
          this.loadCollaborationData(this.project!.id);
        }
      },
      error: (err) => {
        this.isSubmittingApply = false;
        this.showToast(err.error?.error?.message || 'Erreur lors de l\'envoi.');
      }
    });
  }

  updateTaskStatus(task: ProjectTask, newStatus: TaskStatus): void {
    if (!this.project) return;
    const prevStatus = task.status;
    task.status = newStatus;
    this.collaborationService.updateTask(this.project.id, task.id, { status: newStatus }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`Statut mis à jour : ${newStatus}`);
          this.loadCollaborationData(this.project!.id);
        }
      },
      error: (err) => {
        task.status = prevStatus;
        this.showToast(err.error?.error?.message || 'Erreur de mise à jour.');
      }
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}

