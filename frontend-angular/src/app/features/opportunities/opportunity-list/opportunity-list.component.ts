import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OpportunityService, Opportunity } from '../../../core/services/opportunity.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-list.component.html',
  styleUrl: './opportunity-list.component.css'
})
export class OpportunityListComponent implements OnInit {
  private opportunityService = inject(OpportunityService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);

  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  searchQuery: string = '';
  selectedType: string = 'ALL';
  currentSort: string = 'SUGGESTED';
  isLoading = true;
  isLoadingMore = false;
  hasMoreOpportunities = true;
  totalOpportunities = 0;
  page = 0;
  readonly pageSize = 20;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Apply Modal State
  showApplyModal = false;
  selectedOpportunity: Opportunity | null = null;
  applicationMessage = '';
  cvUrl = ''; // URL finale envoyée au backend
  cvFileName = ''; // Nom du fichier sélectionné
  usedProfileCv = false; // Si on utilise le CV du profil
  isUploadingCv = false; // Upload en cours
  isApplying = false;
  applySuccessMessage = '';
  applyErrorMessage = '';
  cvUploadError = '';

  // Lettre de motivation : écrite ou PDF
  letterMode: 'write' | 'pdf' = 'write';
  coverLetterUrl = '';
  coverLetterFileName = '';
  isUploadingLetter = false;
  letterUploadError = '';

  // Create Opportunity Modal
  showCreateModal = false;
  isSubmitting = false;
  createErrorMessage = '';

  optTitle = '';
  optDescription = '';
  optType: 'JOB' | 'FREELANCE' | 'COLLABORATION' | 'INTERNSHIP' = 'JOB';
  optLocation = 'Sénégal (Dakar)';
  optIsRemote = true;
  optStack = 'Angular, Spring Boot';
  optBudget = '1 500 000 FCFA / mois';
  optMaxApplicants = 1; // Nombre de personnes cherchées
  optIsPaid = true; // Pour un stage: rémunéré ou non

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      this.searchQuery = q || '';
      this.applySearchFilter();
    });
    this.loadOpportunities();
  }

  applySearchFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredOpportunities = [...this.opportunities];
      return;
    }
    this.filteredOpportunities = this.opportunities.filter(o =>
      (o.title && o.title.toLowerCase().includes(q)) ||
      (o.description && o.description.toLowerCase().includes(q)) ||
      (o.location && o.location.toLowerCase().includes(q)) ||
      (o.stack && o.stack.some(s => s.toLowerCase().includes(q)))
    );
  }

  clearSearchFilter(): void {
    this.searchQuery = '';
    this.applySearchFilter();
  }

  loadOpportunities(): void {
    this.isLoading = true;
    this.page = 0;
    this.hasMoreOpportunities = true;
    const typeParam = this.selectedType === 'ALL' ? undefined : this.selectedType;

    this.opportunityService.getOpportunities(typeParam, 0, this.pageSize, this.currentSort).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        let fetched: Opportunity[] = [];
        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          fetched = res.data.content;
          this.totalOpportunities = res.data.totalElements || fetched.length;
          this.hasMoreOpportunities = !res.data.last && fetched.length >= this.pageSize;
        } else if (res?.data && Array.isArray(res.data)) {
          fetched = res.data;
          this.totalOpportunities = fetched.length;
          this.hasMoreOpportunities = false;
        } else if (res?.content && Array.isArray(res.content)) {
          fetched = res.content;
          this.totalOpportunities = res.totalElements || fetched.length;
          this.hasMoreOpportunities = !res.last && fetched.length >= this.pageSize;
        } else if (Array.isArray(res)) {
          fetched = res;
          this.totalOpportunities = fetched.length;
          this.hasMoreOpportunities = false;
        }

        this.opportunities = fetched;
        this.applySearchFilter();
      },
      error: () => {
        this.isLoading = false;
        this.opportunities = [];
        this.filteredOpportunities = [];
      }
    });
  }

  loadMoreOpportunities(): void {
    if (this.isLoadingMore || !this.hasMoreOpportunities || this.isLoading) return;
    this.isLoadingMore = true;
    const nextPage = this.page + 1;
    const typeParam = this.selectedType === 'ALL' ? undefined : this.selectedType;

    this.opportunityService.getOpportunities(typeParam, nextPage, this.pageSize, this.currentSort).subscribe({
      next: (res: any) => {
        this.isLoadingMore = false;
        let newItems: Opportunity[] = [];
        let isLast = false;

        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          newItems = res.data.content;
          isLast = res.data.last;
          if (res.data.totalElements) this.totalOpportunities = res.data.totalElements;
        } else if (res?.data && Array.isArray(res.data)) {
          newItems = res.data;
          isLast = newItems.length < this.pageSize;
        } else if (res?.content && Array.isArray(res.content)) {
          newItems = res.content;
          isLast = res.last;
        }

        if (newItems.length > 0) {
          this.page = nextPage;
          const existingIds = new Set(this.opportunities.map(o => o.id));
          const toAdd = newItems.filter(o => !existingIds.has(o.id));
          this.opportunities = [...this.opportunities, ...toAdd];
          this.applySearchFilter();
        }

        if (isLast || newItems.length < this.pageSize || (this.totalOpportunities > 0 && this.opportunities.length >= this.totalOpportunities)) {
          this.hasMoreOpportunities = false;
        }
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isLoadingMore || !this.hasMoreOpportunities || this.isLoading) return;
    const threshold = 400;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;
    if (position >= height - threshold) {
      this.loadMoreOpportunities();
    }
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.loadOpportunities();
  }

  setSort(sort: string): void {
    if (this.currentSort === sort) return;
    this.currentSort = sort;
    this.loadOpportunities();
  }

  isMatchedTech(tech: string, opt: Opportunity): boolean {
    if (!tech || !opt?.matchedStack || !Array.isArray(opt.matchedStack)) return false;
    const cleanTech = tech.trim().toLowerCase();
    return opt.matchedStack.some(t => t?.trim().toLowerCase() === cleanTech);
  }

  openApplyModal(opt: Opportunity): void {
    this.selectedOpportunity = opt;
    this.showApplyModal = true;
    this.applySuccessMessage = '';
    this.applyErrorMessage = '';
    this.cvUploadError = '';
    this.isUploadingCv = false;
    this.applicationMessage = '';
    this.letterMode = 'write';
    this.coverLetterUrl = '';
    this.coverLetterFileName = '';
    this.letterUploadError = '';
    this.isUploadingLetter = false;
    // Auto-fill CV from profile if available
    const profileCv = this.authService.currentUser()?.profile?.cvUrl;
    if (profileCv) {
      this.cvUrl = profileCv;
      this.cvFileName = 'CV de votre profil';
      this.usedProfileCv = true;
    } else {
      this.cvUrl = '';
      this.cvFileName = '';
      this.usedProfileCv = false;
    }
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedOpportunity = null;
  }

  canSubmitApplication(): boolean {
    if (this.isApplying || this.isUploadingCv || this.isUploadingLetter) return false;
    return this.letterMode === 'write'
      ? this.applicationMessage.trim().length > 0
      : !!this.coverLetterUrl;
  }

  setLetterMode(mode: 'write' | 'pdf'): void {
    this.letterMode = mode;
    this.applyErrorMessage = '';
  }

  onSubmitApplication(): void {
    if (!this.selectedOpportunity) return;
    if (!this.canSubmitApplication()) {
      this.applyErrorMessage = this.letterMode === 'write'
        ? 'Veuillez écrire votre lettre de motivation.'
        : 'Veuillez téléverser votre lettre de motivation (PDF).';
      return;
    }

    this.isApplying = true;
    this.applyErrorMessage = '';

    const message = this.letterMode === 'write' ? this.applicationMessage.trim() : '';
    const letterUrl = this.letterMode === 'pdf' ? this.coverLetterUrl : undefined;

    this.opportunityService.applyToOpportunity(this.selectedOpportunity.id, message, this.cvUrl, letterUrl).subscribe({
      next: (res) => {
        this.isApplying = false;
        if (res.success) {
          this.applySuccessMessage = 'Votre candidature a été envoyée avec succès à l\'émetteur !';
          setTimeout(() => this.closeApplyModal(), 2000);
        }
      },
      error: (err) => {
        this.isApplying = false;
        this.applyErrorMessage = err.error?.error?.message || 'Erreur lors de l\'envoi de la candidature.';
      }
    });
  }

  onLetterFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    input.value = '';

    if (file.type !== 'application/pdf') {
      this.letterUploadError = 'Seuls les fichiers PDF sont acceptés.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.letterUploadError = 'Le fichier ne doit pas dépasser 5 Mo.';
      return;
    }

    this.isUploadingLetter = true;
    this.letterUploadError = '';

    // Réutilise l'endpoint d'upload PDF (même traitement que le CV)
    this.profileService.uploadCv(file).subscribe({
      next: (res) => {
        this.isUploadingLetter = false;
        if (res.success && res.data?.url) {
          this.coverLetterUrl = res.data.url;
          this.coverLetterFileName = file.name;
        } else {
          this.letterUploadError = 'Erreur lors du téléversement de la lettre.';
        }
      },
      error: () => {
        this.isUploadingLetter = false;
        this.letterUploadError = 'Erreur lors du téléversement. Veuillez réessayer.';
      }
    });
  }

  removeLetterFile(): void {
    this.coverLetterUrl = '';
    this.coverLetterFileName = '';
  }

  onCvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.cvUploadError = 'Seuls les fichiers PDF sont acceptés.';
      return;
    }

    this.isUploadingCv = true;
    this.cvUploadError = '';
    this.usedProfileCv = false;

    this.profileService.uploadCv(file).subscribe({
      next: (res) => {
        this.isUploadingCv = false;
        if (res.success && res.data?.url) {
          this.cvUrl = res.data.url;
          this.cvFileName = file.name;
        } else {
          this.cvUploadError = 'Erreur lors du téléversement du CV.';
        }
      },
      error: () => {
        this.isUploadingCv = false;
        this.cvUploadError = 'Erreur lors du téléversement du CV. Veuillez réessayer.';
      }
    });
  }

  getProfileCvUrl(): string {
    const url = this.authService.currentUser()?.profile?.cvUrl;
    return this.profileService.getFullFileUrl(url);
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onSubmitOpportunity(): void {
    if (!this.optTitle || !this.optDescription) return;

    const stack = this.optStack.split(',').map(s => s.trim()).filter(s => s.length > 0);

    // Si stage non rémunéré, pas de montant de rémunération
    const finalBudget = (this.optType === 'INTERNSHIP' && !this.optIsPaid) 
      ? 'Non rémunéré (Convention)' 
      : this.optBudget;

    const payload = {
      title: this.optTitle,
      description: this.optDescription,
      type: this.optType,
      location: this.optLocation,
      isRemote: this.optIsRemote,
      stack: stack,
      budget: finalBudget,
      maxApplicants: this.optMaxApplicants && this.optMaxApplicants > 0 ? this.optMaxApplicants : 1,
      isPaid: this.optType === 'INTERNSHIP' ? this.optIsPaid : true
    };

    this.isSubmitting = true;

    this.opportunityService.createOpportunity(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadOpportunities();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.createErrorMessage = err.error?.error?.message || 'Erreur lors de la publication.';
      }
    });
  }
}
