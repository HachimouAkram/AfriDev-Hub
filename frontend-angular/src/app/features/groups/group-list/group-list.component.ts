import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommunityGroupService, Group } from '../../../core/services/community-group.service';
import { GroupCardComponent } from '../group-card/group-card.component';
import { POPULAR_TAGS } from '../../../core/services/help.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GroupCardComponent],
  template: `
    <div class="projects-dashboard-page animate-fade-in">
      <!-- 1. En-tête identique à Événements -->
      <div class="projects-header-card app-card">
        <div class="header-text-group">
          <h2>Groupes & Communautés Panafricaines</h2>
          <p class="subtext">
            Rejoignez des collectifs de développeurs par technologie, pays ou centre d'intérêt, partagez vos ressources et échangez entre pairs.
          </p>
        </div>

        <div class="header-buttons-wrap">
          <a routerLink="/dashboard/groupes/creer" class="btn btn-emerald btn-icon-text">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Créer un Groupe</span>
          </a>
        </div>
      </div>

      <!-- 2. Filtres Pills identiques à Événements -->
      <div class="category-filters-row">
        <button
          class="filter-pill-btn"
          [class.active]="currentTab === 'discover'"
          (click)="switchTab('discover')">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
          </svg>
          <span>Explorer les groupes</span>
        </button>
        <button
          class="filter-pill-btn"
          [class.active]="currentTab === 'my-groups'"
          (click)="switchTab('my-groups')">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>Mes Groupes</span>
        </button>

        <span class="pill-divider" *ngIf="currentTab === 'discover'"></span>

        <button
          *ngFor="let t of popularTags"
          (click)="selectTag(t)"
          class="filter-pill-btn"
          [class.active]="selectedTag === t"
          [hidden]="currentTab !== 'discover'">
          <span>#{{ t }}</span>
        </button>
      </div>

      <!-- 3. Contrôles & Barre de Recherche (Identique à Événements) -->
      <div class="controls-bar app-card" *ngIf="currentTab === 'discover'">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher une communauté (ex: Angular Dakar, Cloud Cameroon, Python)..."
            class="form-input search-input"
          />
        </div>

        <div class="select-filters-group">
          <select [(ngModel)]="selectedCountry" (ngModelChange)="loadGroups()" class="filter-select">
            <option value="">Tous les pays</option>
            <option value="Sénégal">Sénégal</option>
            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
            <option value="Cameroun">Cameroun</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="RDC">RDC</option>
            <option value="Bénin">Bénin</option>
            <option value="Togo">Togo</option>
            <option value="Maroc">Maroc</option>
          </select>
        </div>

        <div class="counter-badge">
          Total : <strong>{{ totalElements }}</strong> communauté(s)
        </div>
      </div>

      <!-- Message succès/info -->
      <div class="alert alert-success" *ngIf="actionSuccessMessage">{{ actionSuccessMessage }}</div>

      <!-- Grille des groupes -->
      <section class="groups-content-section">
        <div *ngIf="isLoading" class="loading-state app-card">
          <div class="spinner"></div>
          <p class="subtext">Chargement des communautés...</p>
        </div>

        <div *ngIf="!isLoading && groups.length === 0" class="empty-state app-card">
          <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3>Aucun groupe trouvé</h3>
          <p class="subtext" *ngIf="currentTab === 'discover'">Soyez le premier expert à lancer une communauté sur ce domaine !</p>
          <p class="subtext" *ngIf="currentTab === 'my-groups'">Vous n'avez pas encore rejoint de communauté.</p>
          <a routerLink="/dashboard/groupes/creer" class="btn btn-emerald btn-icon-text">
            <span>Créer le premier groupe</span>
          </a>
        </div>

        <div class="groups-grid" *ngIf="!isLoading && groups.length > 0">
          <app-group-card
            *ngFor="let g of groups"
            [group]="g"
            (joinRequested)="onJoinGroup($event)">
          </app-group-card>
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
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  private groupService = inject(CommunityGroupService);
  private router = inject(Router);

  currentTab: 'discover' | 'my-groups' = 'discover';
  groups: Group[] = [];
  isLoading = false;

  searchQuery = '';
  selectedCountry = '';
  selectedTag = '';

  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;

  popularTags = ['Angular', 'Spring Boot', 'Python', 'DevOps', 'Mobile', 'Data', 'Web'];
  actionSuccessMessage = '';
  private searchTimer?: any;

  ngOnInit(): void {
    this.loadGroups();
  }

  switchTab(tab: 'discover' | 'my-groups'): void {
    this.currentTab = tab;
    this.currentPage = 0;
    this.loadGroups();
  }

  selectTag(tag: string): void {
    this.selectedTag = this.selectedTag === tag ? '' : tag;
    this.currentPage = 0;
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    if (this.currentTab === 'discover') {
      this.groupService.searchGroups(this.searchQuery, this.selectedTag, this.selectedCountry, this.currentPage, this.pageSize).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.groups = res.data.content || [];
            this.totalElements = res.data.totalElements || 0;
            this.totalPages = res.data.totalPages || 0;
          }
        },
        error: () => { this.isLoading = false; }
      });
    } else {
      this.groupService.getMyGroups(this.currentPage, this.pageSize).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.groups = res.data.content || [];
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
      this.loadGroups();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadGroups();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onJoinGroup(group: Group): void {
    this.groupService.joinGroup(group.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.status === 'ACTIVE') {
            group.isMember = true;
            group.memberCount += 1;
            this.actionSuccessMessage = `Vous avez rejoint "${group.name}".`;
          } else {
            group.isPending = true;
            this.actionSuccessMessage = `Demande d'adhésion envoyée pour "${group.name}".`;
          }
          setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
        }
      }
    });
  }
}
