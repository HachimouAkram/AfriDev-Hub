import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommunityGroupService, Group, GroupCreateRequest } from '../../../core/services/community-group.service';
import { AuthService } from '../../../core/services/auth.service';
import { GroupCardComponent } from '../group-card/group-card.component';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GroupCardComponent],
  template: `
    <div class="projects-dashboard-page animate-fade-in">
      <!-- 1. En-tête harmonisé Dashboard -->
      <div class="projects-header-card app-card">
        <div class="header-text-group">
          <h2>Mes Communautés</h2>
          <p class="subtext">
            Gérez les collectifs que vous animez et accédez aux communautés panafricaines que vous avez rejointes en tant que membre.
          </p>
        </div>

        <div class="header-buttons-wrap">
          <a routerLink="/communautes" class="btn btn-outline btn-icon-text" title="Explorer la vitrine complète des communautés">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
            </svg>
            <span>Explorer la Vitrine</span>
          </a>

          <a routerLink="/dashboard/groupes/creer" class="btn btn-emerald btn-icon-text">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Créer un Groupe</span>
          </a>
        </div>
      </div>

      <!-- 2. Onglets Catégories : Toutes / Créées par moi / Rejointes comme membre -->
      <div class="category-filters-row">
        <button
          class="filter-pill-btn"
          [class.active]="currentTab === 'all'"
          (click)="switchTab('all')">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span>Toutes mes communautés ({{ allMyGroups.length }})</span>
        </button>

        <button
          class="filter-pill-btn"
          [class.active]="currentTab === 'created'"
          (click)="switchTab('created')">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Créées par moi ({{ createdGroups.length }})</span>
        </button>

        <button
          class="filter-pill-btn"
          [class.active]="currentTab === 'joined'"
          (click)="switchTab('joined')">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>Rejointes comme membre ({{ joinedGroups.length }})</span>
        </button>
      </div>

      <!-- 3. Contrôles & Filtres Rapides dans mes communautés -->
      <div class="controls-bar app-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
            placeholder="Rechercher dans mes communautés..."
            class="form-input search-input"
          />
        </div>

        <div class="select-filters-group">
          <select [(ngModel)]="selectedCountry" (ngModelChange)="applyFilters()" class="filter-select">
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
          Total : <strong>{{ displayedGroups.length }}</strong> communauté(s)
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

        <!-- Empty states par onglet -->
        <div *ngIf="!isLoading && displayedGroups.length === 0" class="empty-state app-card">
          <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>

          <ng-container *ngIf="currentTab === 'created'">
            <h3>Aucune communauté créée</h3>
            <p class="subtext">Vous n'avez pas encore créé de communauté. Fédérez des talents africains autour de votre technologie ou projet !</p>
            <div class="empty-btns-row">
              <a routerLink="/dashboard/groupes/creer" class="btn btn-emerald btn-icon-text">
                <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Créer ma première communauté</span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="currentTab === 'joined'">
            <h3>Aucune communauté rejointe</h3>
            <p class="subtext">Vous n'avez pas encore intégré de communauté en tant que membre. Explorez la vitrine pour découvrir des collectifs passionnants !</p>
            <div class="empty-btns-row">
              <a routerLink="/communautes" class="btn btn-emerald btn-icon-text">
                <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
                </svg>
                <span>Découvrir les communautés sur la Vitrine</span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="currentTab === 'all'">
            <h3>Aucune communauté pour le moment</h3>
            <p class="subtext">Vous n'avez encore rejoint ou créé aucune communauté sur AfriDev Hub.</p>
            <div class="empty-btns-row">
              <a routerLink="/dashboard/groupes/creer" class="btn btn-emerald btn-icon-text">
                <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Créer un Groupe</span>
              </a>
              <a routerLink="/communautes" class="btn btn-outline btn-icon-text">
                <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 000 18 14.25 14.25 0 000-18z" />
                </svg>
                <span>Explorer la Vitrine</span>
              </a>
            </div>
          </ng-container>
        </div>

        <div class="groups-grid" *ngIf="!isLoading && displayedGroups.length > 0">
          <app-group-card
            *ngFor="let g of displayedGroups"
            [group]="g"
            (joinRequested)="onJoinGroup($event)"
            (editRequested)="openEditModal($event)"
            (deleteRequested)="openDeleteModal($event)">
          </app-group-card>
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
              <label for="edit-tags">Tags & Technologies (séparés par des virgules)</label>
              <input
                id="edit-tags"
                type="text"
                [(ngModel)]="editTagsInput"
                class="form-control"
                placeholder="Ex: Angular, TypeScript, Dakar, Frontend"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeEditModal()" [disabled]="isSubmittingEdit">Annuler</button>
            <button class="btn btn-emerald" (click)="saveEditGroup()" [disabled]="isSubmittingEdit">
              {{ isSubmittingEdit ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL SUPPRESSION COMMUNAUTÉ -->
      <div class="modal-overlay" *ngIf="showDeleteModal && groupToDelete" (click)="closeDeleteModal()">
        <div class="modal-card modal-card-danger animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon-badge badge-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2>Supprimer la communauté</h2>
                <p class="modal-sub">Action critique et irréversible</p>
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
  private authService = inject(AuthService);
  private router = inject(Router);

  currentTab: 'all' | 'created' | 'joined' = 'all';

  allMyGroups: Group[] = [];
  createdGroups: Group[] = [];
  joinedGroups: Group[] = [];
  displayedGroups: Group[] = [];

  isLoading = false;
  searchQuery = '';
  selectedCountry = '';

  actionSuccessMessage = '';

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

  isOwnerOrCreator(group: Group): boolean {
    const current = this.authService.currentUser();
    if (!current) return false;
    return group.userRole === 'OWNER' ||
           group.owner?.id === current.id ||
           group.owner?.email === current.email;
  }

  switchTab(tab: 'all' | 'created' | 'joined'): void {
    this.currentTab = tab;
    this.applyFilters();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getMyGroups(0, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const list: Group[] = res.data.content || [];
          this.allMyGroups = list;
          this.createdGroups = list.filter(g => this.isOwnerOrCreator(g));
          this.joinedGroups = list.filter(g => !this.isOwnerOrCreator(g));
          this.applyFilters();
        } else {
          this.allMyGroups = [];
          this.createdGroups = [];
          this.joinedGroups = [];
          this.displayedGroups = [];
        }
      },
      error: () => {
        this.isLoading = false;
        this.allMyGroups = [];
        this.createdGroups = [];
        this.joinedGroups = [];
        this.displayedGroups = [];
      }
    });
  }

  applyFilters(): void {
    let list: Group[] = [];
    if (this.currentTab === 'created') {
      list = [...this.createdGroups];
    } else if (this.currentTab === 'joined') {
      list = [...this.joinedGroups];
    } else {
      list = [...this.allMyGroups];
    }

    if (this.selectedCountry) {
      list = list.filter(g => g.country && g.country.toLowerCase() === this.selectedCountry.toLowerCase());
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(g =>
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.city && g.city.toLowerCase().includes(q)) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    this.displayedGroups = list;
  }

  onJoinGroup(group: Group): void {
    this.groupService.joinGroup(group.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.status === 'ACTIVE') {
            group.isMember = true;
            group.memberCount = (group.memberCount || 0) + 1;
            this.actionSuccessMessage = `Vous avez rejoint "${group.name}".`;
          } else {
            group.isPending = true;
            this.actionSuccessMessage = `Demande d'adhésion envoyée pour "${group.name}".`;
          }
          this.loadGroups();
          setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
        }
      }
    });
  }

  openEditModal(group: Group): void {
    this.editingGroup = group;
    this.editErrorMessage = '';
    this.editForm = {
      name: group.name,
      slug: group.slug,
      description: group.description,
      accessType: group.accessType,
      tags: group.tags ? [...group.tags] : [],
      country: group.country || '',
      city: group.city || '',
      rulesMarkdown: group.rulesMarkdown || '',
      avatarUrl: group.avatarUrl || '',
      bannerUrl: group.bannerUrl || ''
    };
    this.editTagsInput = group.tags ? group.tags.join(', ') : '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingGroup = null;
    this.editErrorMessage = '';
  }

  saveEditGroup(): void {
    if (!this.editingGroup) return;
    if (!this.editForm.name.trim() || !this.editForm.description.trim()) {
      this.editErrorMessage = 'Veuillez remplir les champs obligatoires (nom et description).';
      return;
    }

    this.editForm.tags = this.editTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    this.isSubmittingEdit = true;
    this.editErrorMessage = '';

    this.groupService.updateGroup(this.editingGroup.id, this.editForm).subscribe({
      next: (res) => {
        this.isSubmittingEdit = false;
        if (res.success) {
          this.actionSuccessMessage = `La communauté « ${res.data.name} » a été mise à jour avec succès.`;
          this.closeEditModal();
          this.loadGroups();
          setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
        }
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        this.editErrorMessage = err.error?.error?.message || 'Erreur lors de la mise à jour de la communauté.';
      }
    });
  }

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
    this.isDeletingGroup = true;
    this.deleteErrorMessage = '';

    this.groupService.deleteGroup(this.groupToDelete.id).subscribe({
      next: (res) => {
        this.isDeletingGroup = false;
        if (res.success) {
          this.actionSuccessMessage = `La communauté « ${this.groupToDelete?.name} » a été supprimée avec succès.`;
          this.closeDeleteModal();
          this.loadGroups();
          setTimeout(() => { this.actionSuccessMessage = ''; }, 4000);
        }
      },
      error: (err) => {
        this.isDeletingGroup = false;
        this.deleteErrorMessage = err.error?.error?.message || 'Erreur lors de la suppression de la communauté.';
      }
    });
  }
}
