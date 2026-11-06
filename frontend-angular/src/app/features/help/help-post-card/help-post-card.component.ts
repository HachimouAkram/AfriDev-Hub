import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  HelpPost,
  HelpService,
  HELP_TYPE_LABELS,
  HELP_STATUS_LABELS,
  HELP_STATUS_COLORS
} from '../../../core/services/help.service';

/**
 * Carte d'aperçu d'une publication d'aide dans le feed.
 * Tâche 1.6 — composant réutilisable.
 */
@Component({
  selector: 'app-help-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="help-card" [class.resolved]="post.status === 'RESOLUE'" (click)="goToDetail()">

      <!-- En-tête : type + statut -->
      <div class="help-card-header">
        <span class="help-type-badge">{{ typeLabel }}</span>
        <span class="help-status-badge" [class]="'status-' + statusColor">{{ statusLabel }}</span>
        <span class="help-card-time">{{ post.createdAt | date:'dd MMM yyyy' }}</span>
      </div>

      <!-- Titre -->
      <h3 class="help-card-title">{{ post.title }}</h3>

      <!-- Description courte -->
      <p class="help-card-excerpt">{{ truncate(post.description, 160) }}</p>

      <!-- Tags -->
      <div class="help-card-tags" *ngIf="post.tags && post.tags.length > 0">
        <span class="help-tag" *ngFor="let tag of post.tags.slice(0, 5)">{{ tag }}</span>
      </div>

      <!-- Footer : auteur + métriques -->
      <div class="help-card-footer">
        <div class="help-card-author">
          <div class="author-avatar">
            {{ getInitial(post.author) }}
          </div>
          <div class="author-info">
            <span class="author-name">{{ post.author?.profile?.fullName || post.author?.email }}</span>
            <span class="author-level" *ngIf="post.niveauDemandeur">{{ post.niveauDemandeur }}</span>
          </div>
        </div>

        <div class="help-card-metrics">
          <span class="metric" title="Commentaires">
            <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.743-.598l.147-1.44a5.962 5.962 0 01-1.814-4.432C3 10.444 7.03 6.75 12 6.75s9 3.694 9 8.25z" />
            </svg>
            {{ post.commentsCount }}
          </span>
          <span class="metric" title="Vues">
            <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ post.viewsCount }}
          </span>

          <!-- Bouton Contacter en privé (tâche 1.9) -->
          <button class="btn-contact-sm" (click)="contactAuthor($event)" title="Contacter en privé">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Badge résolu -->
      <div class="resolved-banner" *ngIf="post.status === 'RESOLUE'">
        ✅ Résolu par {{ post.resolvedBy?.profile?.fullName || post.resolvedBy?.email || 'la communauté' }}
      </div>
    </div>
  `,
  styleUrls: ['./help-post-card.component.css']
})
export class HelpPostCardComponent {
  @Input() post!: HelpPost;
  @Output() contactRequested = new EventEmitter<HelpPost>();

  private router = inject(Router);

  get typeLabel(): string {
    return HELP_TYPE_LABELS[this.post.type] ?? this.post.type;
  }

  get statusLabel(): string {
    return HELP_STATUS_LABELS[this.post.status] ?? this.post.status;
  }

  get statusColor(): string {
    return HELP_STATUS_COLORS[this.post.status] ?? 'muted';
  }

  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.slice(0, length) + '…' : text;
  }

  getInitial(author: any): string {
    const name = author?.profile?.fullName || author?.email || 'A';
    return name.charAt(0).toUpperCase();
  }

  goToDetail(): void {
    this.router.navigate(['/dashboard/aide', this.post.id]);
  }

  contactAuthor(event: Event): void {
    event.stopPropagation();
    this.contactRequested.emit(this.post);
  }
}

