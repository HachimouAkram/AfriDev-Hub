import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectService, Project, ProjectComment, ProjectType, SaleType, SaasPricingType } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FollowService, FollowStats } from '../../../../core/services/follow.service';
import { ProjectCollaborationService, ProjectMember, ProjectTask, ProjectProgress, TaskStatus, TaskPriority, MemberStatus } from '../../../../core/services/project-collaboration.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { compressImage } from '../../../../core/utils/upload-helper';

@Component({
  selector: 'app-dashboard-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-projects.component.html',
  styleUrl: './dashboard-projects.component.css'
})
export class DashboardProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private followService = inject(FollowService);
  private collaborationService = inject(ProjectCollaborationService);
  private profileService = inject(ProfileService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentUser = this.authService.currentUser;
  
  projects = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);
  
  isLoading = signal<boolean>(true);
  searchQuery = '';
  selectedCategory: string = 'ALL';

  // Modals state
  showCreateModal = false;
  showEditModal = false;
  showDetailModal = false;
  showDeleteModal = false;

  selectedProject: Project | null = null;
  projectToDelete: Project | null = null;

  // Detail Modal & Comments State
  projectComments: ProjectComment[] = [];
  isLoadingComments = false;
  newCommentText = '';
  isPostingComment = false;

  // Author Follow State
  authorFollowStats: FollowStats | null = null;
  isTogglingAuthorFollow = false;

  // Toast State
  toastMessage: string | null = null;

  // Project Types definition
  projectTypesList: { key: ProjectType; label: string; icon: string; desc: string }[] = [
    { key: 'OPEN_SOURCE', label: 'Open Source', icon: 'ri-flashlight-line', desc: 'Code source public avec licence libre' },
    { key: 'COLLABORATIVE', label: 'Projet Collaboratif', icon: 'ri-team-line', desc: 'Idée de projet, recrutement d\'équipe & gestion de tâches' },
    { key: 'FOR_SALE', label: 'Projet en Vente', icon: 'ri-money-dollar-circle-line', desc: 'Cession de code ou d\'application' },
    { key: 'SAAS', label: 'Projet SaaS', icon: 'ri-rocket-line', desc: 'Service web hébergé avec abonnement' },
    { key: 'PORTFOLIO', label: 'Site / Portfolio', icon: 'ri-briefcase-line', desc: 'Vitrine de présentation personnelle' },
    { key: 'ENTERPRISE', label: 'Projet Entreprise', icon: 'ri-building-line', desc: 'Réalisation pro sous contrat NDA' }
  ];

  // Collaboration Manager Modal State
  showCollabModal = false;
  collabProject: Project | null = null;
  collabProgress: ProjectProgress | null = null;
  collabMembers: ProjectMember[] = [];
  collabTasks: ProjectTask[] = [];
  isLoadingCollab = false;
  collabTab: 'tasks' | 'team' = 'tasks';

  // Task Details Modal State
  selectedTaskForDetail: ProjectTask | null = null;
  showTaskDetailModal = false;

  // Task Rejection Modal State (Chef de Projet)
  showRejectModal = false;
  taskToReject: ProjectTask | null = null;
  rejectionReasonInput = '';
  isRejectingTask = false;

  // Lead Filter by Developer
  selectedDevFilter = 'ALL';

  // Task creation state
  newTask = {
    title: '',
    description: '',
    assignedToId: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'TODO' as TaskStatus,
    dueDate: ''
  };
  isCreatingTask = false;

  // Form Model
  projectForm = {
    title: '',
    description: '',
    stackInput: '',
    repoUrl: '',
    demoUrl: '',
    isOpenSource: true,
    projectType: 'OPEN_SOURCE' as ProjectType,
    price: null as number | null,
    currency: 'XOF',
    saleType: 'FULL_SOURCE_CODE' as SaleType,
    saasPricingType: 'FREEMIUM' as SaasPricingType,
    licenseType: 'MIT',
    demoAccountInfo: '',
    companyName: '',
    companyRole: '',
    youtubeUrl: '',
    documentationPdfUrl: '',
    screenshots: [] as string[],
    maxMembers: null as number | null
  };

  isSubmitting = false;
  isUploadingMedia = false;
  formErrorMessage = '';
  formSuccessMessage = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('create') === 'true') {
        const typeParam = params.get('type') as ProjectType;
        setTimeout(() => {
          this.openCreateModal();
          if (typeParam) {
            this.selectProjectType(typeParam);
          }
        }, 150);
      }

      const cat = params.get('category');
      if (cat) {
        this.selectedCategory = cat;
      }

      const collabId = params.get('openCollab');
      if (collabId) {
        setTimeout(() => {
          const found = this.projects().find(p => p.id === collabId);
          if (found) {
            this.openCollabModal(found);
          } else {
            this.projectService.getProjectById(collabId).subscribe({
              next: (res) => {
                if (res.success && res.data) {
                  this.openCollabModal(res.data);
                }
              }
            });
          }
        }, 400);
      }
    });
    this.loadMyProjects();
  }

  loadMyProjects(): void {
    this.isLoading.set(true);
    this.projectService.getMyProjects(0, 50).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const content = res.data.content || res.data;
          this.projects.set(content);
          this.applyFilter();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur chargement projets:', err);
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    let result = this.projects();

    if (this.selectedCategory !== 'ALL') {
      result = result.filter(p => (p.projectType || 'OPEN_SOURCE') === this.selectedCategory);
    }

    if (q) {
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.companyName && p.companyName.toLowerCase().includes(q)) ||
        (p.stack && p.stack.some(s => s.toLowerCase().includes(q)))
      );
    }

    this.filteredProjects.set(result);
  }

  selectProjectType(type: ProjectType): void {
    this.projectForm.projectType = type;
    if (type === 'OPEN_SOURCE') {
      this.projectForm.isOpenSource = true;
    } else {
      this.projectForm.isOpenSource = false;
    }
  }

  // --- ACTIONS ---

  openCreateModal(): void {
    this.resetForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  resetForm(): void {
    this.projectForm = {
      title: '',
      description: '',
      stackInput: '',
      repoUrl: '',
      demoUrl: '',
      isOpenSource: true,
      projectType: 'OPEN_SOURCE',
      price: null,
      currency: 'XOF',
      saleType: 'FULL_SOURCE_CODE',
      saasPricingType: 'FREEMIUM',
      licenseType: 'MIT',
      demoAccountInfo: '',
      companyName: '',
      companyRole: '',
      youtubeUrl: '',
      documentationPdfUrl: '',
      screenshots: [],
      maxMembers: null
    };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }

  async onImageSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    if (this.projectForm.screenshots.length >= 5) {
      this.formErrorMessage = 'Nombre maximal de 5 captures atteint.';
      this.showToast(this.formErrorMessage);
      return;
    }

    this.isUploadingMedia = true;
    this.formErrorMessage = '';

    try {
      // Compression automatique côté client pour éviter la limite 4.5 Mo de Vercel (413) et accélérer l'envoi
      const fileToUpload = await compressImage(file);

      this.projectService.uploadImage(fileToUpload).subscribe({
        next: (res) => {
          this.isUploadingMedia = false;
          if (res.success && res.data?.url) {
            this.projectForm.screenshots.push(res.data.url);
            this.showToast('Capture d\'écran téléversée avec succès !');
          }
        },
        error: (err) => {
          this.isUploadingMedia = false;
          if (err.status === 413) {
            this.formErrorMessage = 'Le fichier est trop volumineux (413). Veuillez choisir une image plus légère.';
          } else if (err.status === 502) {
            this.formErrorMessage = 'Le serveur est temporairement inaccessible (502). Veuillez réessayer dans un instant.';
          } else {
            this.formErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors du téléversement de l\'image.';
          }
          this.showToast(this.formErrorMessage);
        }
      });
    } catch {
      this.isUploadingMedia = false;
      this.formErrorMessage = 'Erreur lors du traitement de l\'image.';
      this.showToast(this.formErrorMessage);
    }
  }

  removeScreenshot(index: number): void {
    this.projectForm.screenshots.splice(index, 1);
  }

  onPdfSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.formErrorMessage = 'Le document PDF dépasse la taille maximale autorisée de 10 Mo.';
      this.showToast(this.formErrorMessage);
      return;
    }

    this.isUploadingMedia = true;
    this.formErrorMessage = '';

    this.projectService.uploadPdf(file).subscribe({
      next: (res) => {
        this.isUploadingMedia = false;
        if (res.success && res.data?.url) {
          this.projectForm.documentationPdfUrl = res.data.url;
          this.showToast('Document PDF téléversé avec succès !');
        }
      },
      error: (err) => {
        this.isUploadingMedia = false;
        if (err.status === 413) {
          this.formErrorMessage = 'Le document PDF est trop volumineux pour le réseau (413).';
        } else if (err.status === 502) {
          this.formErrorMessage = 'Le serveur est temporairement inaccessible (502). Veuillez réessayer.';
        } else {
          this.formErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors du téléversement du PDF.';
        }
        this.showToast(this.formErrorMessage);
      }
    });
  }

  removePdf(): void {
    this.projectForm.documentationPdfUrl = '';
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

  validateForm(): boolean {
    if (!this.projectForm.title || !this.projectForm.title.trim()) {
      this.formErrorMessage = 'Le titre du projet est obligatoire.';
      this.showToast(this.formErrorMessage);
      return false;
    }
    if (!this.projectForm.description || this.projectForm.description.trim().length < 10) {
      this.formErrorMessage = 'La description doit contenir au moins 10 caractères.';
      this.showToast(this.formErrorMessage);
      return false;
    }

    const type = this.projectForm.projectType;

    if (type === 'COLLABORATIVE') {
      if (!this.projectForm.stackInput || !this.projectForm.stackInput.trim()) {
        this.formErrorMessage = 'Veuillez renseigner les technologies / stack requises pour ce projet collaboratif.';
        this.showToast(this.formErrorMessage);
        return false;
      }
      if (this.projectForm.maxMembers !== null && this.projectForm.maxMembers !== undefined && Number(this.projectForm.maxMembers) < 1) {
        this.formErrorMessage = 'Le nombre maximum de collaborateurs doit être supérieur ou égal à 1 s\'il est renseigné.';
        this.showToast(this.formErrorMessage);
        return false;
      }
      this.projectForm.youtubeUrl = '';
    } else if (type === 'OPEN_SOURCE') {
      if (!this.projectForm.repoUrl || !this.projectForm.repoUrl.trim()) {
        this.formErrorMessage = 'Le lien du dépôt GitHub est obligatoire pour un projet Open Source.';
        this.showToast(this.formErrorMessage);
        return false;
      }
    } else if (type === 'FOR_SALE') {
      if (this.projectForm.price === null || this.projectForm.price === undefined || this.projectForm.price < 0) {
        this.formErrorMessage = 'Le prix de vente est obligatoire et doit être supérieur ou égal à 0.';
        this.showToast(this.formErrorMessage);
        return false;
      }
    } else if (type === 'SAAS') {
      if (!this.projectForm.demoUrl || !this.projectForm.demoUrl.trim()) {
        this.formErrorMessage = 'Le lien de l\'application en ligne est obligatoire pour un SaaS.';
        this.showToast(this.formErrorMessage);
        return false;
      }
    } else if (type === 'PORTFOLIO') {
      if (!this.projectForm.demoUrl || !this.projectForm.demoUrl.trim()) {
        this.formErrorMessage = 'Le lien du site est obligatoire pour un projet Portfolio.';
        this.showToast(this.formErrorMessage);
        return false;
      }
    } else if (type === 'ENTERPRISE') {
      if (!this.projectForm.companyName || !this.projectForm.companyName.trim()) {
        this.formErrorMessage = 'Le nom de l\'entreprise est obligatoire pour un projet d\'entreprise.';
        this.showToast(this.formErrorMessage);
        return false;
      }
      if (!this.projectForm.companyRole || !this.projectForm.companyRole.trim()) {
        this.formErrorMessage = 'Votre rôle est obligatoire pour un projet d\'entreprise.';
        this.showToast(this.formErrorMessage);
        return false;
      }
    }

    if (this.projectForm.youtubeUrl && this.projectForm.youtubeUrl.trim()) {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
      if (!ytRegex.test(this.projectForm.youtubeUrl.trim())) {
        this.formErrorMessage = 'Le lien YouTube n\'est pas valide (Ex: https://www.youtube.com/watch?v=VIDEO_ID).';
        this.showToast(this.formErrorMessage);
        return false;
      }
    }

    return true;
  }

  submitCreate(): void {
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    this.formErrorMessage = '';

    const stack = (this.projectForm.stackInput || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      title: this.projectForm.title.trim(),
      description: this.projectForm.description.trim(),
      stack: stack,
      repoUrl: this.projectForm.projectType === 'ENTERPRISE' ? null : (this.projectForm.repoUrl?.trim() || null),
      demoUrl: this.projectForm.demoUrl?.trim() || null,
      isOpenSource: this.projectForm.isOpenSource,
      projectType: this.projectForm.projectType,
      price: this.projectForm.price !== null && this.projectForm.price !== undefined ? Number(this.projectForm.price) : null,
      currency: this.projectForm.currency,
      saleType: this.projectForm.saleType,
      saasPricingType: this.projectForm.saasPricingType,
      licenseType: this.projectForm.licenseType,
      demoAccountInfo: this.projectForm.demoAccountInfo?.trim() || null,
      companyName: this.projectForm.companyName?.trim() || null,
      companyRole: this.projectForm.companyRole?.trim() || null,
      youtubeUrl: this.projectForm.projectType === 'COLLABORATIVE' ? null : (this.projectForm.youtubeUrl?.trim() || null),
      documentationPdfUrl: this.projectForm.documentationPdfUrl || null,
      screenshots: this.projectForm.screenshots,
      maxMembers: this.projectForm.maxMembers ? Number(this.projectForm.maxMembers) : null
    };

    this.projectService.createProject(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadMyProjects();
          this.showToast('Projet publié avec succès !');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.error?.error?.details && typeof err.error.error.details === 'object') {
          this.formErrorMessage = Object.values(err.error.error.details).join(' • ');
        } else {
          this.formErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors de la création du projet.';
        }
        this.showToast(this.formErrorMessage);
      }
    });
  }

  openEditModal(project: Project): void {
    if (!this.isProjectOwner(project)) {
      this.showToast('Action réservée au porteur du projet.');
      return;
    }
    this.selectedProject = project;
    this.projectForm = {
      title: project.title,
      description: project.description,
      stackInput: project.stack ? project.stack.join(', ') : '',
      repoUrl: project.repoUrl || '',
      demoUrl: project.demoUrl || '',
      isOpenSource: project.isOpenSource || false,
      projectType: project.projectType || 'OPEN_SOURCE',
      price: project.price !== undefined ? project.price : null,
      currency: project.currency || 'XOF',
      saleType: project.saleType || 'FULL_SOURCE_CODE',
      saasPricingType: project.saasPricingType || 'FREEMIUM',
      licenseType: project.licenseType || 'MIT',
      demoAccountInfo: project.demoAccountInfo || '',
      companyName: project.companyName || '',
      companyRole: project.companyRole || '',
      youtubeUrl: project.youtubeUrl || '',
      documentationPdfUrl: project.documentationPdfUrl || '',
      screenshots: project.screenshots ? [...project.screenshots] : [],
      maxMembers: project.maxMembers || null
    };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProject = null;
  }

  submitEdit(): void {
    if (!this.selectedProject) return;
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    this.formErrorMessage = '';

    const stack = this.projectForm.stackInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      title: this.projectForm.title.trim(),
      description: this.projectForm.description.trim(),
      stack: stack,
      repoUrl: this.projectForm.projectType === 'ENTERPRISE' ? null : (this.projectForm.repoUrl.trim() || null),
      demoUrl: this.projectForm.demoUrl.trim() || null,
      isOpenSource: this.projectForm.isOpenSource,
      projectType: this.projectForm.projectType,
      price: this.projectForm.price,
      currency: this.projectForm.currency,
      saleType: this.projectForm.saleType,
      saasPricingType: this.projectForm.saasPricingType,
      licenseType: this.projectForm.licenseType,
      demoAccountInfo: this.projectForm.demoAccountInfo.trim() || null,
      companyName: this.projectForm.companyName.trim() || null,
      companyRole: this.projectForm.companyRole.trim() || null,
      youtubeUrl: this.projectForm.youtubeUrl.trim() || null,
      documentationPdfUrl: this.projectForm.documentationPdfUrl || null,
      screenshots: this.projectForm.screenshots
    };

    this.projectService.updateProject(this.selectedProject.id, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeEditModal();
          this.loadMyProjects();
          this.showToast('Projet mis à jour avec succès !');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.error?.error?.details && typeof err.error.error.details === 'object') {
          this.formErrorMessage = Object.values(err.error.error.details).join(' • ');
        } else {
          this.formErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors de la mise à jour du projet.';
        }
        this.showToast(this.formErrorMessage);
      }
    });
  }

  openDetailModal(project: Project): void {
    this.selectedProject = project;
    this.showDetailModal = true;
    this.newCommentText = '';
    this.authorFollowStats = null;
    this.loadComments(project.id);

    // Charger les informations complètes et fraîches du projet depuis le serveur
    this.projectService.getProjectById(project.id, true).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.selectedProject = { ...this.selectedProject, ...res.data };
        }
      },
      error: (err) => console.warn('Impossible de rafraîchir les détails du projet :', err)
    });

    const authorUserId = project.author?.id;
    const currentUserId = this.authService.currentUser()?.id;

    if (this.authService.isLoggedIn() && authorUserId && authorUserId !== currentUserId) {
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
    this.showDetailModal = false;
    this.selectedProject = null;
    this.projectComments = [];
    this.authorFollowStats = null;
  }

  toggleRecognize(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.authService.isLoggedIn()) {
      this.showToast('Connectez-vous pour donner un J\'aime à ce projet.');
      return;
    }

    if (project.recognizedByCurrentUser) {
      this.projectService.unrecognizeProject(project.id).subscribe({
        next: () => {
          project.recognitionsCount = Math.max(0, (project.recognitionsCount || 1) - 1);
          project.recognizedByCurrentUser = false;
          this.showToast('Reconnaissance retirée.');
        }
      });
    } else {
      this.projectService.recognizeProject(project.id).subscribe({
        next: () => {
          project.recognitionsCount = (project.recognitionsCount || 0) + 1;
          project.recognizedByCurrentUser = true;
          this.showToast('Projet reconnu !');
        }
      });
    }
  }

  toggleAuthorFollow(): void {
    const authorUserId = this.selectedProject?.author?.id;
    if (!authorUserId || !this.authService.isLoggedIn()) {
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
            if (res.data.followedByCurrentUser && res.data.followsCurrentUser) {
              this.showToast('Vous êtes maintenant amis !');
            } else {
              this.showToast('Développeur suivi !');
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
        this.projectComments = [];
      }
    });
  }

  postComment(): void {
    if (!this.selectedProject || !this.newCommentText.trim()) return;

    if (!this.authService.isLoggedIn()) {
      this.showToast('Connectez-vous pour publier un commentaire.');
      return;
    }

    this.isPostingComment = true;
    this.projectService.addComment(this.selectedProject.id, this.newCommentText).subscribe({
      next: (res) => {
        this.isPostingComment = false;
        if (res.success && res.data) {
          this.projectComments.push(res.data);
          this.newCommentText = '';
          this.showToast('Commentaire publié !');
        }
      },
      error: () => {
        this.isPostingComment = false;
        this.showToast('Erreur lors de la publication du commentaire.');
      }
    });
  }

  contactAuthorForProject(project: Project, inquiryType: 'BUY' | 'DEMO' | 'COLLAB'): void {
    if (!this.authService.isLoggedIn()) {
      this.showToast('Veuillez vous connecter pour contacter le créateur du projet.');
      return;
    }

    const authorId = project.author?.id;
    if (!authorId) return;

    let initialText = '';
    if (inquiryType === 'BUY') {
      initialText = `Bonjour, je suis intéressé(e) par l'achat de votre projet "${project.title}" (${project.price ? project.price + ' ' + (project.currency || 'XOF') : 'Prix sur demande'}) affiché sur AfriDev Hub. Pouvons-nous échanger sur les modalités ?`;
    } else if (inquiryType === 'DEMO') {
      initialText = `Bonjour, je souhaiterais tester votre produit SaaS "${project.title}". Pouvez-vous me partager un compte de test ou une démonstration ?`;
    } else {
      initialText = `Bonjour, j'ai vu votre réalisation "${project.title}" (${project.companyName || 'Projet Pro'}) sur AfriDev Hub et j'aimerais entrer en contact avec vous.`;
    }

    this.closeDetailModal();
    this.router.navigate(['/dashboard/messages'], {
      queryParams: {
        user: authorId,
        text: initialText
      }
    });
  }

  shareProject(project: Project, platform?: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const permalink = `${window.location.origin}/projects/${project.id}`;
    const authorName = project.author?.profile?.fullName || 'un développeur';
    const shareText = `Découvrez le projet "${project.title}" créé par ${authorName} sur AfriDev Hub !`;

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

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  getYouTubeEmbedUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      const videoId = match[2];
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    }
    return null;
  }

  getProjectTypeBadge(type?: ProjectType): { label: string; class: string } {
    switch (type) {
      case 'OPEN_SOURCE':
        return { label: 'Open Source', class: 'badge-emerald' };
      case 'COLLABORATIVE':
        return { label: 'Collaboratif', class: 'badge-teal' };
      case 'FOR_SALE':
        return { label: 'En Vente', class: 'badge-amber' };
      case 'SAAS':
        return { label: 'SaaS', class: 'badge-purple' };
      case 'PORTFOLIO':
        return { label: 'Portfolio', class: 'badge-blue' };
      case 'ENTERPRISE':
        return { label: 'Entreprise (NDA)', class: 'badge-slate' };
      default:
        return { label: 'Open Source', class: 'badge-emerald' };
    }
  }

  getSaleTypeLabel(type?: string | SaleType): string {
    switch (type) {
      case 'FULL_SOURCE_CODE':
        return 'Code source complet (Cession intégrale)';
      case 'LICENSED':
        return 'Licence d\'exploitation commerciale';
      case 'EXCLUSIVE_CESSION':
        return 'Cession exclusive de propriété';
      default:
        return type || 'Code source complet';
    }
  }

  getSaasPricingLabel(type?: string | SaasPricingType): string {
    switch (type) {
      case 'FREE':
        return '100% Gratuit';
      case 'FREEMIUM':
        return 'Freemium';
      case 'PAID_SUBSCRIPTION':
        return 'Abonnement Payant';
      default:
        return type || 'Freemium';
    }
  }

  toggleStatus(project: Project): void {
    if (!this.isProjectOwner(project)) {
      this.showToast('Action réservée au porteur du projet.');
      return;
    }
    this.projectService.toggleProjectStatus(project.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMyProjects();
        }
      },
      error: (err) => {
        console.error('Erreur changement statut:', err);
      }
    });
  }

  confirmDelete(project: Project): void {
    if (!this.isProjectOwner(project)) {
      this.showToast('Action réservée au porteur du projet.');
      return;
    }
    this.projectToDelete = project;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.projectToDelete = null;
  }

  executeDelete(): void {
    if (!this.projectToDelete) return;

    this.projectService.deleteProject(this.projectToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadMyProjects();
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.closeDeleteModal();
      }
    });
  }

  // ── COLLABORATION LEAD MANAGER METHODS ──

  openCollabModal(project: Project): void {
    this.collabProject = project;
    this.showCollabModal = true;
    this.collabTab = 'tasks';
    this.loadCollabData(project.id);
  }

  closeCollabModal(): void {
    this.showCollabModal = false;
    this.collabProject = null;
    this.collabProgress = null;
    this.collabMembers = [];
    this.collabTasks = [];
  }

  loadCollabData(projectId: string): void {
    this.isLoadingCollab = true;
    this.collaborationService.getProgress(projectId).subscribe({
      next: (res) => {
        if (res.success) this.collabProgress = res.data;
      }
    });

    this.collaborationService.getMembers(projectId).subscribe({
      next: (res) => {
        if (res.success) this.collabMembers = res.data;
      }
    });

    this.collaborationService.getTasks(projectId).subscribe({
      next: (res) => {
        this.isLoadingCollab = false;
        if (res.success) this.collabTasks = res.data;
      },
      error: () => {
        this.isLoadingCollab = false;
      }
    });
  }

  onCreateTask(): void {
    if (!this.collabProject || !this.newTask.title.trim()) return;

    this.isCreatingTask = true;
    const payload = {
      title: this.newTask.title.trim(),
      description: this.newTask.description?.trim() || undefined,
      assignedToId: this.newTask.assignedToId || undefined,
      priority: this.newTask.priority,
      status: this.newTask.status,
      dueDate: this.newTask.dueDate || undefined
    };

    this.collaborationService.createTask(this.collabProject.id, payload).subscribe({
      next: (res) => {
        this.isCreatingTask = false;
        if (res.success) {
          this.showToast('Nouvelle tâche assignée avec succès !');
          this.newTask = {
            title: '',
            description: '',
            assignedToId: '',
            priority: 'MEDIUM',
            status: 'TODO',
            dueDate: ''
          };
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.isCreatingTask = false;
        const msg = err.error?.error?.message || 'Erreur lors de la création de la tâche.';
        this.showToast(msg);
      }
    });
  }

  isProjectOwner(project: Project | null | undefined): boolean {
    if (!project) return false;
    const user = this.currentUser();
    if (!user) return false;
    if (project.author) {
      if (user.id && project.author.id && project.author.id === user.id) return true;
      if (user.email && project.author.email && project.author.email.toLowerCase() === user.email.toLowerCase()) return true;
    }
    return false;
  }

  isProjectLead(): boolean {
    if (!this.collabProject) return false;
    return this.isProjectOwner(this.collabProject) || !!this.collabProgress?.isProjectLead;
  }

  openTaskDetail(task: ProjectTask): void {
    this.selectedTaskForDetail = task;
    this.showTaskDetailModal = true;
  }

  closeTaskDetail(): void {
    this.showTaskDetailModal = false;
    this.selectedTaskForDetail = null;
  }

  openRejectModal(task: ProjectTask): void {
    this.taskToReject = task;
    this.rejectionReasonInput = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.taskToReject = null;
    this.rejectionReasonInput = '';
    this.isRejectingTask = false;
  }

  confirmRejectTask(): void {
    if (!this.collabProject || !this.taskToReject) return;
    const reason = this.rejectionReasonInput.trim();
    if (!reason) {
      this.showToast('Veuillez indiquer le motif du rejet pour orienter le développeur.');
      return;
    }

    this.isRejectingTask = true;
    this.collaborationService.rejectTask(this.collabProject.id, this.taskToReject.id, reason).subscribe({
      next: (res) => {
        this.isRejectingTask = false;
        if (res.success) {
          this.showToast(`Tâche retournée au développeur avec le motif de rejet.`);
          this.closeRejectModal();
          if (this.selectedTaskForDetail?.id === res.data.id) {
            this.selectedTaskForDetail = res.data;
          }
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.isRejectingTask = false;
        this.showToast(err.error?.error?.message || err.error?.message || 'Erreur lors du rejet de la tâche.');
      }
    });
  }

  onValidateTask(task: ProjectTask): void {
    if (!this.collabProject) return;
    this.collaborationService.validateTask(this.collabProject.id, task.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`Tâche "${task.title}" validée avec succès !`);
          if (this.selectedTaskForDetail?.id === res.data.id) {
            this.selectedTaskForDetail = res.data;
          }
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.showToast(err.error?.error?.message || err.error?.message || 'Erreur lors de la validation.');
      }
    });
  }

  getStatusRank(status?: TaskStatus): number {
    switch (status) {
      case 'TODO': return 0;
      case 'IN_PROGRESS': return 1;
      case 'REVIEW': return 2;
      case 'DONE': return 3;
      default: return 0;
    }
  }

  getAllowedNextStatuses(task: ProjectTask): { value: TaskStatus; label: string }[] {
    const isLead = this.isProjectLead();
    if (isLead) {
      return [
        { value: 'TODO', label: 'À Faire' },
        { value: 'IN_PROGRESS', label: 'En Cours' },
        { value: 'REVIEW', label: 'En Revue' },
        { value: 'DONE', label: 'Terminé' }
      ];
    }

    // Le développeur ne peut pas retourner en arrière
    const currentRank = this.getStatusRank(task.status);
    const options: { value: TaskStatus; label: string }[] = [];

    if (currentRank === 0) { // TODO
      options.push({ value: 'TODO', label: 'À Faire' });
      options.push({ value: 'IN_PROGRESS', label: 'Démarrer (En Cours)' });
      options.push({ value: 'REVIEW', label: 'Soumettre pour validation' });
    } else if (currentRank === 1) { // IN_PROGRESS
      options.push({ value: 'IN_PROGRESS', label: 'En Cours' });
      options.push({ value: 'REVIEW', label: 'Soumettre pour validation' });
      options.push({ value: 'DONE', label: 'Terminer (Demander validation)' });
    } else if (currentRank === 2) { // REVIEW
      options.push({ value: 'REVIEW', label: 'En Revue (Attente validation)' });
    } else if (currentRank === 3) { // DONE
      options.push({ value: 'DONE', label: 'Terminée & Validée' });
    }
    return options;
  }

  onUpdateTaskStatus(task: ProjectTask, newStatus: TaskStatus): void {
    if (!this.collabProject) return;
    if (task.status === newStatus) return;

    const isLead = this.isProjectLead();
    if (!isLead) {
      const currentRank = this.getStatusRank(task.status);
      const newRank = this.getStatusRank(newStatus);
      if (newRank < currentRank) {
        this.showToast('Vous ne pouvez pas retourner en arrière sur le statut de cette tâche.');
        return;
      }
    }

    this.collaborationService.updateTask(this.collabProject.id, task.id, { status: newStatus }).subscribe({
      next: (res) => {
        if (res.success) {
          if (!isLead && (newStatus === 'DONE' || newStatus === 'REVIEW')) {
            this.showToast('Tâche soumise au chef de projet pour vérification et validation.');
          } else {
            this.showToast(`Statut mis à jour : ${newStatus}`);
          }
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.showToast(err.error?.error?.message || err.error?.message || 'Erreur lors de la mise à jour.');
      }
    });
  }

  onDeleteTask(task: ProjectTask): void {
    if (!this.collabProject) return;
    if (!this.isProjectLead()) {
      this.showToast('Seul le chef de projet peut supprimer une tâche.');
      return;
    }
    if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return;

    this.collaborationService.deleteTask(this.collabProject.id, task.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('Tâche supprimée avec succès.');
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.showToast(err.error?.error?.message || err.error?.message || 'Erreur lors de la suppression.');
      }
    });
  }

  onUpdateMemberStatus(member: ProjectMember, newStatus: MemberStatus): void {
    if (!this.collabProject) return;
    this.collaborationService.updateMemberStatus(this.collabProject.id, member.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          const actionText = newStatus === 'ACCEPTED' ? 'acceptée' : 'refusée';
          this.showToast(`Candidature de ${member.userName} ${actionText} !`);
          this.loadCollabData(this.collabProject!.id);
        }
      },
      error: (err) => {
        this.showToast(err.error?.error?.message || err.error?.message || 'Erreur lors de la mise à jour du membre.');
      }
    });
  }

  getCvDisplayUrl(url?: string): string {
    return this.profileService.getPdfViewerUrl(url);
  }

  filterCollabTasksByStatus(status: TaskStatus): ProjectTask[] {
    const currentUserId = this.currentUser()?.id;
    const isLead = this.isProjectLead();

    let list = this.collabTasks.filter(t => t.status === status);

    if (!isLead) {
      // Règle : chaque développeur ne voit que les tâches qui lui ont été attribuées
      list = list.filter(t => t.assignedToId === currentUserId);
    } else if (this.selectedDevFilter && this.selectedDevFilter !== 'ALL') {
      list = list.filter(t => t.assignedToId === this.selectedDevFilter);
    }

    return list;
  }

  getAcceptedMembers(): ProjectMember[] {
    return this.collabMembers.filter(m => m.status === 'ACCEPTED');
  }

  getPendingMembers(): ProjectMember[] {
    return this.collabMembers.filter(m => m.status === 'PENDING');
  }
}
