import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectService, Project, ProjectType, SaleType, SaasPricingType } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-projects.component.html',
  styleUrl: './dashboard-projects.component.css'
})
export class DashboardProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

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

  // Project Types definition
  projectTypesList: { key: ProjectType; label: string; icon: string; desc: string }[] = [
    { key: 'OPEN_SOURCE', label: 'Open Source', icon: '⚡', desc: 'Code source public avec licence libre' },
    { key: 'FOR_SALE', label: 'Projet en Vente', icon: '💰', desc: 'Cession de code ou d\'application' },
    { key: 'SAAS', label: 'Projet SaaS', icon: '🚀', desc: 'Service web hébergé avec abonnement' },
    { key: 'PORTFOLIO', label: 'Site / Portfolio', icon: '💼', desc: 'Vitrine de présentation personnelle' },
    { key: 'ENTERPRISE', label: 'Projet Entreprise', icon: '🏢', desc: 'Réalisation pro sous contrat NDA' }
  ];

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
    screenshots: [] as string[]
  };

  isSubmitting = false;
  isUploadingMedia = false;
  formErrorMessage = '';
  formSuccessMessage = '';

  ngOnInit(): void {
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
      screenshots: []
    };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }

  onImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.formErrorMessage = 'L\'image dépasse la taille maximale autorisée de 5 Mo.';
      return;
    }

    this.isUploadingMedia = true;
    this.projectService.uploadImage(file).subscribe({
      next: (res) => {
        this.isUploadingMedia = false;
        if (res.success && res.data?.url) {
          if (this.projectForm.screenshots.length < 5) {
            this.projectForm.screenshots.push(res.data.url);
          } else {
            this.formErrorMessage = 'Nombre maximal de 5 captures atteint.';
          }
        }
      },
      error: (err) => {
        this.isUploadingMedia = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors du téléversement de l\'image.';
      }
    });
  }

  removeScreenshot(index: number): void {
    this.projectForm.screenshots.splice(index, 1);
  }

  onPdfSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.formErrorMessage = 'Le document PDF dépasse la taille maximale autorisée de 10 Mo.';
      return;
    }

    this.isUploadingMedia = true;
    this.projectService.uploadPdf(file).subscribe({
      next: (res) => {
        this.isUploadingMedia = false;
        if (res.success && res.data?.url) {
          this.projectForm.documentationPdfUrl = res.data.url;
        }
      },
      error: (err) => {
        this.isUploadingMedia = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors du téléversement du PDF.';
      }
    });
  }

  removePdf(): void {
    this.projectForm.documentationPdfUrl = '';
  }

  validateForm(): boolean {
    if (!this.projectForm.title.trim()) {
      this.formErrorMessage = 'Le titre du projet est obligatoire.';
      return false;
    }
    if (this.projectForm.description.trim().length < 10) {
      this.formErrorMessage = 'La description doit contenir au moins 10 caractères.';
      return false;
    }

    const type = this.projectForm.projectType;

    if (type === 'OPEN_SOURCE') {
      if (!this.projectForm.repoUrl.trim()) {
        this.formErrorMessage = 'Le lien du dépôt GitHub est obligatoire pour un projet Open Source.';
        return false;
      }
    } else if (type === 'FOR_SALE') {
      if (this.projectForm.price === null || this.projectForm.price < 0) {
        this.formErrorMessage = 'Le prix de vente est obligatoire et doit être supérieur ou égal à 0.';
        return false;
      }
    } else if (type === 'SAAS') {
      if (!this.projectForm.demoUrl.trim()) {
        this.formErrorMessage = 'Le lien de l\'application en ligne est obligatoire pour un SaaS.';
        return false;
      }
    } else if (type === 'PORTFOLIO') {
      if (!this.projectForm.demoUrl.trim()) {
        this.formErrorMessage = 'Le lien du site est obligatoire pour un projet Portfolio.';
        return false;
      }
    } else if (type === 'ENTERPRISE') {
      if (!this.projectForm.companyName.trim()) {
        this.formErrorMessage = 'Le nom de l\'entreprise est obligatoire pour un projet d\'entreprise.';
        return false;
      }
      if (!this.projectForm.companyRole.trim()) {
        this.formErrorMessage = 'Votre rôle est obligatoire pour un projet d\'entreprise.';
        return false;
      }
    }

    if (this.projectForm.youtubeUrl.trim()) {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
      if (!ytRegex.test(this.projectForm.youtubeUrl.trim())) {
        this.formErrorMessage = 'Le lien YouTube n\'est pas valide (Ex: https://www.youtube.com/watch?v=VIDEO_ID).';
        return false;
      }
    }

    return true;
  }

  submitCreate(): void {
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

    this.projectService.createProject(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadMyProjects();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors de la création du projet.';
      }
    });
  }

  openEditModal(project: Project): void {
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
      screenshots: project.screenshots ? [...project.screenshots] : []
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
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formErrorMessage = err.error?.message || 'Erreur lors de la mise à jour du projet.';
      }
    });
  }

  openDetailModal(project: Project): void {
    this.selectedProject = project;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedProject = null;
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

  toggleStatus(project: Project): void {
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
}
