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
  POPULAR_TAGS
} from '../../../core/services/help.service';
import { HelpPostCardComponent } from '../help-post-card/help-post-card.component';

@Component({
  selector: 'app-help-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HelpPostCardComponent],
  template: `
    <div class="projects-dashboard-page animate-fade-in">
      <!-- 1. En-tête identique à Événements -->
      <div class="projects-header-card app-card">
        <div class="header-text-group">
          <h2>Entraide, Orientation & Formations Tech</h2>
          <p class="subtext">
            Posez vos questions d'orientation, sollicitez une aide sur votre code ou trouvez un mentor bénévole auprès de la communauté.
          </p>
        </div>

        <div class="header-buttons-wrap">
          <a routerLink="/dashboard/aide/creer" class="btn btn-emerald btn-icon-text">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Demander de l'aide</span>
          </a>
        </div>
      </div>

      <!-- 2. Filtres Pills par Type (Identique à Événements) -->
      <div class="category-filters-row">
        <button
          class="filter-pill-btn"
          [class.active]="selectedType === undefined && !showOnlyMyPosts"
          (click)="selectType(undefined)">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span>Tous les sujets</span>
        </button>

        <button
          *ngFor="let t of types"
          class="filter-pill-btn"
          [class.active]="selectedType === t && !showOnlyMyPosts"
          (click)="selectType(t)">
          <span>{{ typeLabels[t] }}</span>
        </button>

        <span class="pill-divider"></span>

        <button
          class="filter-pill-btn"
          [class.active]="showOnlyMyPosts"
          (click)="toggleMyPosts()">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>Mes demandes</span>
        </button>
      </div>

      <!-- 3. Contrôles & Barre de Recherche (Identique à Événements) -->
      <div class="controls-bar app-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher une question, une orientation, une techno..."
            class="form-input search-input"
          />
        </div>

        <div class="select-filters-group">
          <select [(ngModel)]="selectedStatus" (ngModelChange)="loadPosts()" class="filter-select">
            <option [ngValue]="undefined">Tous les statuts</option>
            <option value="OUVERTE">Ouverte (en attente)</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLUE">Résolue</option>
          </select>
        </div>

        <div class="counter-badge">
          Total : <strong>{{ totalElements }}</strong> demande(s)
        </div>
      </div>

      <!-- Tags rapides -->
      <div class="tags-filter-bar">
        <span class="tags-intro-label">Tags populaires :</span>
        <div class="tags-scroll-wrap">
          <button
            *ngFor="let tag of popularTags"
            class="tag-pill-btn"
            [class.active]="selectedTag === tag"
            (click)="selectTag(tag)">
            #{{ tag }}
          </button>
          <button *ngIf="selectedTag" (click)="selectTag(undefined)" class="tag-pill-btn tag-clear-btn">
            Effacer tag
          </button>
        </div>
      </div>

      <!-- Liste des publications -->
      <section class="posts-content-section">
        <div *ngIf="isLoading" class="loading-state app-card">
          <div class="spinner"></div>
          <p class="subtext">Chargement des demandes d'aide...</p>
        </div>

        <div *ngIf="!isLoading && posts.length === 0" class="empty-state app-card">
          <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <h3>Aucune publication trouvée</h3>
          <p class="subtext">Soyez le premier à poser une question ou à partager une demande d'orientation tech !</p>
          <a routerLink="/dashboard/aide/creer" class="btn btn-emerald btn-icon-text">
            <span>Publier une demande</span>
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
          <button class="filter-pill-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Précédent</button>
          <span class="subtext">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button class="filter-pill-btn" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Suivant</button>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./help-feed.component.css']
})
export class HelpFeedComponent implements OnInit {
  private helpService = inject(HelpService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  posts: HelpPost[] = [];
  isLoading = false;

  searchQuery = '';
  selectedType?: HelpPostType;
  selectedStatus?: HelpPostStatus;
  selectedTag?: string;
  showOnlyMyPosts = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  types: HelpPostType[] = ['ORIENTATION', 'CODE', 'FORMATION', 'CARRIERE', 'PROJET'];
  typeLabels = HELP_TYPE_LABELS;
  popularTags = POPULAR_TAGS.slice(0, 10);

  private searchTimer?: any;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tag']) {
        this.selectedTag = params['tag'];
      }
      if (params['type']) {
        this.selectedType = params['type'] as HelpPostType;
      }
      this.loadPosts();
    });
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
    } else {
      this.helpService.getPosts({
        type: this.selectedType,
        status: this.selectedStatus,
        tag: this.selectedTag,
        query: this.searchQuery,
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
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadPosts();
    }, 300);
  }

  selectType(type?: HelpPostType): void {
    this.showOnlyMyPosts = false;
    this.selectedType = type;
    this.currentPage = 0;
    this.loadPosts();
  }

  toggleMyPosts(): void {
    this.showOnlyMyPosts = !this.showOnlyMyPosts;
    this.currentPage = 0;
    this.loadPosts();
  }

  selectTag(tag?: string): void {
    this.selectedTag = tag;
    this.currentPage = 0;
    this.loadPosts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onContactAuthor(post: HelpPost): void {
    const authorId = post.author?.id;
    if (authorId) {
      this.router.navigate(['/dashboard/messages'], {
        queryParams: { targetUser: authorId, subject: `Aide : ${post.title}` }
      });
    }
  }
}
