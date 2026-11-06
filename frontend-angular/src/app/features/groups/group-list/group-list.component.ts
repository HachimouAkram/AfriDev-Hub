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
    <div class="groups-page-container">
      <header class="groups-header">
        <div class="header-titles">
          <div class="badge-header">👥 Espaces & Communautés Tech</div>
          <h1>Groupes & Communautés Panafricaines</h1>
          <p>
            Rejoignez des collectifs de développeurs par technologie, pays ou centre d'intérêt, partagez vos ressources et échangez entre pairs.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/dashboard/groupes/creer" class="btn-create-group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Créer un Groupe</span>
          </a>
        </div>
      </header>

      <!-- Onglets : Découvrir vs Mes Groupes -->
      <div class="tabs-row">
        <button
          class="tab-btn"
          [class.active]="currentTab === 'discover'"
          (click)="switchTab('discover')">
          🌐 Explorer les groupes
        </button>
        <button
          class="tab-btn"
          [class.active]="currentTab === 'my-groups'"
          (click)="switchTab('my-groups')">
          ⭐ Mes Groupes
        </button>
      </div>

      <!-- Filtres & Recherche -->
      <section class="filters-bar" *ngIf="currentTab === 'discover'">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher une communauté (ex: Angular Dakar, Cloud Cameroon, Python)..."
          />
        </div>

        <div class="select-filters">
          <select [(ngModel)]="selectedCountry" (ngModelChange)="loadGroups()">
            <option value="">🌍 Tous les pays</option>
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

          <select [(ngModel)]="selectedTag" (ngModelChange)="loadGroups()">
            <option value="">🎯 Toutes technologies</option>
            <option *ngFor="let t of tagsList" [value]="t">{{ t }}</option>
          </select>
        </div>
      </section>

      <!-- Message succès/info -->
      <div class="alert alert-success" *ngIf="actionSuccessMessage">{{ actionSuccessMessage }}</div>

      <!-- Grille des groupes -->
      <section class="groups-grid-section">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des communautés...</p>
        </div>

        <div *ngIf="!isLoading && groups.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Aucun groupe trouvé</h3>
          <p *ngIf="currentTab === 'discover'">Soyez le premier expert à lancer une communauté sur ce domaine !</p>
          <p *ngIf="currentTab === 'my-groups'">Vous n'avez pas encore rejoint de communauté.</p>
          <a routerLink="/dashboard/groupes/creer" class="btn-primary-soft">+ Créer le premier groupe</a>
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
          <button class="page-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Précédent</button>
          <span class="page-info">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Suivant</button>
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

  tagsList = POPULAR_TAGS.slice(0, 15);
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

  loadGroups(): void {
    this.isLoading = true;
    this.actionSuccessMessage = '';

    if (this.currentTab === 'my-groups') {
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
      return;
    }

    this.groupService.searchGroups(this.selectedCountry, this.selectedTag, this.searchQuery, this.currentPage, this.pageSize).subscribe({
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

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadGroups();
    }, 350);
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
            this.actionSuccessMessage = `🎉 Vous avez rejoint le groupe "${group.name}" !`;
          } else {
            group.isPending = true;
            this.actionSuccessMessage = `⏳ Votre demande pour rejoindre "${group.name}" a été transmise aux administrateurs.`;
          }
        }
      }
    });
  }
}

