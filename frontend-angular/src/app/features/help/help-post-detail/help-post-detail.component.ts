import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  HelpService,
  HelpPost,
  HelpComment,
  HelpPostStatus,
  HELP_TYPE_LABELS,
  HELP_STATUS_LABELS,
  HELP_STATUS_COLORS
} from '../../../core/services/help.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-help-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  template: `
    <div class="post-detail-container" *ngIf="post">
      <!-- Bouton Retour -->
      <a routerLink="/dashboard/aide" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Retour au fil d'entraide
      </a>

      <!-- Carte Principale de la publication -->
      <article class="post-main-card">
        <header class="post-header">
          <div class="badges-row">
            <span class="type-badge">{{ typeLabel }}</span>
            <span class="status-badge" [class]="'status-' + statusColor">{{ statusLabel }}</span>
            <span class="created-date">Publié le {{ post.createdAt | date:'longDate' }}</span>
          </div>

          <h1 class="post-title">{{ post.title }}</h1>

          <!-- Auteur et actions rapides -->
          <div class="author-bar">
            <div class="author-details">
              <div class="author-avatar">
                {{ getInitial(post.author) }}
              </div>
              <div class="author-meta">
                <span class="author-name">{{ post.author?.profile?.fullName || post.author?.email }}</span>
                <span class="author-role" *ngIf="post.author?.profile?.title">{{ post.author?.profile?.title }}</span>
                <span class="author-level" *ngIf="post.niveauDemandeur">Niveau : {{ post.niveauDemandeur }}</span>
              </div>
            </div>

            <div class="author-actions">
              <!-- Contacter en privé (Tâche 1.9) -->
              <button
                *ngIf="!post.isAuthor"
                (click)="contactAuthor()"
                class="btn-action-contact"
                title="Échanger en privé avec le demandeur">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.743-.598l.147-1.44a5.962 5.962 0 01-1.814-4.432C3 10.444 7.03 6.75 12 6.75s9 3.694 9 8.25z" />
                </svg>
                <span>Message privé</span>
              </button>

              <!-- Suppression par l'auteur -->
              <button
                *ngIf="post.isAuthor"
                (click)="deletePost()"
                class="btn-delete-post"
                title="Supprimer cette demande">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Contenu de la description -->
        <div class="post-body">
          <p class="description-text">{{ post.description }}</p>
        </div>

        <!-- Galerie de Captures d'écran avec zoom pour mentors -->
        <div class="post-screenshots-section" *ngIf="post.screenshotUrls && post.screenshotUrls.length > 0">
          <h3 class="screenshots-title">
            <svg class="w-4 h-4 text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Captures d'écran & Photos du problème ({{ post.screenshotUrls.length }})</span>
          </h3>
          <div class="screenshots-grid">
            <div
              *ngFor="let url of post.screenshotUrls; let i = index"
              (click)="openLightbox(i)"
              class="screenshot-thumb-box"
              title="Cliquer pour zoomer en haute définition">
              <img [src]="resolveUrl(url)" alt="Capture problème" class="screenshot-thumb" />
              <div class="zoom-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="zoom-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <span>Zoomer</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
          <span class="tag-pill" *ngFor="let tag of post.tags">#{{ tag }}</span>
        </div>

        <!-- Bannière résolue -->
        <div class="resolved-alert" *ngIf="post.status === 'RESOLUE'">
          <svg class="icon-svg icon-svg-sm text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Demande résolue !</strong>
            <p *ngIf="post.resolvedBy">
              Cette question a été résolue grâce à l'aide apportée par
              <strong>{{ post.resolvedBy.profile?.fullName || post.resolvedBy.email }}</strong>.
            </p>
          </div>
        </div>
      </article>

      <!-- Section Commentaires & Réponses (Tâche 1.3 & 1.8) -->
      <section class="comments-section">
        <div class="comments-header">
          <h2>Réponses & Conseils ({{ comments.length }})</h2>
        </div>

        <!-- Formulaire d'ajout de réponse -->
        <div class="add-comment-card">
          <textarea
            [(ngModel)]="newCommentText"
            placeholder="Partagez un conseil bienveillant, une solution ou posez une question pour clarifier..."
            rows="3"
            class="comment-textarea">
          </textarea>
          <div class="comment-actions">
            <span class="comment-hint">Votre réponse pourra être marquée comme solution par le demandeur.</span>
            <button
              (click)="submitComment()"
              [disabled]="!newCommentText.trim() || isSubmittingComment"
              class="btn-send-comment">
              <span *ngIf="!isSubmittingComment">Envoyer ma réponse</span>
              <span *ngIf="isSubmittingComment">Envoi...</span>
            </button>
          </div>
        </div>

        <!-- Liste des commentaires -->
        <div class="comments-list" *ngIf="comments.length > 0">
          <div
            *ngFor="let comment of comments"
            class="comment-item"
            [class.accepted-solution]="comment.isAccepted">
            
            <div class="comment-avatar">
              {{ getInitial(comment.author) }}
            </div>

            <div class="comment-main">
              <div class="comment-top">
                <div class="comment-meta">
                  <span class="comment-author-name">{{ comment.author?.profile?.fullName || comment.author?.email }}</span>
                  <span class="comment-date">{{ comment.createdAt | date:'short' }}</span>
                  <span class="badge-accepted" *ngIf="comment.isAccepted">
                    <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Solution acceptée</span>
                  </span>
                </div>

                <div class="comment-controls">
                  <!-- Marquer comme solution (Tâche 1.10 / auteur seulement) -->
                  <button
                    *ngIf="post.isAuthor && !comment.isAccepted"
                    (click)="acceptSolution(comment)"
                    class="btn-accept-solution"
                    title="Valider cette réponse comme solution officielle">
                    ✓ Marquer comme solution
                  </button>

                  <!-- Supprimer commentaire -->
                  <button
                    *ngIf="canDeleteComment(comment)"
                    (click)="deleteComment(comment)"
                    class="btn-del-comment"
                    title="Supprimer">
                    ✕
                  </button>
                </div>
              </div>

              <div class="comment-content">
                {{ comment.content }}
              </div>

              <!-- Réponses imbriquées (Tâche 1.3) -->
              <div class="sub-replies-list" *ngIf="comment.replies && comment.replies.length > 0">
                <div *ngFor="let reply of comment.replies" class="sub-reply-item">
                  <div class="sub-reply-avatar">{{ getInitial(reply.author) }}</div>
                  <div class="sub-reply-main">
                    <span class="sub-reply-author">{{ reply.author?.profile?.fullName || reply.author?.email }}</span>
                    <span class="sub-reply-date">{{ reply.createdAt | date:'short' }}</span>
                    <p class="sub-reply-content">{{ reply.content }}</p>
                  </div>
                </div>
              </div>

              <!-- Bouton Répondre au commentaire -->
              <div class="reply-toggle" *ngIf="replyingToCommentId !== comment.id">
                <button (click)="openReplyBox(comment.id)" class="btn-inline-reply">
                  Répondre
                </button>
              </div>

              <!-- Boite de sous-réponse -->
              <div class="sub-reply-box" *ngIf="replyingToCommentId === comment.id">
                <input
                  type="text"
                  [(ngModel)]="subReplyText"
                  placeholder="Écrire une précision..."
                  (keydown.enter)="submitSubReply(comment)"
                />
                <button (click)="submitSubReply(comment)" [disabled]="!subReplyText.trim()" class="btn-sub-send">Répondre</button>
                <button (click)="cancelReply()" class="btn-sub-cancel">Annuler</button>
              </div>
            </div>
          </div>
        </div>

        <div class="no-comments" *ngIf="comments.length === 0">
          <p>Aucune réponse pour l'instant. Soyez le premier à apporter votre aide !</p>
        </div>
      </section>

      <!-- Lightbox Modale avec Zoom Interactif pour Mentors -->
      <div class="lightbox-overlay animate-fade-in" *ngIf="lightboxOpen" (click)="closeLightbox()">
        <div class="lightbox-modal" (click)="$event.stopPropagation()">
          <div class="lightbox-toolbar">
            <div class="lightbox-counter">
              Capture {{ currentLightboxIndex + 1 }} sur {{ (post?.screenshotUrls?.length || 0) }}
            </div>
            <div class="lightbox-controls">
              <button type="button" (click)="zoomIn()" class="btn-tool" title="Zoom avant (+)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tool-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button type="button" (click)="zoomOut()" class="btn-tool" title="Zoom arrière (-)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tool-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button type="button" (click)="resetZoom()" class="btn-tool btn-zoom-reset" title="Réinitialiser zoom">
                {{ zoomLevel }}%
              </button>
              <button type="button" (click)="closeLightbox()" class="btn-tool btn-close" title="Fermer">✕</button>
            </div>
          </div>

          <div class="lightbox-image-viewport" (wheel)="onWheelZoom($event)">
            <img
              [src]="currentLightboxImage"
              alt="Capture en grand"
              class="lightbox-image"
              [style.transform]="'scale(' + (zoomLevel / 100) + ')'"
            />
          </div>

          <button
            type="button"
            *ngIf="(post?.screenshotUrls?.length || 0) > 1"
            (click)="prevImage()"
            class="lightbox-nav-btn prev"
            title="Image précédente">‹</button>
          <button
            type="button"
            *ngIf="(post?.screenshotUrls?.length || 0) > 1"
            (click)="nextImage()"
            class="lightbox-nav-btn next"
            title="Image suivante">›</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./help-post-detail.component.css']
})
export class HelpPostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private helpService = inject(HelpService);
  private authService = inject(AuthService);

  postId = '';
  post?: HelpPost;
  comments: HelpComment[] = [];

  newCommentText = '';
  isSubmittingComment = false;

  replyingToCommentId: string | null = null;
  subReplyText = '';

  currentUserEmail: string | null = null;

  // Lightbox & Zoom
  lightboxOpen = false;
  currentLightboxIndex = 0;
  zoomLevel = 100;

  resolveUrl(url?: string | null): string {
    return this.helpService.resolveScreenshotUrl(url);
  }

  get currentLightboxImage(): string {
    if (!this.post?.screenshotUrls || this.post.screenshotUrls.length === 0) return '';
    return this.resolveUrl(this.post.screenshotUrls[this.currentLightboxIndex]);
  }

  openLightbox(index: number): void {
    this.currentLightboxIndex = index;
    this.zoomLevel = 100;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.zoomLevel = 100;
  }

  zoomIn(): void {
    if (this.zoomLevel < 350) {
      this.zoomLevel += 25;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 50) {
      this.zoomLevel -= 25;
    }
  }

  resetZoom(): void {
    this.zoomLevel = 100;
  }

  onWheelZoom(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  prevImage(): void {
    if (!this.post?.screenshotUrls || this.post.screenshotUrls.length === 0) return;
    this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.post.screenshotUrls.length) % this.post.screenshotUrls.length;
    this.zoomLevel = 100;
  }

  nextImage(): void {
    if (!this.post?.screenshotUrls || this.post.screenshotUrls.length === 0) return;
    this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.post.screenshotUrls.length;
    this.zoomLevel = 100;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.currentUserEmail = user?.email || null;

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.postId = id;
        this.loadPost();
        this.loadComments();
      }
    });
  }

  loadPost(): void {
    this.helpService.getPostById(this.postId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.post = res.data;
        }
      },
      error: () => {
        this.router.navigate(['/dashboard/aide']);
      }
    });
  }

  loadComments(): void {
    this.helpService.getComments(this.postId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.comments = res.data;
        }
      }
    });
  }

  get typeLabel(): string {
    return this.post ? (HELP_TYPE_LABELS[this.post.type] ?? this.post.type) : '';
  }

  get statusLabel(): string {
    return this.post ? (HELP_STATUS_LABELS[this.post.status] ?? this.post.status) : '';
  }

  get statusColor(): string {
    return this.post ? (HELP_STATUS_COLORS[this.post.status] ?? 'muted') : 'muted';
  }

  getInitial(author: any): string {
    const name = author?.profile?.fullName || author?.email || 'A';
    return name.charAt(0).toUpperCase();
  }

  contactAuthor(): void {
    if (this.post?.author?.id) {
      this.router.navigate(['/dashboard/messages'], {
        queryParams: { targetUser: this.post.author.id, subject: 'Aide: ' + this.post.title }
      });
    }
  }

  deletePost(): void {
    if (!this.post) return;
    if (confirm('Voulez-vous vraiment supprimer cette publication ?')) {
      this.helpService.deletePost(this.post.id).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/aide']);
        }
      });
    }
  }

  submitComment(): void {
    if (!this.newCommentText.trim() || this.isSubmittingComment) return;
    this.isSubmittingComment = true;

    this.helpService.addComment(this.postId, { content: this.newCommentText.trim() }).subscribe({
      next: (res) => {
        this.isSubmittingComment = false;
        this.newCommentText = '';
        if (res.success && res.data) {
          this.comments.push(res.data);
          if (this.post && this.post.status === 'OUVERTE') {
            this.post.status = 'EN_COURS';
          }
        }
      },
      error: () => {
        this.isSubmittingComment = false;
      }
    });
  }

  openReplyBox(commentId: string): void {
    this.replyingToCommentId = commentId;
    this.subReplyText = '';
  }

  cancelReply(): void {
    this.replyingToCommentId = null;
    this.subReplyText = '';
  }

  submitSubReply(parentComment: HelpComment): void {
    if (!this.subReplyText.trim()) return;

    this.helpService.addComment(this.postId, {
      content: this.subReplyText.trim(),
      parentCommentId: parentComment.id
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data);
          this.cancelReply();
        }
      }
    });
  }

  acceptSolution(comment: HelpComment): void {
    if (!this.post) return;
    this.helpService.acceptComment(this.post.id, comment.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.comments.forEach(c => c.isAccepted = false);
          comment.isAccepted = true;
          this.post!.status = 'RESOLUE';
          this.post!.resolvedBy = comment.author;
        }
      }
    });
  }

  canDeleteComment(comment: HelpComment): boolean {
    if (!this.currentUserEmail) return false;
    return comment.author?.email === this.currentUserEmail || (this.post?.isAuthor ?? false);
  }

  deleteComment(comment: HelpComment): void {
    if (confirm('Supprimer cette réponse ?')) {
      this.helpService.deleteComment(this.postId, comment.id).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== comment.id);
        }
      });
    }
  }
}

