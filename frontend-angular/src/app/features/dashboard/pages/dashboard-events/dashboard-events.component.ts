import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TechEventService, TechEvent, TechEventType } from '../../../../core/services/tech-event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';

@Component({
  selector: 'app-dashboard-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-events.component.html',
  styleUrl: './dashboard-events.component.css'
})
export class DashboardEventsComponent implements OnInit {
  private eventService = inject(TechEventService);
  public authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  myEvents = signal<TechEvent[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = '';
  selectedType = 'ALL';

  // Modal State (Create / Edit)
  showModal = false;
  isEditing = false;
  editingEventId: string | null = null;
  isSubmitting = false;
  errorMessage = '';

  // Delete State
  eventToDelete: TechEvent | null = null;
  isDeleting = false;

  // Toast
  toastMessage: string | null = null;

  // Banner Upload
  isUploadingBanner = false;
  bannerUploadError = '';

  popularTags: string[] = ['Python', 'Angular', 'React', 'IA & ML', 'FinTech', 'Cloud & DevOps', 'Mobile', 'Web3', 'Open Source'];

  eventForm = {
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

  ngOnInit(): void {
    this.loadMyEvents();
  }

  loadMyEvents(): void {
    this.isLoading.set(true);
    this.eventService.getMyEvents().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.myEvents.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showToast(err.error?.error?.message || 'Erreur lors du chargement de vos événements.');
      }
    });
  }

  get filteredEvents(): TechEvent[] {
    let list = this.myEvents();
    if (this.selectedType !== 'ALL') {
      list = list.filter(e => e.type === this.selectedType);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingEventId = null;
    this.errorMessage = '';
    this.bannerUploadError = '';
    this.eventForm = {
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
    this.showModal = true;
  }

  openEditModal(event: TechEvent): void {
    this.isEditing = true;
    this.editingEventId = event.id;
    this.errorMessage = '';
    this.bannerUploadError = '';

    const formatForInput = (dStr?: string) => {
      if (!dStr) return '';
      try {
        const d = new Date(dStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        return dStr.slice(0, 16);
      }
    };

    this.eventForm = {
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: formatForInput(event.startDate),
      endDate: formatForInput(event.endDate),
      location: event.location,
      isOnline: event.isOnline,
      eventUrl: event.eventUrl || '',
      bannerUrl: event.bannerUrl || '',
      tagsString: event.tags ? event.tags.join(', ') : ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isSubmitting = false;
  }

  submitForm(): void {
    if (!this.eventForm.title.trim() || !this.eventForm.description.trim() || !this.eventForm.startDate) {
      this.errorMessage = 'Le titre, la description et la date de début sont obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const tags = this.eventForm.tagsString
      ? this.eventForm.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: this.eventForm.title.trim(),
      description: this.eventForm.description.trim(),
      type: this.eventForm.type,
      startDate: this.eventForm.startDate,
      endDate: this.eventForm.endDate || undefined,
      location: this.eventForm.location || (this.eventForm.isOnline ? 'En ligne' : 'Afrique'),
      isOnline: this.eventForm.isOnline,
      eventUrl: this.eventForm.eventUrl || undefined,
      bannerUrl: this.eventForm.bannerUrl || undefined,
      tags: tags
    };

    if (this.isEditing && this.editingEventId) {
      this.eventService.updateEvent(this.editingEventId, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success && res.data) {
            this.myEvents.update(list => list.map(item => item.id === this.editingEventId ? res.data : item));
            this.closeModal();
            this.showToast('Événement modifié avec succès !');
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.error?.message || 'Erreur lors de la modification de l\'événement.';
        }
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success && res.data) {
            this.myEvents.update(list => [res.data, ...list]);
            this.closeModal();
            this.showToast('Événement publié avec succès sur AfriDev Hub !');
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.error?.message || 'Erreur lors de la publication de l\'événement.';
        }
      });
    }
  }

  confirmDelete(event: TechEvent): void {
    this.eventToDelete = event;
  }

  cancelDelete(): void {
    this.eventToDelete = null;
  }

  executeDelete(): void {
    if (!this.eventToDelete) return;
    const targetId = this.eventToDelete.id;
    this.isDeleting = true;

    this.eventService.deleteEvent(targetId).subscribe({
      next: (res) => {
        this.isDeleting = false;
        if (res.success) {
          this.myEvents.update(list => list.filter(e => e.id !== targetId));
          this.eventToDelete = null;
          this.showToast('Événement supprimé avec succès.');
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.showToast(err.error?.error?.message || 'Erreur lors de la suppression.');
      }
    });
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
          this.eventForm.bannerUrl = url.startsWith('http') ? url : '/api/v1' + url;
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
    this.eventForm.bannerUrl = '';
    this.bannerUploadError = '';
  }

  addTag(tag: string): void {
    const currentTags = this.eventForm.tagsString
      ? this.eventForm.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      this.eventForm.tagsString = currentTags.join(', ');
    }
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
      case 'CONFERENCE': return 'badge-purple';
      case 'HACKATHON': return 'badge-amber';
      case 'MEETUP': return 'badge-teal';
      case 'WORKSHOP': return 'badge-blue';
      case 'WEBINAR': return 'badge-slate';
      default: return 'badge-teal';
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

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }
}
