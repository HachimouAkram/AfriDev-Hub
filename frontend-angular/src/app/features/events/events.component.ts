import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TechEventService, TechEvent, TechEventType, VoteType } from '../../core/services/tech-event.service';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  private eventService = inject(TechEventService);
  public authService = inject(AuthService);
  private projectService = inject(ProjectService);

  currentUser = this.authService.currentUser;

  events = signal<TechEvent[]>([]);
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  hasMoreEvents = signal<boolean>(true);
  totalEvents = signal<number>(0);
  page = 0;
  readonly pageSize = 20;
  activeFilter: string = 'ALL';
  currentSort: string = 'SUGGESTED';
  searchQuery: string = '';

  sortOptions: { key: string; label: string; icon: string }[] = [
    { key: 'SUGGESTED', label: 'Pour vous (IA)', icon: 'ri-magic-line' },
    { key: 'FOLLOWING', label: 'Organisateurs suivis', icon: 'ri-user-follow-line' },
    { key: 'MATCHING_TAGS', label: 'Mes compétences', icon: 'ri-code-box-line' },
    { key: 'SAME_COUNTRY', label: 'Mon pays / Ville', icon: 'ri-map-pin-user-line' },
    { key: 'ONLINE', label: '100% En ligne', icon: 'ri-global-line' },
    { key: 'POPULAR', label: 'Les plus attendus', icon: 'ri-fire-line' },
    { key: 'UPCOMING', label: 'Prochainement', icon: 'ri-time-line' }
  ];

  // Create Modal State
  showCreateModal = false;
  isSubmitting = false;
  isUploadingBanner = false;
  bannerUploadError = '';
  errorMessage = '';
  successToast = '';

  popularTags: string[] = ['Python', 'Angular', 'React', 'IA & ML', 'FinTech', 'Cloud & DevOps', 'Mobile', 'Web3', 'Open Source'];

  newEvent = {
    title: '',
    description: '',
    type: 'MEETUP' as TechEventType,
    startDate: '',
    endDate: '',
    location: '',
    isOnline: false,
    eventUrl: '',
    bannerUrl: '',
    tagsString: ''
  };

  eventTypes: { key: TechEventType | 'ALL'; label: string; icon: string }[] = [
    { key: 'ALL', label: 'Tous les événements', icon: 'ri-calendar-event-line' },
    { key: 'CONFERENCE', label: 'Conférences Tech', icon: 'ri-presentation-line' },
    { key: 'MEETUP', label: 'Meetups Locaux', icon: 'ri-community-line' },
    { key: 'HACKATHON', label: 'Hackathons', icon: 'ri-flashlight-line' },
    { key: 'WORKSHOP', label: 'Ateliers & Masterclasses', icon: 'ri-code-box-line' }
  ];

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.page = 0;
    this.hasMoreEvents.set(true);
    const filterType = this.activeFilter === 'ALL' ? undefined : (this.activeFilter as TechEventType);
    this.eventService.getEvents(filterType, 0, this.pageSize, this.currentSort).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const fetched = res.data.content || [];
          this.totalEvents.set(res.data.totalElements || fetched.length);
          this.hasMoreEvents.set(!res.data.last && fetched.length >= this.pageSize);
          this.events.set(fetched);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur chargement événements', err);
      }
    });
  }

  loadMoreEvents(): void {
    if (this.isLoadingMore() || !this.hasMoreEvents() || this.isLoading()) return;
    this.isLoadingMore.set(true);
    const nextPage = this.page + 1;
    const filterType = this.activeFilter === 'ALL' ? undefined : (this.activeFilter as TechEventType);

    this.eventService.getEvents(filterType, nextPage, this.pageSize, this.currentSort).subscribe({
      next: (res) => {
        this.isLoadingMore.set(false);
        if (res.success && res.data) {
          const newItems = res.data.content || [];
          const isLast = res.data.last || newItems.length < this.pageSize;
          if (newItems.length > 0) {
            this.page = nextPage;
            const existingIds = new Set(this.events().map(e => e.id));
            const toAdd = newItems.filter(e => !existingIds.has(e.id));
            this.events.update(list => [...list, ...toAdd]);
          }
          if (isLast || newItems.length < this.pageSize || (this.totalEvents() > 0 && this.events().length >= this.totalEvents())) {
            this.hasMoreEvents.set(false);
          }
        }
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isLoadingMore() || !this.hasMoreEvents() || this.isLoading()) return;
    const threshold = 400;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;
    if (position >= height - threshold) {
      this.loadMoreEvents();
    }
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.loadEvents();
  }

  setSort(sort: string): void {
    this.currentSort = sort;
    this.loadEvents();
  }

  isMatchedTag(tag: string, event: TechEvent): boolean {
    if (!event.matchedTags || event.matchedTags.length === 0) return false;
    return event.matchedTags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  get filteredEvents(): TechEvent[] {
    const list = this.events();
    if (!this.searchQuery) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  isMyEvent(event: TechEvent): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.id === event.organizerId || user.email === event.organizerId;
  }

  onVote(event: TechEvent, voteType: VoteType, e: MouseEvent): void {
    e.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.showToast('Veuillez vous connecter pour soutenir ou réagir à cet événement.');
      return;
    }

    this.eventService.voteEvent(event.id, voteType).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Mettre à jour l'événement localement
          this.events.update(list => list.map(item => item.id === event.id ? res.data : item));
        }
      },
      error: (err) => {
        this.showToast(err.error?.error?.message || 'Erreur lors du vote.');
      }
    });
  }

  openCreateModal(): void {
    if (!this.authService.isLoggedIn()) {
      this.showToast('Connectez-vous pour proposer un événement ou un meetup.');
      return;
    }
    this.errorMessage = '';
    this.newEvent = {
      title: '',
      description: '',
      type: 'MEETUP',
      startDate: '',
      endDate: '',
      location: '',
      isOnline: false,
      eventUrl: '',
      bannerUrl: '',
      tagsString: ''
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.bannerUploadError = '';
    this.isUploadingBanner = false;
  }

  onBannerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.bannerUploadError = 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.bannerUploadError = 'L\'image dépasse la taille maximale autorisée (5 Mo).';
      return;
    }

    this.isUploadingBanner = true;
    this.bannerUploadError = '';

    this.projectService.uploadImage(file).subscribe({
      next: (res) => {
        this.isUploadingBanner = false;
        if (res.success && res.data?.url) {
          const url = res.data.url;
          this.newEvent.bannerUrl = url.startsWith('http') ? url : 'http://localhost:8081/api/v1' + url;
          this.showToast('Image d\'affiche téléversée avec succès !');
        }
      },
      error: (err) => {
        this.isUploadingBanner = false;
        this.bannerUploadError = err.error?.error?.message || 'Erreur lors du téléversement de l\'image.';
      }
    });
  }

  removeBanner(): void {
    this.newEvent.bannerUrl = '';
    this.bannerUploadError = '';
  }

  addTag(tag: string): void {
    const currentTags = this.newEvent.tagsString
      ? this.newEvent.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      this.newEvent.tagsString = currentTags.join(', ');
    }
  }

  submitEvent(): void {
    if (!this.newEvent.title || !this.newEvent.description || !this.newEvent.startDate) {
      this.errorMessage = 'Le titre, la description et la date de début sont obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const tags = this.newEvent.tagsString
      ? this.newEvent.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    this.eventService.createEvent({
      title: this.newEvent.title,
      description: this.newEvent.description,
      type: this.newEvent.type,
      startDate: this.newEvent.startDate,
      endDate: this.newEvent.endDate || undefined,
      location: this.newEvent.location || (this.newEvent.isOnline ? 'En ligne' : 'Afrique'),
      isOnline: this.newEvent.isOnline,
      eventUrl: this.newEvent.eventUrl || undefined,
      bannerUrl: this.newEvent.bannerUrl || undefined,
      tags: tags
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.events.update(list => [res.data, ...list]);
          this.closeCreateModal();
          this.showToast('Événement publié avec succès sur la communauté !');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error?.message || 'Erreur lors de la publication de l\'événement.';
      }
    });
  }

  showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => this.successToast = '', 4000);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  getTypeBadgeClass(type: TechEventType): string {
    switch (type) {
      case 'CONFERENCE': return 'badge-conference';
      case 'HACKATHON': return 'badge-hackathon';
      case 'MEETUP': return 'badge-meetup';
      case 'WORKSHOP': return 'badge-workshop';
      default: return 'badge-default';
    }
  }

  getTypeLabel(type: TechEventType): string {
    switch (type) {
      case 'CONFERENCE': return 'Conférence';
      case 'HACKATHON': return 'Hackathon';
      case 'MEETUP': return 'Meetup';
      case 'WORKSHOP': return 'Atelier Masterclass';
      case 'WEBINAR': return 'Webinaire';
      default: return type;
    }
  }
}
