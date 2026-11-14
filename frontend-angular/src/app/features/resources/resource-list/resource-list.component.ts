import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ResourceService,
  ResourceItem,
  ResourceType,
  SkillLevel,
  ResourceCreatePayload
} from '../../../core/services/resource.service';
import { TranslationService } from '../../../core/services/translation.service';
import { PaymentService, PaymentProvider, PaymentInitiateResponse, PAYMENT_LOGOS } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { getUploadApiUrl, resolveUploadedMediaUrl } from '../../../core/utils/upload-helper';

interface PublishResourceForm {
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
  xpReward: number;
}

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.css']
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private paymentService = inject(PaymentService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  resources = signal<ResourceItem[]>([]);
  isLoading = signal<boolean>(true);
  selectedResource = signal<ResourceItem | null>(null);
  activeVideoUrl = signal<SafeResourceUrl | null>(null);
  activeDirectVideoUrl = signal<string | null>(null);

  // Filtres
  selectedType = signal<string>('ALL');
  selectedLevel = signal<string>('ALL');
  selectedTech = signal<string>('ALL');
  selectedLang = signal<string>('ALL');
  onlyFree = signal<boolean>(false);

  // Modal de paiement SasPay
  readonly paymentLogos = PAYMENT_LOGOS;
  isPaymentModalOpen = signal<boolean>(false);
  paymentTarget = signal<ResourceItem | null>(null);
  selectedProvider = signal<PaymentProvider>('SASPAY');
  selectedMethod = signal<'WAVE' | 'ORANGE_MONEY' | 'CARD'>('WAVE');
  customerPhone = '';
  country = 'SN';
  isProcessingPayment = signal<boolean>(false);
  paymentSuccessData = signal<PaymentInitiateResponse | null>(null);
  isCheckingPayment = signal<boolean>(false);
  paymentStatusNotice = signal<{ type: 'success' | 'pending' | 'error'; text: string } | null>(null);

  // Publication communautaire de vidéos & formations
  isPublishModalOpen = signal<boolean>(false);
  isSubmittingPublish = signal<boolean>(false);
  publishError = signal<string | null>(null);
  publishBannerNotice = signal<string | null>(null);
  videoSourceMode = signal<'UPLOAD' | 'URL'>('UPLOAD');
  isUploadingVideo = signal<boolean>(false);
  videoUploadProgress = signal<number>(0);
  uploadedVideoFileName = signal<string>('');
  isUploadingThumb = signal<boolean>(false);
  uploadedThumbFileName = signal<string>('');
  isUploadingPdf = signal<boolean>(false);
  uploadedPdfFileName = signal<string>('');
  publishForm: PublishResourceForm = this.createEmptyPublishForm();
  customTech = '';
  publishTechTags = signal<string[]>(['Node.js']);
  techInput = '';

  techList = ['Spring Boot', 'Angular', 'React', 'Node.js', 'Python', 'Docker', 'Flutter', 'Intelligence Artificielle', 'Fintech'];
  readonly availableTechSuggestions = [
    'Node.js',
    'Angular',
    'Spring Boot',
    'Python',
    'React',
    'TypeScript',
    'Docker',
    'Flutter',
    'Java',
    'PostgreSQL',
    'IA & LLM',
    'DevOps'
  ];
  readonly publishTechOptions = [
    'Spring Boot',
    'Angular',
    'Python',
    'React',
    'Node.js',
    'Intelligence Artificielle',
    'Fintech',
    'DevOps & Cloud',
    'Mobile',
    'Autre'
  ];

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.queryParamMap.get('orderNumber');
    if (orderNumber) {
      this.verifyPaymentOrder(orderNumber, true);
    } else {
      this.loadResources();
    }
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  loadResources(forceRefresh = false): void {
    if (forceRefresh) {
      this.resourceService.clearCache();
    }
    this.isLoading.set(true);
    const type = this.selectedType() !== 'ALL' ? (this.selectedType() as ResourceType) : undefined;
    const level = this.selectedLevel() !== 'ALL' ? (this.selectedLevel() as SkillLevel) : undefined;
    const tech = this.selectedTech() !== 'ALL' ? this.selectedTech() : undefined;
    const lang = this.selectedLang() !== 'ALL' ? this.selectedLang() : undefined;
    const isPaid = this.onlyFree() ? false : undefined;

    this.resourceService.search(type, level, tech, lang, isPaid).subscribe({
      next: (page) => {
        this.resources.set(page.content || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilterType(type: string): void {
    this.selectedType.set(type);
    this.loadResources();
  }

  setFilterLevel(level: string): void {
    this.selectedLevel.set(level);
    this.loadResources();
  }

  setFilterTech(tech: string): void {
    this.selectedTech.set(tech);
    this.loadResources();
  }

  setFilterLang(lang: string): void {
    this.selectedLang.set(lang);
    this.loadResources();
  }

  toggleFree(): void {
    this.onlyFree.set(!this.onlyFree());
    this.loadResources();
  }

  openResource(r: ResourceItem): void {
    if (r.isPaid && !r.isUnlockedByCurrentUser) {
      this.openPayment(r);
      return;
    }
    this.selectedResource.set(r);
    this.activeVideoUrl.set(null);
    this.activeDirectVideoUrl.set(null);

    if (r.youtubeUrl) {
      const videoId = this.extractYoutubeId(r.youtubeUrl);
      if (videoId) {
        this.activeVideoUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`)
        );
        return;
      }

      const vimeoId = this.extractVimeoId(r.youtubeUrl);
      if (vimeoId) {
        this.activeVideoUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoId}?autoplay=1`)
        );
        return;
      }

      this.activeDirectVideoUrl.set(resolveUploadedMediaUrl(r.youtubeUrl));
    }
  }

  closeResource(): void {
    this.selectedResource.set(null);
    this.activeVideoUrl.set(null);
    this.activeDirectVideoUrl.set(null);
  }

  markCompleted(r: ResourceItem): void {
    if (!this.authService.isLoggedIn()) {
      this.closeResource();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resources' } });
      return;
    }

    this.resourceService.completeResource(r.id).subscribe({
      next: () => {
        r.isCompletedByCurrentUser = true;
        r.completionsCount++;
        this.publishBannerNotice.set(`Félicitations ! Vous avez complété avec succès « ${r.title} » !`);
        this.authService.refreshCurrentUser().subscribe({ error: () => {} });
      }
    });
  }

  openPayment(r: ResourceItem): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resources' } });
      return;
    }

    this.paymentTarget.set(r);
    this.paymentSuccessData.set(null);
    this.selectedProvider.set('SASPAY');
    this.isPaymentModalOpen.set(true);
  }

  closePayment(): void {
    this.isPaymentModalOpen.set(false);
    this.paymentTarget.set(null);
  }

  confirmPayment(): void {
    const item = this.paymentTarget();
    if (!item) return;

    this.isProcessingPayment.set(true);
    this.paymentService.initiatePayment({
      targetType: 'COURSE',
      targetId: item.id,
      provider: 'SASPAY',
      method: this.selectedMethod(),
      customerPhone: this.customerPhone,
      country: this.country
    }).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.paymentSuccessData.set(res);
        if (res.paymentUrl) {
          window.open(res.paymentUrl, '_blank', 'noopener');
        }
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        alert(err.error?.message || "Erreur lors de l'initialisation du paiement SasPay");
      }
    });
  }

  checkPendingOrderStatus(): void {
    const orderNumber = this.paymentSuccessData()?.orderNumber;
    if (!orderNumber) return;
    this.verifyPaymentOrder(orderNumber, false);
  }

  private verifyPaymentOrder(orderNumber: string, fromRedirect: boolean): void {
    this.isCheckingPayment.set(true);
    this.paymentService.getPaymentStatus(orderNumber).subscribe({
      next: (res: any) => {
        this.isCheckingPayment.set(false);
        const status = res?.status || res?.data?.status;
        if (status === 'COMPLETED') {
          this.paymentStatusNotice.set({
            type: 'success',
            text: `Paiement #${orderNumber} confirmé via SasPay ! Votre formation est maintenant débloquée.`
          });
          this.closePayment();
          this.loadResources(true);
        } else if (status === 'PENDING') {
          this.paymentStatusNotice.set({
            type: 'pending',
            text: `Paiement #${orderNumber} en attente de validation SasPay. Confirmez sur votre téléphone puis réessayez.`
          });
          if (fromRedirect) this.loadResources(true);
        } else {
          this.paymentStatusNotice.set({
            type: 'error',
            text: `Le paiement #${orderNumber} n'a pas été confirmé.`
          });
          if (fromRedirect) this.loadResources();
        }

        if (fromRedirect) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { orderNumber: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
      },
      error: () => {
        this.isCheckingPayment.set(false);
        if (fromRedirect) this.loadResources();
      }
    });
  }

  // ================== Publication Communautaire ==================

  openPublishModal(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resources' } });
      return;
    }

    this.publishForm = this.createEmptyPublishForm();
    this.customTech = '';
    this.publishTechTags.set(['Node.js']);
    this.techInput = '';
    this.publishError.set(null);
    this.videoSourceMode.set('UPLOAD');
    this.uploadedVideoFileName.set('');
    this.uploadedThumbFileName.set('');
    this.uploadedPdfFileName.set('');
    this.videoUploadProgress.set(0);
    this.isPublishModalOpen.set(true);
  }

  addTechTag(customTag?: string): void {
    const raw = (customTag !== undefined ? customTag : this.techInput).trim();
    if (!raw) return;

    // Support comma-separated batch adding (e.g. "Angular, Node.js")
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    const current = [...this.publishTechTags()];

    for (const tag of parts) {
      if (!current.some(t => t.toLowerCase() === tag.toLowerCase())) {
        current.push(tag);
      }
    }

    this.publishTechTags.set(current);
    if (customTag === undefined) {
      this.techInput = '';
    }
  }

  removeTechTag(tagToRemove: string): void {
    this.publishTechTags.set(this.publishTechTags().filter(t => t !== tagToRemove));
  }

  toggleSuggestedTech(tag: string): void {
    const current = this.publishTechTags();
    if (current.some(t => t.toLowerCase() === tag.toLowerCase())) {
      this.publishTechTags.set(current.filter(t => t.toLowerCase() !== tag.toLowerCase()));
    } else {
      this.publishTechTags.set([...current, tag]);
    }
  }

  getTechTags(tech?: string | null): string[] {
    if (!tech) return [];
    return tech.split(',').map(s => s.trim()).filter(Boolean);
  }

  closePublishModal(): void {
    if (this.isSubmittingPublish() || this.isUploadingVideo()) return;
    this.isPublishModalOpen.set(false);
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['mp4', 'webm', 'mov', 'm4v'].includes(ext)) {
      this.publishError.set('Format vidéo non supporté. Utilisez MP4, WebM, MOV ou M4V.');
      input.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.publishError.set('La vidéo dépasse la limite de 50 Mo. Compressez-la ou utilisez un lien YouTube/Vimeo.');
      input.value = '';
      return;
    }

    this.publishError.set(null);
    this.isUploadingVideo.set(true);
    this.videoUploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('video'), formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (ev) => {
        if (ev.type === HttpEventType.UploadProgress) {
          if (ev.total) {
            this.videoUploadProgress.set(Math.round((100 * ev.loaded) / ev.total));
          }
        } else if (ev.type === HttpEventType.Response) {
          this.isUploadingVideo.set(false);
          const url = ev.body?.data?.url || ev.body?.url || '';
          if (url) {
            this.publishForm.youtubeUrl = url;
            this.uploadedVideoFileName.set(file.name);
            this.videoUploadProgress.set(100);
          } else {
            this.publishError.set('URL vidéo manquante dans la réponse du serveur.');
          }
        }
      },
      error: (err) => {
        this.isUploadingVideo.set(false);
        this.publishError.set(err.error?.message || "Erreur lors de l'envoi de la vidéo.");
      }
    });
  }

  onThumbFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.publishError.set('La miniature doit être une image (PNG, JPG, WebP).');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.publishError.set("L'image de couverture dépasse 10 Mo.");
      input.value = '';
      return;
    }

    this.publishError.set(null);
    this.isUploadingThumb.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('image'), formData).subscribe({
      next: (res) => {
        this.isUploadingThumb.set(false);
        const url = res?.data?.url || res?.url || '';
        if (url) {
          this.publishForm.thumbnailUrl = url;
          this.uploadedThumbFileName.set(file.name);
        }
      },
      error: (err) => {
        this.isUploadingThumb.set(false);
        this.publishError.set(err.error?.message || "Erreur lors de l'upload de la miniature.");
      }
    });
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.publishError.set('Le support téléchargeable doit être un fichier PDF.');
      input.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.publishError.set('Le document PDF dépasse 20 Mo.');
      input.value = '';
      return;
    }

    this.publishError.set(null);
    this.isUploadingPdf.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(getUploadApiUrl('pdf'), formData).subscribe({
      next: (res) => {
        this.isUploadingPdf.set(false);
        const url = res?.data?.url || res?.url || '';
        if (url) {
          this.publishForm.pdfUrl = url;
          this.uploadedPdfFileName.set(file.name);
        }
      },
      error: (err) => {
        this.isUploadingPdf.set(false);
        this.publishError.set(err.error?.message || "Erreur lors de l'upload du PDF.");
      }
    });
  }

  submitPublishForm(): void {
    this.publishError.set(null);

    if (this.isUploadingVideo() || this.isUploadingThumb() || this.isUploadingPdf()) {
      this.publishError.set('Veuillez patienter pendant la fin du téléversement des fichiers.');
      return;
    }

    if (this.techInput.trim()) {
      this.addTechTag();
    }

    const title = this.publishForm.title.trim();
    const description = this.publishForm.description.trim();
    const selectedTags = this.publishTechTags();

    if (title.length < 5) {
      this.publishError.set('Le titre doit contenir au moins 5 caractères.');
      return;
    }

    if (description.length < 15) {
      this.publishError.set('La description doit contenir au moins 15 caractères.');
      return;
    }

    if (selectedTags.length === 0) {
      this.publishError.set('Veuillez renseigner au moins une technologie.');
      return;
    }

    const resolvedTech = selectedTags.join(', ');

    if (this.publishForm.type === 'VIDEO' && !this.publishForm.youtubeUrl.trim()) {
      this.publishError.set('Veuillez importer une vidéo ou renseigner un lien vidéo (YouTube, Vimeo ou MP4).');
      return;
    }

    if (this.publishForm.isPaid && (!this.publishForm.price || this.publishForm.price < 500)) {
      this.publishError.set('Pour une formation payante via SasPay, le tarif minimum est de 500 XOF.');
      return;
    }

    const payload: ResourceCreatePayload = {
      title,
      description,
      type: this.publishForm.type,
      level: this.publishForm.level,
      technology: resolvedTech,
      language: this.publishForm.language,
      youtubeUrl: this.publishForm.youtubeUrl.trim() || null,
      thumbnailUrl: this.publishForm.thumbnailUrl.trim() || null,
      pdfUrl: this.publishForm.pdfUrl.trim() || null,
      contentMarkdown: this.publishForm.contentMarkdown.trim() || null,
      isPaid: this.publishForm.isPaid,
      price: this.publishForm.isPaid ? Math.round(this.publishForm.price) : 0,
      currency: this.publishForm.currency || 'XOF',
      durationMinutes: 30,
      xpReward: 20
    };

    this.isSubmittingPublish.set(true);
    this.resourceService.createResource(payload).subscribe({
      next: (created) => {
        this.isSubmittingPublish.set(false);
        this.isPublishModalOpen.set(false);
        this.publishBannerNotice.set(
          `🎉 « ${created.title} » est en ligne (+20 XP reçus) !`
        );
        this.authService.refreshCurrentUser().subscribe({ error: () => {} });
        this.publishTechTags.set(['Node.js']);
        this.techInput = '';
        this.selectedType.set('ALL');
        this.selectedLevel.set('ALL');
        this.selectedTech.set('ALL');
        this.selectedLang.set('ALL');
        this.onlyFree.set(false);
        this.loadResources(true);
      },
      error: (err) => {
        this.isSubmittingPublish.set(false);
        this.publishError.set(err.error?.message || 'Impossible de publier la ressource. Vérifiez votre connexion.');
      }
    });
  }

  private createEmptyPublishForm(): PublishResourceForm {
    return {
      title: '',
      description: '',
      type: 'VIDEO',
      level: 'BEGINNER',
      technology: 'Node.js',
      language: 'fr',
      youtubeUrl: '',
      thumbnailUrl: '',
      pdfUrl: '',
      contentMarkdown: '',
      isPaid: false,
      price: 5000,
      currency: 'XOF',
      durationMinutes: 30,
      xpReward: 20
    };
  }

  // ================== Helpers Affichage & SasPay ==================

  resolveMediaUrl(url?: string | null): string {
    return resolveUploadedMediaUrl(url);
  }

  getCardThumbnail(item: ResourceItem): string {
    if (item.thumbnailUrl) {
      return resolveUploadedMediaUrl(item.thumbnailUrl);
    }
    if (item.youtubeUrl) {
      const ytId = this.extractYoutubeId(item.youtubeUrl);
      if (ytId) {
        return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
    return this.getFallbackThumbnail(item);
  }

  getTypeLabel(type: ResourceType): string {
    switch (type) {
      case 'VIDEO': return 'Vidéo';
      case 'COURSE': return 'Formation Complète';
      case 'TUTORIAL': return 'Tutoriel Pratique';
      case 'ARTICLE': return 'Article Technique';
      case 'TECH_CHEATSHEET': return 'Antisèche / Guide';
      default: return 'Ressource';
    }
  }

  getActionLabel(item: ResourceItem): string {
    const isUnlocked = !item.isPaid || item.isUnlockedByCurrentUser;
    if (isUnlocked) {
      switch (item.type) {
        case 'VIDEO': return 'Regarder la vidéo';
        case 'COURSE': return item.isUnlockedByCurrentUser ? 'Accéder à la formation' : 'S\'inscrire à la formation';
        case 'TUTORIAL': return 'Consulter le tutoriel';
        case 'ARTICLE': return 'Lire l\'article';
        case 'TECH_CHEATSHEET': return 'Télécharger l\'antisèche';
        default: return 'Accéder au contenu';
      }
    } else {
      switch (item.type) {
        case 'VIDEO': return `Acheter la vidéo · ${item.price} ${item.currency}`;
        case 'COURSE': return `S\'inscrire · ${item.price} ${item.currency}`;
        default: return `Débloquer l'accès · ${item.price} ${item.currency}`;
      }
    }
  }

  calcPlatformFee(price?: number | null): number {
    return Math.round((price || 0) * 0.05);
  }

  calcOperatorFee(price?: number | null): number {
    return Math.round((price || 0) * 0.02);
  }

  calcTotalBuyerPrice(price?: number | null): number {
    const base = Math.round(price || 0);
    return base + this.calcPlatformFee(base) + this.calcOperatorFee(base);
  }

  private extractYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  private extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Generates a crisp local SVG data URI fallback if an external thumbnail fails to load (no broken [?] icons).
   */
  getFallbackThumbnail(item: ResourceItem): string {
    const label = (item.technology || 'AfriDev Academy').replace(/[<>&"']/g, '').slice(0, 28);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0F172A"/><stop offset="55%" stop-color="#064E3B"/><stop offset="100%" stop-color="#065F46"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="660" cy="95" r="140" fill="#10B981" fill-opacity="0.14"/><circle cx="150" cy="360" r="160" fill="#34D399" fill-opacity="0.1"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="34" font-weight="800">${label}</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#6EE7B7" font-family="system-ui,sans-serif" font-size="18" font-weight="600">AfriDev Academy</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  onThumbnailError(event: Event, item: ResourceItem): void {
    const img = event.target as HTMLImageElement | null;
    if (!img || img.dataset['fallbackApplied']) return;
    img.dataset['fallbackApplied'] = '1';
    img.src = this.getFallbackThumbnail(item);
  }
}

