import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResourceService, ResourceItem, ResourceType, SkillLevel } from '../../../core/services/resource.service';
import { TranslationService } from '../../../core/services/translation.service';
import { PaymentService, PaymentProvider, PaymentInitiateResponse, PAYMENT_LOGOS } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

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

  resources = signal<ResourceItem[]>([]);
  isLoading = signal<boolean>(true);
  selectedResource = signal<ResourceItem | null>(null);
  activeVideoUrl = signal<SafeResourceUrl | null>(null);

  // Filtres
  selectedType = signal<string>('ALL');
  selectedLevel = signal<string>('ALL');
  selectedTech = signal<string>('ALL');
  selectedLang = signal<string>('ALL');
  onlyFree = signal<boolean>(false);

  // Modal de paiement
  readonly paymentLogos = PAYMENT_LOGOS;
  isPaymentModalOpen = signal<boolean>(false);
  paymentTarget = signal<ResourceItem | null>(null);
  selectedProvider = signal<PaymentProvider>('SASPAY');
  selectedMethod = signal<'WAVE' | 'ORANGE_MONEY' | 'CARD'>('WAVE');
  customerPhone = '';
  country = 'SN';
  isProcessingPayment = signal<boolean>(false);
  paymentSuccessData = signal<PaymentInitiateResponse | null>(null);

  techList = ['Spring Boot', 'Angular', 'Python', 'Intelligence Artificielle', 'Fintech'];

  ngOnInit(): void {
    this.loadResources();
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  loadResources(): void {
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
    this.selectedResource.set(r);
    if (r.youtubeUrl) {
      // Extraire ID youtube
      const videoId = this.extractYoutubeId(r.youtubeUrl);
      if (videoId) {
        this.activeVideoUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`)
        );
      }
    }
  }

  closeResource(): void {
    this.selectedResource.set(null);
    this.activeVideoUrl.set(null);
  }

  markCompleted(r: ResourceItem): void {
    this.resourceService.completeResource(r.id).subscribe({
      next: (updated) => {
        r.isCompletedByCurrentUser = true;
        r.completionsCount++;
        alert(`Félicitations ! Vous avez complété ce cours et gagné +${r.xpReward} XP AfriDev ! 🏆`);
      }
    });
  }

  openPayment(r: ResourceItem): void {
    this.paymentTarget.set(r);
    this.paymentSuccessData.set(null);
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
      provider: this.selectedProvider(),
      method: this.selectedMethod(),
      customerPhone: this.customerPhone,
      country: this.country
    }).subscribe({
      next: (res) => {
        this.isProcessingPayment.set(false);
        this.paymentSuccessData.set(res);
        if (res.paymentUrl) {
          window.open(res.paymentUrl, '_blank');
        }
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        alert(err.error?.message || "Erreur lors de l'initialisation du paiement");
      }
    });
  }

  private extractYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

