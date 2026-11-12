import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, Project, ProjectComment, ProjectType } from '../../../core/services/project.service';
import { FollowService, FollowStats } from '../../../core/services/follow.service';
import { ProjectCollaborationService, ProjectMember, ProjectTask, ProjectProgress, TaskStatus, TaskPriority } from '../../../core/services/project-collaboration.service';
import { PaymentService, PaymentProvider, PaymentMethod, PAYMENT_LOGOS } from '../../../core/services/payment.service';
import { AIService, AIAuditResult } from '../../../core/services/ai.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ProfileService } from '../../../core/services/profile.service';

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
  private collaborationService = inject(ProjectCollaborationService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private aiService = inject(AIService);
  private profileService = inject(ProfileService);
  public translationService = inject(TranslationService);

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading = false;
  isLoadingMore = false;
  hasMoreProjects = true;
  totalProjects = 0;
  isServerOffline = false;
  selectedCategory: string = 'ALL';
  currentSort: 'SUGGESTED' | 'FOLLOWING' | 'POPULAR' | 'SAME_COUNTRY' | 'COLLABORATION' | 'RECENT' = 'SUGGESTED';
  searchQuery: string = '';

  // Advanced Filters
  minPriceInput: number | null = null;
  maxPriceInput: number | null = null;
  selectedLicense: string = '';

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  t(key: string, fallback?: string): string {
    return this.translationService.t(key, fallback);
  }

  setSort(sort: 'SUGGESTED' | 'FOLLOWING' | 'POPULAR' | 'SAME_COUNTRY' | 'COLLABORATION' | 'RECENT'): void {
    if (this.currentSort === sort) return;
    this.currentSort = sort;
    this.loadProjects();
  }

  isMatchedTech(project: Project, tech: string): boolean {
    if (!project.matchedStack || project.matchedStack.length === 0) return false;
    return project.matchedStack.some(t => t.toLowerCase() === tech.toLowerCase());
  }

  // Purchase Modal State
  readonly paymentLogos = PAYMENT_LOGOS;
  isPurchaseModalOpen = false;
  purchasingProject: Project | null = null;
  purchaseProvider: PaymentProvider = 'SASPAY';
  purchaseMethod: PaymentMethod = 'WAVE';
  purchasePhone: string = '';
  purchaseCountry: string = 'SN';
  isProcessingPurchase = false;
  purchaseSuccessData: any = null;
  purchaseError: string | null = null;

  // AI Translation State
  isTranslating = false;
  translatedDescriptions: Record<string, string> = {};

  // AI Audit State
  isAuditingProject = false;
  aiAuditResult: AIAuditResult | null = null;
  auditError: string | null = null;

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
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/dashboard/projects'], { queryParams: { create: 'true' } });
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

  // Collaboration State
  activeDetailTab: 'overview' | 'collaboration' = 'overview';
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

  // Author Follow State
  authorFollowStats: FollowStats | null = null;
  isTogglingAuthorFollow = false;

  // Share & Toast notification state
  toastMessage: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const cat = params.get('category');
      const tech = params.get('tech');
      const q = params.get('q');
      if (cat) {
        this.selectedCategory = cat;
      }
      if (tech) {
        this.searchQuery = tech;
      } else if (q !== null) {
        this.searchQuery = q;
      }
      this.applyFilter();
    });
    this.loadProjects();
  }

  openProjectDetail(project: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/projects', project.id]);
  }

  loadProjects(): void {
    this.isLoading = true;
    this.isServerOffline = false;
    this.hasMoreProjects = true;
    const cat = this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined;

    this.projectService.getProjects(0, 20, cat, this.currentSort).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isServerOffline = false;
        let fetched: Project[] = [];
        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          fetched = res.data.content;
          this.totalProjects = res.data.totalElements || fetched.length;
          this.hasMoreProjects = !res.data.last && fetched.length >= 20;
        } else if (res?.data && Array.isArray(res.data)) {
          fetched = res.data;
          this.totalProjects = fetched.length;
          this.hasMoreProjects = false;
        } else if (res?.content && Array.isArray(res.content)) {
          fetched = res.content;
          this.totalProjects = res.totalElements || fetched.length;
          this.hasMoreProjects = !res.last && fetched.length >= 20;
        } else if (Array.isArray(res)) {
          fetched = res;
          this.totalProjects = fetched.length;
          this.hasMoreProjects = false;
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

  loadMoreProjects(): void {
    if (this.isLoadingMore || !this.hasMoreProjects || this.isLoading || this.isServerOffline) return;
    this.isLoadingMore = true;

    // Chargement 2 par 2 lors du défilement
    const nextPage = Math.floor(this.projects.length / 2);
    const cat = this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined;

    this.projectService.getProjects(nextPage, 2, cat, this.currentSort).subscribe({
      next: (res: any) => {
        this.isLoadingMore = false;
        let newItems: Project[] = [];
        let isLast = false;

        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          newItems = res.data.content;
          isLast = res.data.last;
          if (res.data.totalElements) this.totalProjects = res.data.totalElements;
        } else if (res?.data && Array.isArray(res.data)) {
          newItems = res.data;
          isLast = newItems.length < 2;
        } else if (res?.content && Array.isArray(res.content)) {
          newItems = res.content;
          isLast = res.last;
        }

        if (newItems.length > 0) {
          const existingIds = new Set(this.projects.map(p => p.id));
          const toAdd = newItems.filter(p => !existingIds.has(p.id));
          this.projects = [...this.projects, ...toAdd];
          this.applyFilter();
        }

        if (isLast || newItems.length < 2 || (this.totalProjects > 0 && this.projects.length >= this.totalProjects)) {
          this.hasMoreProjects = false;
        }
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isLoadingMore || !this.hasMoreProjects || this.isLoading || this.isServerOffline) return;
    const threshold = 400;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;
    if (position >= height - threshold) {
      this.loadMoreProjects();
    }
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.loadProjects();
  }

  resetFilters(): void {
    this.selectedCategory = 'ALL';
    this.searchQuery = '';
    this.minPriceInput = null;
    this.maxPriceInput = null;
    this.selectedLicense = '';
    this.applyFilter();
  }

  private normalizeSearchText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_']/g, ' ')
      .trim();
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const temp = dp[j];
        dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
        prev = temp;
      }
    }
    return dp[b.length];
  }

  private matchesFuzzyTerm(target: string | null | undefined, terms: string[]): boolean {
    if (!target) return false;
    const normTarget = this.normalizeSearchText(target);
    const compactTarget = normTarget.replace(/\s+/g, '');
    const targetWords = normTarget.split(/\s+/).filter(Boolean);

    return terms.some(term => {
      const compactTerm = term.replace(/\s+/g, '');
      if (normTarget.includes(term) || compactTarget.includes(compactTerm)) return true;
      if (compactTerm.length >= 4) {
        if (compactTarget.includes(compactTerm.slice(0, -1))) return true;
        const maxDist = compactTerm.length >= 7 ? 2 : 1;
        for (const word of targetWords) {
          if (word.length >= 4 && Math.abs(word.length - compactTerm.length) <= maxDist &&
              this.levenshteinDistance(word, compactTerm) <= maxDist) {
            return true;
          }
        }
        for (let i = 0; i < targetWords.length - 1; i++) {
          const joined = targetWords[i] + targetWords[i + 1];
          if (joined.length >= 5 && Math.abs(joined.length - compactTerm.length) <= 2 &&
              this.levenshteinDistance(joined, compactTerm) <= 2) {
            return true;
          }
        }
      }
      return false;
    });
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

    const rawQ = this.searchQuery.trim();
    if (rawQ) {
      const terms = this.normalizeSearchText(rawQ).split(/\s+/).filter(Boolean);
      result = result.filter(p =>
        this.matchesFuzzyTerm(p.title, terms) ||
        this.matchesFuzzyTerm(p.description, terms) ||
        this.matchesFuzzyTerm(p.companyName, terms) ||
        this.matchesFuzzyTerm(p.projectType, terms) ||
        (p.stack && p.stack.some(s => this.matchesFuzzyTerm(s, terms))) ||
        this.matchesFuzzyTerm(p.author?.profile?.fullName, terms) ||
        this.matchesFuzzyTerm(p.author?.profile?.country, terms)
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
    this.activeDetailTab = project.projectType === 'COLLABORATIVE' ? 'collaboration' : 'overview';
    this.loadComments(project.id);
    this.loadCollaborationData(project.id);

    // Enregistrer la vue en temps réel
    this.projectService.recordView(project.id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          project.viewsCount = res.data.viewsCount;
          if (this.selectedProject && this.selectedProject.id === project.id) {
            this.selectedProject.viewsCount = res.data.viewsCount;
          }
        }
      },
      error: () => {
        // En cas d'erreur réseau temporaire, incrémenter localement
        project.viewsCount = (project.viewsCount || 0) + 1;
      }
    });

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
    this.projectProgress = null;
    this.projectMembers = [];
    this.projectTasks = [];
    this.showApplyModal = false;
  }

  loadCollaborationData(projectId: string): void {
    this.isLoadingCollabData = true;
    this.collaborationService.getProgress(projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.projectProgress = res.data;
        }
      },
      error: () => {}
    });

    this.collaborationService.getMembers(projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.projectMembers = res.data;
        }
      },
      error: () => {}
    });

    this.collaborationService.getTasks(projectId).subscribe({
      next: (res) => {
        this.isLoadingCollabData = false;
        if (res.success) {
          this.projectTasks = res.data;
        }
      },
      error: () => {
        this.isLoadingCollabData = false;
      }
    });
  }

  filterTasksByStatus(status: TaskStatus): ProjectTask[] {
    return this.projectTasks.filter(t => t.status === status);
  }

  openApplyModal(): void {
    if (!this.isLoggedIn()) {
      this.showToast('Veuillez vous connecter pour postuler à ce projet.');
      this.router.navigate(['/login']);
      return;
    }
    this.applyRole = '';
    this.applyMessage = '';
    this.cvUploadError = '';
    this.isUploadingCv = false;

    // Récupérer le CV du profil de l'utilisateur s'il existe
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
        if (err.status === 413) {
          this.cvUploadError = 'Le fichier PDF est trop volumineux pour le réseau (413).';
        } else if (err.status === 502) {
          this.cvUploadError = 'Le serveur est temporairement inaccessible (502). Veuillez réessayer.';
        } else {
          this.cvUploadError = err.error?.error?.message || err.error?.message || 'Erreur lors du téléversement du CV.';
        }
      }
    });
  }

  getCvDisplayUrl(url: string): string {
    return this.profileService.getPdfViewerUrl(url);
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

  submitApplication(): void {
    if (!this.selectedProject || !this.applyRole.trim()) return;

    this.isSubmittingApply = true;
    this.collaborationService.applyToJoin(
      this.selectedProject.id, 
      this.applyRole, 
      this.applyMessage, 
      this.applyCvUrl
    ).subscribe({
      next: (res) => {
        this.isSubmittingApply = false;
        if (res.success) {
          this.showApplyModal = false;
          this.showToast('Candidature envoyée avec succès au lead du projet !');
          this.loadCollaborationData(this.selectedProject!.id);
        }
      },
      error: (err) => {
        this.isSubmittingApply = false;
        const msg = err.error?.error?.message || 'Erreur lors de l\'envoi de la candidature.';
        this.showToast(msg);
      }
    });
  }

  updateTaskStatus(task: ProjectTask, newStatus: TaskStatus): void {
    if (!this.selectedProject) return;

    const prevStatus = task.status;
    task.status = newStatus;
    this.collaborationService.updateTask(this.selectedProject.id, task.id, { status: newStatus }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`Statut mis à jour : ${newStatus}`);
          this.loadCollaborationData(this.selectedProject!.id);
        }
      },
      error: (err) => {
        task.status = prevStatus;
        const msg = err.error?.error?.message || 'Action non autorisée ou erreur de mise à jour.';
        this.showToast(msg);
      }
    });
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

  isCurrentUserLead(): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    return !!(currentUserId && this.selectedProject?.author?.id === currentUserId);
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

  // Purchase Modal Methods
  buyProjectDirectWithSasPay(project: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.purchasingProject = project;
    this.isProcessingPurchase = true;
    this.purchaseError = null;

    const currentUser = this.authService.currentUser();
    const customerPhone = currentUser?.profile?.whatsappNumber || '';
    const customerName = currentUser?.profile?.fullName || currentUser?.email || 'Acheteur AfriDev';
    const customerEmail = currentUser?.email || 'client@afridev.africa';

    this.paymentService.initiatePayment({
      targetType: 'PROJECT',
      targetId: project.id,
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
      error: (err) => {
        this.isProcessingPurchase = false;
        const total = Math.round((project.price || 0) * 1.07);
        window.location.href = `https://link.saspay.me/bpz950t0zto?amount=${total}&reference=ORD-${project.id}`;
      }
    });
  }

  openPurchaseModal(project: Project, event?: Event): void {
    if (event) event.stopPropagation();
    this.purchasingProject = project;
    this.purchaseSuccessData = null;
    this.purchaseError = null;
    this.purchaseProvider = 'SASPAY';
    this.purchaseMethod = 'WAVE';
    this.purchaseCountry = 'SN';
    this.purchasePhone = this.authService.currentUser()?.profile?.whatsappNumber || '';
    this.isPurchaseModalOpen = true;
  }

  closePurchaseModal(): void {
    this.isPurchaseModalOpen = false;
    this.purchasingProject = null;
    this.purchaseSuccessData = null;
    this.purchaseError = null;
    this.isProcessingPurchase = false;
  }

  confirmProjectPurchase(): void {
    if (!this.purchasingProject) return;
    this.isProcessingPurchase = true;
    this.purchaseError = null;

    const currentUser = this.authService.currentUser();
    const customerPhone = this.purchasePhone || currentUser?.profile?.whatsappNumber || '';
    const customerName = currentUser?.profile?.fullName || currentUser?.email || 'Acheteur AfriDev';
    const customerEmail = currentUser?.email || 'client@afridev.africa';

    this.paymentService.initiatePayment({
      targetType: 'PROJECT',
      targetId: this.purchasingProject.id,
      provider: this.purchaseProvider,
      method: this.purchaseMethod,
      customerPhone,
      customerName,
      customerEmail,
      country: this.purchaseCountry
    }).subscribe({
      next: (res) => {
        this.isProcessingPurchase = false;
        this.purchaseSuccessData = res;
        const targetUrl = res.paymentUrl || `https://link.saspay.me/bpz950t0zto?amount=${res.totalBuyerAmount}&reference=${res.orderNumber}`;
        window.location.href = targetUrl;
      },
      error: (err) => {
        this.isProcessingPurchase = false;
        const total = Math.round((this.purchasingProject?.price || 0) * 1.07);
        window.location.href = `https://link.saspay.me/bpz950t0zto?amount=${total}&reference=ORD-${this.purchasingProject?.id}`;
      }
    });
  }

  // WhatsApp Direct
  canContactWhatsApp(project: Project): boolean {
    const prof = project?.author?.profile;
    return !!(prof && (prof.whatsappEnabled || prof.whatsappNumber));
  }

  openWhatsApp(project: Project, event?: Event): void {
    if (event) event.stopPropagation();
    const prof = project?.author?.profile;
    const phone = prof?.whatsappNumber || prof?.phone;
    if (!phone) {
      this.showToast('Numéro WhatsApp non renseigné par le développeur.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const authorName = prof.fullName || 'Développeur';
    const msg = encodeURIComponent(
      `Bonjour ${authorName}, j'ai vu votre projet "${project.title}" sur AfriDev Hub et je souhaite échanger avec vous !`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  // AI Translation
  translateProject(project: Project): void {
    if (this.translatedDescriptions[project.id]) {
      delete this.translatedDescriptions[project.id];
      return;
    }
    this.isTranslating = true;
    const currentLang = this.translationService.currentLang().code;
    this.aiService.translate(project.description, currentLang).subscribe({
      next: (res) => {
        this.isTranslating = false;
        this.translatedDescriptions[project.id] = res;
        this.showToast('Description traduite en ' + this.translationService.currentLang().label);
      },
      error: () => {
        this.isTranslating = false;
        this.showToast('Traduction non disponible actuellement.');
      }
    });
  }

  // AI Audit
  runAIAudit(project: Project): void {
    this.isAuditingProject = true;
    this.aiAuditResult = null;
    this.auditError = null;

    this.aiService.auditProject(
      project.repoUrl || '',
      project.title,
      project.description,
      project.stack || []
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
}
