import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResourceService, ResourceItem, ResourceType, SkillLevel, ResourceCreatePayload } from '../../../../core/services/resource.service';
import { AuthService } from '../../../../core/services/auth.service';
import { getUploadApiUrl, resolveUploadedMediaUrl } from '../../../../core/utils/upload-helper';

interface ResourceFormModel {
  title: string;
  description: string;
  type: ResourceType;
  level: SkillLevel;
  technology: string;
  language: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  pdfUrl: string;
  contentMarkdown: string;
  isPaid: boolean;
  price: number;
  currency: string;
  durationMinutes: number;
}

@Component({
  selector: 'app-dashboard-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-resources.component.html',
  styleUrls: ['./dashboard-resources.component.css']
})
export class DashboardResourcesComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  currentUser = this.authService.currentUser;
  myResources = signal<ResourceItem[]>([]);
  loading = signal<boolean>(true);

  // Stats
  totalViews = signal<number>(0);
  totalCompletions = signal<number>(0);
  totalPaidCount = signal<number>(0);

  // Modals state
  showModal = false;
  isEditMode = false;
  editingResourceId: string | null = null;
  isSubmitting = signal<boolean>(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  // Delete modal state
  showDeleteModal = false;
  resourceToDelete: ResourceItem | null = null;
  isDeleting = signal<boolean>(false);

  // Preview video player modal state
  activeVideoResource: ResourceItem | null = null;
  safeYoutubeUrl: SafeResourceUrl | null = null;

  // Media upload state
  videoSourceMode = signal<'UPLOAD' | 'URL'>('URL');
  isUploadingVideo = signal<boolean>(false);
  videoUploadProgress = signal<number>(0);
  uploadedVideoFileName = signal<string>('');
  isUploadingThumb = signal<boolean>(false);
  uploadedThumbFileName = signal<string>('');
  isUploadingPdf = signal<boolean>(false);
  uploadedPdfFileName = signal<string>('');

  // Technology tags management
  techInput = '';
  techTags = signal<string[]>([]);
  quickSuggestions = ['React', 'Angular', 'Vue.js', 'Spring Boot', 'Node.js', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'Flutter'];

  form: ResourceFormModel = this.getEmptyForm();

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.loading.set(true);
    this.resourceService.getMyResources(0, 100).subscribe({
      next: (data) => {
        const items: ResourceItem[] = data?.content || (Array.isArray(data) ? data : []);
        this.myResources.set(items);
        this.computeStats(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  computeStats(items: ResourceItem[]): void {
    let views = 0;
    let completions = 0;
    let paid = 0;
    for (const r of items) {
      views += r.viewsCount || 0;
      completions += r.completionsCount || 0;
      if (r.isPaid) paid++;
    }
    this.totalViews.set(views);
    this.totalCompletions.set(completions);
    this.totalPaidCount.set(paid);
  }

  getEmptyForm(): ResourceFormModel {
    return {
      title: '',
      description: '',
      type: 'COURSE',
      level: 'BEGINNER',
      technology: '',
      language: 'fr',
      youtubeUrl: '',
      thumbnailUrl: '',
      pdfUrl: '',
      contentMarkdown: '',
      isPaid: false,
      price: 0,
      currency: 'XOF',
      durationMinutes: 30
    };
  }

  // --- Modal ouverture / fermeture ---
  openCreateModal(): void {
    this.isEditMode = false;
    this.editingResourceId = null;
    this.form = this.getEmptyForm();
    this.techTags.set([]);
    this.techInput = '';
    this.formError.set(null);
    this.formSuccess.set(null);
    this.uploadedVideoFileName.set('');
    this.uploadedThumbFileName.set('');
    this.uploadedPdfFileName.set('');
    this.videoSourceMode.set('URL');
    this.showModal = true;
  }

  openEditModal(item: ResourceItem): void {
    this.isEditMode = true;
    this.editingResourceId = item.id;
    this.form = {
      title: item.title,
      description: item.description,
      type: item.type,
      level: item.level,
      technology: item.technology || '',
      language: item.language || 'fr',
      youtubeUrl: item.youtubeUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      pdfUrl: item.pdfUrl || '',
      contentMarkdown: item.contentMarkdown || '',
      isPaid: item.isPaid || false,
      price: item.price || 0,
      currency: item.currency || 'XOF',
      durationMinutes: item.durationMinutes || 30
    };

    // Split tech tags
    const tags = (item.technology || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    this.techTags.set(tags);
    this.techInput = '';

    this.uploadedVideoFileName.set(item.youtubeUrl && !item.youtubeUrl.includes('youtube.com') && !item.youtubeUrl.includes('youtu.be') ? 'Vidéo téléversée' : '');
    this.uploadedThumbFileName.set(item.thumbnailUrl ? 'Miniature actuelle' : '');
    this.uploadedPdfFileName.set(item.pdfUrl ? 'Document PDF actuel' : '');
    this.videoSourceMode.set(item.youtubeUrl && (item.youtubeUrl.includes('youtube.com') || item.youtubeUrl.includes('youtu.be')) ? 'URL' : 'UPLOAD');

    this.formError.set(null);
    this.formSuccess.set(null);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingResourceId = null;
    this.formError.set(null);
  }

  // --- Tags de Technologies ---
  addTechTag(tech?: string): void {
    const value = (tech || this.techInput).trim();
    if (!value) return;
    const current = this.techTags();
    if (!current.some(t => t.toLowerCase() === value.toLowerCase())) {
      this.techTags.set([...current, value]);
    }
    this.techInput = '';
  }

  removeTechTag(tagToRemove: string): void {
    this.techTags.set(this.techTags().filter(t => t !== tagToRemove));
  }

  // --- Uploads ---
  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      this.formError.set('La vidéo dépasse la taille autorisée de 50 Mo.');
      input.value = '';
      return;
    }

    this.formError.set(null);
    this.isUploadingVideo.set(true);
    this.videoUploadProgress.set(20);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('video'), formData).subscribe({
      next: (res) => {
        this.isUploadingVideo.set(false);
        const url = res?.data?.url || res?.url || '';
        if (url) {
          this.form.youtubeUrl = url;
          this.uploadedVideoFileName.set(file.name);
        }
      },
      error: (err) => {
        this.isUploadingVideo.set(false);
        this.formError.set(err.error?.message || "Erreur lors du téléversement de la vidéo.");
      }
    });
  }

  onThumbFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.formError.set('Le fichier miniature doit être une image.');
      input.value = '';
      return;
    }

    this.formError.set(null);
    this.isUploadingThumb.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('image'), formData).subscribe({
      next: (res) => {
        this.isUploadingThumb.set(false);
        const url = res?.data?.url || res?.url || '';
        if (url) {
          this.form.thumbnailUrl = url;
          this.uploadedThumbFileName.set(file.name);
        }
      },
      error: (err) => {
        this.isUploadingThumb.set(false);
        this.formError.set(err.error?.message || "Erreur lors de l'upload de la miniature.");
      }
    });
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.formError.set('Le support téléchargeable doit être un fichier PDF.');
      input.value = '';
      return;
    }

    this.formError.set(null);
    this.isUploadingPdf.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('pdf'), formData).subscribe({
      next: (res) => {
        this.isUploadingPdf.set(false);
        const url = res?.data?.url || res?.url || '';
        if (url) {
          this.form.pdfUrl = url;
          this.uploadedPdfFileName.set(file.name);
        }
      },
      error: (err) => {
        this.isUploadingPdf.set(false);
        this.formError.set(err.error?.message || "Erreur lors de l'upload du document PDF.");
      }
    });
  }

  // --- Soumission Création / Modification ---
  submitForm(): void {
    this.formError.set(null);

    if (this.techInput.trim()) {
      this.addTechTag();
    }

    const title = this.form.title.trim();
    const description = this.form.description.trim();
    const tags = this.techTags();

    if (title.length < 5) {
      this.formError.set('Le titre doit contenir au moins 5 caractères.');
      return;
    }

    if (description.length < 15) {
      this.formError.set('La description doit contenir au moins 15 caractères.');
      return;
    }

    if (tags.length === 0) {
      this.formError.set('Veuillez préciser au moins une technologie clé.');
      return;
    }

    if (this.form.isPaid && (!this.form.price || this.form.price <= 0)) {
      this.formError.set('Veuillez indiquer un tarif valide en XOF pour une ressource payante.');
      return;
    }

    const payload: ResourceCreatePayload = {
      title,
      description,
      type: this.form.type,
      level: this.form.level,
      technology: tags.join(', '),
      language: this.form.language,
      youtubeUrl: this.form.youtubeUrl ? this.form.youtubeUrl.trim() : null,
      thumbnailUrl: this.form.thumbnailUrl ? this.form.thumbnailUrl.trim() : null,
      pdfUrl: this.form.pdfUrl ? this.form.pdfUrl.trim() : null,
      contentMarkdown: this.form.contentMarkdown ? this.form.contentMarkdown.trim() : null,
      isPaid: this.form.isPaid,
      price: this.form.isPaid ? this.form.price : 0,
      currency: this.form.currency || 'XOF',
      durationMinutes: this.form.durationMinutes || 30
    };

    this.isSubmitting.set(true);

    if (this.isEditMode && this.editingResourceId) {
      this.resourceService.updateResource(this.editingResourceId, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadResources();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err.error?.message || err.error?.error?.message || "Erreur lors de la modification de la ressource.");
        }
      });
    } else {
      this.resourceService.createResource(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadResources();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err.error?.message || err.error?.error?.message || "Erreur lors de la publication de la ressource.");
        }
      });
    }
  }

  // --- Suppression ---
  openDeleteModal(item: ResourceItem): void {
    this.resourceToDelete = item;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.resourceToDelete = null;
  }

  confirmDelete(): void {
    if (!this.resourceToDelete) return;
    this.isDeleting.set(true);
    this.resourceService.deleteResource(this.resourceToDelete.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadResources();
      },
      error: (err) => {
        this.isDeleting.set(false);
        alert(err.error?.message || "Erreur lors de la suppression de la ressource.");
      }
    });
  }

  // --- Aperçu Vidéo ---
  openVideoPreview(item: ResourceItem): void {
    this.activeVideoResource = item;
    if (item.youtubeUrl && (item.youtubeUrl.includes('youtube.com') || item.youtubeUrl.includes('youtu.be'))) {
      const ytId = this.extractYoutubeId(item.youtubeUrl);
      if (ytId) {
        this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`
        );
      }
    } else {
      this.safeYoutubeUrl = null;
    }
  }

  closeVideoPreview(): void {
    this.activeVideoResource = null;
    this.safeYoutubeUrl = null;
  }

  private extractYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // --- Helpers d'affichage ---
  resolveMedia(url?: string | null): string {
    return resolveUploadedMediaUrl(url);
  }

  getThumbnail(item: ResourceItem): string {
    if (item.thumbnailUrl) {
      return resolveUploadedMediaUrl(item.thumbnailUrl);
    }
    if (item.youtubeUrl) {
      const ytId = this.extractYoutubeId(item.youtubeUrl);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
    return '/assets/images/resource-placeholder.png';
  }

  getTypeLabel(type: ResourceType): string {
    switch (type) {
      case 'VIDEO': return '🎥 Vidéo';
      case 'COURSE': return '🎓 Formation';
      case 'TUTORIAL': return '🛠️ Tutoriel';
      case 'ARTICLE': return '📝 Article';
      case 'TECH_CHEATSHEET': return '📋 Antisèche';
      default: return '📚 Ressource';
    }
  }

  getLevelBadge(level: SkillLevel): { label: string; class: string } {
    switch (level) {
      case 'BEGINNER': return { label: 'Débutant', class: 'lvl-beginner' };
      case 'INTERMEDIATE': return { label: 'Intermédiaire', class: 'lvl-intermediate' };
      case 'ADVANCED': return { label: 'Avancé', class: 'lvl-advanced' };
      default: return { label: 'Tous niveaux', class: 'lvl-beginner' };
    }
  }
}

