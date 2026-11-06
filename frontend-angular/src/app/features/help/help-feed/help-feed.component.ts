import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  HelpService,
  HelpPost,
  HelpPostType,
  HelpPostStatus,
  HELP_TYPE_LABELS,
  HELP_STATUS_LABELS,
  POPULAR_TAGS
} from '../../../core/services/help.service';
import { HelpPostCardComponent } from '../help-post-card/help-post-card.component';

@Component({
  selector: 'app-help-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HelpPostCardComponent],
  template: `
    <div class="help-feed-container">
      <!-- Header avec CTA de publication -->
      <header class="feed-header">
        <div class="header-titles">
          <div class="badge-title">
            <span class="pulse-dot"></span>
            Communauté & Entraide
          </div>
          <h1>🧭 Entraide, Orientation & Formations Tech</h1>
          <p>
            Posez vos questions d'orientation, sollicitez une aide sur votre code ou trouvez un mentor bénévole.
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/dashboard/aide/creer" class="btn-create-post">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Demander de l'aide</span>
          </a>
        </div>
      </header>

      <!-- Barre de recherche & Filtres (Tâches 1.4 & 1.5) -->
      <section class="filters-panel">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher une question, une orientation, une techno..."
          />
          <button *ngIf="searchQuery" (click)="clearSearch()" class="clear-btn">✕</button>
        </div>

        <!-- Filtres rapides par type -->
        <div class="type-filter-pills">
          <button
            class="filter-pill"
            [class.active]="selectedType === undefined"
            (click)="selectType(undefined)">
            Tous
          </button>
          <button
            *ngFor="let t of types"
            class="filter-pill"
            [class.active]="selectedType === t"
            (click)="selectType(t)">
            {{ typeLabels[t] }}
          </button>
        </div>

        <div class="sub-filters">
          <!-- Filtre Statut (Tâche 1.10) -->
          <div class="status-select-wrap">
            <label>Statut :</label>
            <select [(ngModel)]="selectedStatus" (ngModelChange)="loadPosts()">
              <option [ngValue]="undefined">Tous les statuts</option>
              <option value="OUVERTE">🟢 Ouverte (en attente)</option>
              <option value="EN_COURS">🟡 En cours</option>
              <option value="RESOLUE">✅ Résolue</option>
            </select>
          </div>

          <!-- Mes demandes -->
          <div class="tab-my-posts">
            <button
              class="tab-btn"
              [class.active]="showOnlyMyPosts"
              (click)="toggleMyPosts()">
              👤 Mes demandes
            </button>
          </div>
        </div>

        <!-- Tags Populaires (Tâche 1.4) -->
        <div class="tags-scroller">
          <span class="tags-label">Tags populaires :</span>
          <button
            *ngFor="let tag of popularTags"
            class="tag-bubble"
            [class.selected]="selectedTag === tag"
            (click)="selectTag(tag)">
            #{{ tag }}
          </button>
          <button *ngIf="selectedTag" (click)="selectTag(undefined)" class="clear-tag-btn">
            Effacer tag
          </button>
        </div>
      </section>

      <!-- Liste des publications -->
      <section class="posts-list-section">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des demandes d'aide...</p>
        </div>

        <div *ngIf="!isLoading && posts.length === 0" class="empty-state">
          <div class="empty-icon">🤝</div>
          <h3>Aucune publication trouvée</h3>
          <p>Soyez le premier à poser une question ou à partager une demande d'orientation tech !</p>
          <a routerLink="/dashboard/aide/creer" class="btn-primary-soft">
            + Publier la première demande
          </a>
        </div>

        <div class="posts-grid" *ngIf="!isLoading && posts.length > 0">
          <app-help-post-card
            *ngFor="let post of posts"
            [post]="post"
            (contactRequested)="onContactAuthor($event)">
          </app-help-post-card>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar" *ngIf="totalPages > 1">
          <button
            class="page-btn"
            [disabled]="currentPage === 0"
            (click)="goToPage(currentPage - 1)">
            Précédent
          </button>
          <span class="page-info">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button
            class="page-btn"
            [disabled]="currentPage >= totalPages - 1"
            (click)="goToPage(currentPage + 1)">
            Suivant
          </button>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./help-feed.component.css']
})
export class HelpFeedComponent implements OnInit {
  private helpService = inject(HelpService);
  private router = inject(Router);

  posts: HelpPost[] = [];
  isLoading = false;

  searchQuery = '';
  selectedType: HelpPostType | undefined;
  selectedStatus: HelpPostStatus | undefined;
  selectedTag: string | undefined;
  showOnlyMyPosts = false;

  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;

  types: HelpPostType[] = ['ORIENTATION', 'CODE', 'FORMATION', 'CARRIERE', 'PROJET'];
  typeLabels = HELP_TYPE_LABELS;
  popularTags = POPULAR_TAGS.slice(0, 12);

  private searchDebounceTimer?: any;

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;

    if (this.showOnlyMyPosts) {
      this.helpService.getMyPosts(this.currentPage, this.pageSize).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.posts = res.data.content || [];
            this.totalElements = res.data.totalElements || 0;
            this.totalPages = res.data.totalPages || 0;
          }
        },
        error: () => { this.isLoading = false; }
      });
      return;
    }

    this.helpService.getPosts({
      type: this.selectedType,
      status: this.selectedStatus,
      query: this.searchQuery,
      tag: this.selectedTag,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.posts = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
          this.totalPages = res.data.totalPages || 0;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadPosts();
    }, 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadPosts();
  }

  selectType(type?: HelpPostType): void {
    this.selectedType = type;
    this.currentPage = 0;
    this.loadPosts();
  }

  selectTag(tag?: string): void {
    this.selectedTag = this.selectedTag === tag ? undefined : tag;
    this.currentPage = 0;
    this.loadPosts();
  }

  toggleMyPosts(): void {
    this.showOnlyMyPosts = !this.showOnlyMyPosts;
    this.currentPage = 0;
    this.loadPosts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onContactAuthor(post: HelpPost): void {
    // Redirige vers la messagerie avec l'ID ou l'email du contact (Tâche 1.9)
    if (post.author?.id) {
      this.router.navigate(['/dashboard/messages'], {
        queryParams: { targetUser: post.author.id, subject: 'Aide: ' + post.title }
      });
    }
  }
}
