import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommunityGroupService, Group, GroupCreateRequest, GroupAccessType } from '../../../core/services/community-group.service';
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
        <div *ngIf="isLoading" class="sk-grid" aria-busy="true" aria-label="Chargement des communautés">
          <div class="sk-card" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="sk-thumb sk-shimmer"></div>
            <div class="sk-meta-row">
              <div class="sk-pill sk-shimmer"></div>
              <div class="sk-pill sk-shimmer" style="width: 84px;"></div>
            </div>
            <div class="sk-line-title sk-shimmer"></div>
            <div class="sk-line sk-shimmer"></div>
            <div class="sk-btn sk-shimmer" style="margin-top: auto;"></div>
          </div>
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
            (joinRequested)="onJoinGroup($event)"
            (editRequested)="openEditModal($event)"
            (deleteRequested)="openDeleteModal($event)">
          </app-group-card>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar" *ngIf="totalPages > 1">
          <button class="filter-pill-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Précédent</button>
          <span class="subtext">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button class="filter-pill-btn" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Suivant</button>
        </div>
      </section>

      <!-- MODAL MODIFICATION COMMUNAUTÉ -->
      <div class="modal-overlay" *ngIf="showEditModal && editingGroup" (click)="closeEditModal()">
        <div class="modal-card animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div>
                <h2>Modifier la communauté</h2>
                <p class="modal-sub">Mettez à jour les paramètres et informations de votre collectif</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeEditModal()" title="Fermer">✕</button>
          </div>

          <div class="modal-body">
            <div class="alert alert-error" *ngIf="editErrorMessage">{{ editErrorMessage }}</div>

            <!-- Nom -->
            <div class="form-group">
              <label for="edit-name">Nom de la communauté *</label>
              <input
                id="edit-name"
                type="text"
                [(ngModel)]="editForm.name"
                class="form-control"
                placeholder="Ex: Angular Dakar Hub"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="edit-desc">Description & Mission *</label>
              <textarea
                id="edit-desc"
                rows="4"
                [(ngModel)]="editForm.description"
                class="form-control"
                placeholder="Décrivez les objectifs et les thématiques du groupe..."
                required>
              </textarea>
            </div>

            <!-- Niveau d'accès -->
            <div class="form-group">
              <label>Type d'accès & Confidentialité *</label>
              <div class="access-grid-options">
                <label class="access-option-label" [class.selected]="editForm.accessType === 'PUBLIC'">
                  <input type="radio" [(ngModel)]="editForm.accessType" name="editAccess" value="PUBLIC" />
                  <div>
                    <strong>Public</strong>
                    <span>Ouvert à tous sans modération</span>
                  </div>
                </label>
                <label class="access-option-label" [class.selected]="editForm.accessType === 'OUVERT'">
                  <input type="radio" [(ngModel)]="editForm.accessType" name="editAccess" value="OUVERT" />
                  <div>
                    <strong>Sur Demande</strong>
                    <span>Adhésion soumise à validation</span>
                  </div>
                </label>
                <label class="access-option-label" [class.selected]="editForm.accessType === 'PRIVE'">
                  <input type="radio" [(ngModel)]="editForm.accessType" name="editAccess" value="PRIVE" />
                  <div>
                    <strong>Privé</strong>
                    <span>Sur invitation uniquement</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Localisation -->
            <div class="form-row-2">
              <div class="form-group">
                <label for="edit-country">Pays</label>
                <input
                  id="edit-country"
                  type="text"
                  [(ngModel)]="editForm.country"
                  class="form-control"
                  placeholder="Ex: Comores, Sénégal, Cameroun..."
                />
              </div>
              <div class="form-group">
                <label for="edit-city">Ville</label>
                <input
                  id="edit-city"
                  type="text"
                  [(ngModel)]="editForm.city"
                  class="form-control"
                  placeholder="Ex: Moroni, Dakar, Douala..."
                />
              </div>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label for="edit-tags">Technologies & Thématiques (séparées par des virgules)</label>
              <input
                id="edit-tags"
                type="text"
                [(ngModel)]="editTagsInput"
                class="form-control"
                placeholder="Ex: Angular, Spring Boot, DevOps, Cloud"
              />
            </div>

            <!-- Règles -->
            <div class="form-group">
              <label for="edit-rules">Charte & Règles de bonne conduite</label>
              <textarea
                id="edit-rules"
                rows="3"
                [(ngModel)]="editForm.rulesMarkdown"
                class="form-control"
                placeholder="Règles de courtoisie, entraide bienveillante...">
              </textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeEditModal()" [disabled]="isSubmittingEdit">Annuler</button>
            <button class="btn btn-emerald" (click)="submitEditGroup()" [disabled]="!editForm.name.trim() || !editForm.description.trim() || isSubmittingEdit">
              {{ isSubmittingEdit ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CONFIRMATION SUPPRESSION COMMUNAUTÉ -->
      <div class="modal-overlay" *ngIf="showDeleteModal && groupToDelete" (click)="closeDeleteModal()">
        <div class="modal-card modal-delete-card animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header header-danger">
            <div class="modal-title-group">
              <div class="modal-icon-badge badge-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <div>
                <h2>Supprimer la communauté</h2>
                <p class="modal-sub">Action irréversible</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeDeleteModal()" title="Fermer">✕</button>
          </div>

          <div class="modal-body">
            <div class="alert alert-error" *ngIf="deleteErrorMessage">{{ deleteErrorMessage }}</div>

            <p class="delete-warning-text">
              Êtes-vous certain de vouloir supprimer définitivement la communauté <strong>« {{ groupToDelete.name }} »</strong> ?
            </p>
            <div class="delete-consequences-box">
              <p>Cette action irréversible entraînera :</p>
              <ul>
                <li>La suppression de tous les salons et messages de chat</li>
                <li>La suppression de toutes les publications de la communauté</li>
                <li>Le retrait automatique de l'ensemble des membres</li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeDeleteModal()" [disabled]="isDeletingGroup">Annuler</button>
            <button class="btn btn-danger" (click)="confirmDeleteGroup()" [disabled]="isDeletingGroup">
              {{ isDeletingGroup ? 'Suppression en cours...' : 'Oui, supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
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

  // État Modal d'Édition
  showEditModal = false;
  editingGroup: Group | null = null;
  editForm: GroupCreateRequest = {
    name: '',
    slug: '',
    description: '',
    accessType: 'PUBLIC',
    tags: [],
    country: '',
    city: '',
    rulesMarkdown: '',
    avatarUrl: '',
    bannerUrl: ''
  };
  editTagsInput = '';
  isSubmittingEdit = false;
  editErrorMessage = '';

  // État Modal de Suppression
  showDeleteModal = false;
  groupToDelete: Group | null = null;
  isDeletingGroup = false;
  deleteErrorMessage = '';

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

  // --- ACTIONS D'ÉDITION ---
  openEditModal(group: Group): void {
    this.editingGroup = group;
    this.editForm = {
      name: group.name,
      slug: group.slug,
      description: group.description,
      accessType: group.accessType,
      tags: group.tags ? [...group.tags] : [],
      country: group.country || '',
      city: group.city || '',
      rulesMarkdown: group.rulesMarkdown || '',
      avatarUrl: group.avatarUrl,
      bannerUrl: group.bannerUrl
    };
    this.editTagsInput = group.tags ? group.tags.join(', ') : '';
    this.editErrorMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingGroup = null;
    this.editErrorMessage = '';
  }

  submitEditGroup(): void {
    if (!this.editingGroup) return;
    if (!this.editForm.name.trim() || !this.editForm.description.trim()) {
      this.editErrorMessage = 'Le nom et la description sont obligatoires.';
      return;
    }

    // Traitement des tags
    this.editForm.tags = this.editTagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    this.isSubmittingEdit = true;
    this.editErrorMessage = '';

    this.groupService.updateGroup(this.editingGroup.id, this.editForm).subscribe({
      next: (res) => {
        this.isSubmittingEdit = false;
        if (res.success && res.data) {
          this.actionSuccessMessage = `La communauté "${res.data.name}" a été mise à jour avec succès.`;
          this.closeEditModal();
          this.loadGroups();
          setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
        } else {
          this.editErrorMessage = 'Erreur lors de la mise à jour de la communauté.';
        }
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        this.editErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors de la mise à jour de la communauté.';
      }
    });
  }

  // --- ACTIONS DE SUPPRESSION ---
  openDeleteModal(group: Group): void {
    this.groupToDelete = group;
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.groupToDelete = null;
    this.deleteErrorMessage = '';
  }

  confirmDeleteGroup(): void {
    if (!this.groupToDelete) return;
    const deletedGroupName = this.groupToDelete.name;
    this.isDeletingGroup = true;
    this.deleteErrorMessage = '';

    this.groupService.deleteGroup(this.groupToDelete.id).subscribe({
      next: (res) => {
        this.isDeletingGroup = false;
        this.actionSuccessMessage = `La communauté "${deletedGroupName}" a été supprimée avec succès.`;
        this.closeDeleteModal();
        this.loadGroups();
        setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
      },
      error: (err) => {
        this.isDeletingGroup = false;
        this.deleteErrorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors de la suppression de la communauté.';
      }
    });
  }
}
