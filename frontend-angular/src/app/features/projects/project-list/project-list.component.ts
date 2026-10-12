import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project, ProjectComment, ProjectType } from '../../../core/services/project.service';
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
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading = false;
  isServerOffline = false;
  selectedCategory: string = 'ALL';
  searchQuery: string = '';

  // Advanced Filters
  minPriceInput: number | null = null;
  maxPriceInput: number | null = null;
  selectedLicense: string = '';

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
          this.showToast('Projet publié avec succès !');
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
    this.isLoading = true;
    this.isServerOffline = false;
    this.projectService.getProjects().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isServerOffline = false;
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

        this.projects = fetched;
        this.applyFilter();
      },
      error: () => {
        this.isLoading = false;
        this.isServerOffline = true;
        this.projects = [];
        this.applyFilter();
      }
    });
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  resetFilters(): void {
    this.selectedCategory = 'ALL';
    this.searchQuery = '';
    this.minPriceInput = null;
    this.maxPriceInput = null;
    this.selectedLicense = '';
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.projects];

    if (this.selectedCategory !== 'ALL') {
      result = result.filter(p => (p.projectType || 'OPEN_SOURCE') === this.selectedCategory);
    }

    if (this.minPriceInput !== null && this.minPriceInput !== undefined) {
      result = result.filter(p => p.price !== undefined && p.price !== null && p.price >= this.minPriceInput!);
    }

    if (this.maxPriceInput !== null && this.maxPriceInput !== undefined) {
      result = result.filter(p => p.price !== undefined && p.price !== null && p.price <= this.maxPriceInput!);
    }

    if (this.selectedLicense) {
      result = result.filter(p => p.licenseType === this.selectedLicense);
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.companyName && p.companyName.toLowerCase().includes(q)) ||
        (p.stack && p.stack.some(s => s.toLowerCase().includes(q))) ||
        (p.author?.profile?.fullName && p.author.profile.fullName.toLowerCase().includes(q))
      );
    }

    this.filteredProjects = result;
  }

  contactAuthorForProject(project: Project, inquiryType: 'BUY' | 'DEMO' | 'COLLAB'): void {
    if (!this.isLoggedIn()) {
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
        projectType: 'OPEN_SOURCE',
        licenseType: 'MIT',
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
        projectType: 'SAAS',
        saasPricingType: 'FREEMIUM',
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
        projectType: 'OPEN_SOURCE',
        licenseType: 'Apache-2.0',
        recognitionsCount: 12,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-004',
        author: { id: 'dev-user-004', email: 'aicha.diop@dev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'prof-004', fullName: 'Aïcha Diop', country: 'Sénégal', city: 'Dakar', title: 'Fullstack Mobile Developer', skills: ['Flutter', 'Spring Boot'], availability: 'OPEN', completionScore: 92, mobileMoneyVerified: true } },
        title: 'TechHub ERP Afrique',
        description: 'Logiciel de gestion commerciale et comptable adapté au commerce inter-état de la zone UEMOA.',
        stack: ['Flutter', 'Spring Boot', 'PostgreSQL'],
        demoUrl: 'https://techhuberp.sn',
        screenshots: [],
        isOpenSource: false,
        projectType: 'FOR_SALE',
        price: 450000,
        currency: 'XOF',
        saleType: 'FULL_SOURCE_CODE',
        recognitionsCount: 31,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-005',
        author: { id: 'dev-user-005', email: 'moussa.diallo@dev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'prof-005', fullName: 'Moussa Diallo', country: 'Guinée', city: 'Conakry', title: 'Lead Architect backend', skills: ['Golang', 'Kubernetes'], availability: 'OPEN', completionScore: 96, mobileMoneyVerified: true } },
        title: 'Plateforme Nationale de Facturation',
        description: 'Core banking backend & facturation électronique sécurisée pour la Direction des Impôts.',
        stack: ['Golang', 'Kafka', 'PostgreSQL', 'Kubernetes'],
        screenshots: [],
        isOpenSource: false,
        projectType: 'ENTERPRISE',
        companyName: 'Orange Guinée',
        companyRole: 'Lead Backend Architect',
        recognitionsCount: 45,
        recognizedByCurrentUser: false,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      }
    ];
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

  toggleRecognize(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.isLoggedIn()) {
      this.showToast('Connectez-vous pour donner un J\'aime à ce projet.');
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
          this.showToast('Projet reconnu !');
        }
      });
    }
  }

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
        const mockComment: ProjectComment = {
          id: 'c-' + Date.now(),
          projectId: this.selectedProject!.id,
          author: { id: 'curr', email: 'me@afridev.africa', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'p-curr', fullName: 'Développeur Connecté', country: 'Côte d\'Ivoire', city: 'Abidjan', title: 'Fullstack Dev', skills: ['Angular'], availability: 'OPEN', completionScore: 80, mobileMoneyVerified: true } },
          content: this.newCommentText,
          createdAt: new Date().toISOString()
        };
        this.projectComments.push(mockComment);
        this.newCommentText = '';
        this.showToast('Commentaire ajouté !');
      }
    });
  }

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
}
