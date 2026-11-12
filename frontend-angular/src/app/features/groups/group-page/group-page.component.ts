import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CommunityGroupService,
  Group,
  GroupMember,
  GroupPost,
  GroupPostCreateRequest,
  GroupMemberRole,
  GroupMemberStatus
} from '../../../core/services/community-group.service';
import { AuthService } from '../../../core/services/auth.service';
import { GroupChatComponent } from '../group-chat/group-chat.component';

@Component({
  selector: 'app-group-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, GroupChatComponent],
  template: `
    <div class="group-page-container" *ngIf="group">
      <!-- En-tête / Bannière du Groupe -->
      <header class="group-header-card">
        <div class="banner-area" [style.background-image]="group.bannerUrl ? 'url(' + group.bannerUrl + ')' : null">
          <div class="banner-gradient"></div>

          <!-- Actions de couverture pour le Propriétaire ou l'Admin -->
          <div class="banner-cover-actions" *ngIf="canManageGroup()">
            <label class="btn-cover-pill" [class.loading]="isUploadingBanner" title="Changer la photo de couverture">
              <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span>{{ isUploadingBanner ? 'Envoi...' : (group.bannerUrl ? 'Modifier la couverture' : 'Ajouter une couverture') }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onBannerSelected($event)" [disabled]="isUploadingBanner" style="display: none;" />
            </label>

            <button *ngIf="group.bannerUrl" (click)="removeBanner()" class="btn-cover-pill btn-cover-remove" title="Supprimer la couverture">
              <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        <div class="header-main">
          <div class="avatar-and-info">
            <div class="group-big-avatar">
              <span *ngIf="!group.avatarUrl">{{ getInitial(group.name) }}</span>
              <img *ngIf="group.avatarUrl" [src]="group.avatarUrl" [alt]="group.name" />
            </div>

            <div class="group-info-text">
              <div class="title-row">
                <h1>{{ group.name }}</h1>
                <span class="badge-access">{{ getAccessLabel(group.accessType) }}</span>
                <span *ngIf="group.userRole" class="badge-role">Rôle : {{ group.userRole }}</span>
              </div>
              <p class="group-subline">
                Créé par {{ group.owner?.profile?.fullName || group.owner?.email }} •
                {{ group.memberCount }} membre{{ group.memberCount > 1 ? 's' : '' }} •
                {{ group.postCount }} publication{{ group.postCount > 1 ? 's' : '' }}
                <span *ngIf="group.country"> • {{ group.country }}</span>
              </p>
            </div>
          </div>

          <div class="header-actions-box">
            <!-- Bouton Rejoindre / Quitter -->
            <button
              *ngIf="!group.isMember && !group.isPending"
              (click)="joinGroup()"
              [disabled]="isJoining"
              class="btn-primary-action">
              Rejoindre la communauté
            </button>

            <span *ngIf="group.isPending" class="badge-pending-large">
              Adhésion en attente d'approbation
            </span>

            <button
              *ngIf="group.isMember && group.userRole !== 'OWNER'"
              (click)="leaveGroup()"
              class="btn-outline-danger">
              Quitter
            </button>
          </div>
        </div>

        <!-- Onglets de Navigation interne -->
        <nav class="group-tabs-nav">
          <button
            class="tab-link"
            [class.active]="activeTab === 'feed'"
            (click)="activeTab = 'feed'">
            Publications & Échanges
          </button>
          <button
            *ngIf="group.isMember"
            class="tab-link"
            [class.active]="activeTab === 'chat'"
            (click)="activeTab = 'chat'">
            Salons & Chat Direct
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'about'"
            (click)="activeTab = 'about'">
            À propos & Règles
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'members'"
            (click)="activeTab = 'members'; loadMembers()">
            Membres ({{ group.memberCount }})
          </button>
          <button
            *ngIf="canManageGroup()"
            class="tab-link"
            [class.active]="activeTab === 'admin'"
            (click)="activeTab = 'admin'; loadPendingMembers(); loadBannedMembers()">
            Administration & Modération
          </button>
        </nav>
      </header>

      <!-- Message alerte succès/erreur -->
      <div class="alert alert-success" *ngIf="actionSuccessMessage">{{ actionSuccessMessage }}</div>
      <div class="alert alert-error" *ngIf="actionErrorMessage">{{ actionErrorMessage }}</div>

      <!-- ONGLET 1 : FEED DES PUBLICATIONS -->
      <main *ngIf="activeTab === 'feed'" class="feed-tab-content">
        <!-- Formulaire de publication (Membres seulement) -->
        <div class="create-post-card" *ngIf="group.isMember">
          <h3>Publier dans la communauté</h3>
          <input
            type="text"
            [(ngModel)]="newPost.title"
            placeholder="Titre de votre publication, ressource ou annonce..."
            class="input-post-title"
          />
          <textarea
            [(ngModel)]="newPost.content"
            rows="3"
            placeholder="Partagez une astuce, une question, un tutoriel ou un projet avec les membres..."
            class="textarea-post-content">
          </textarea>

          <div class="post-options-bar">
            <div class="select-options">
              <select [(ngModel)]="newPost.type">
                <option value="DISCUSSION">Discussion</option>
                <option value="RESSOURCE">Ressource & Code</option>
                <option value="ANNONCE">Annonce</option>
                <option value="EVENEMENT">Événement</option>
              </select>

              <select [(ngModel)]="newPost.visibility">
                <option value="PUBLIC">Visible par tous</option>
                <option value="MEMBRES_SEULEMENT">Membres seulement</option>
              </select>

              <label *ngIf="canManageGroup()" class="checkbox-pin">
                <input type="checkbox" [(ngModel)]="newPost.isPinned" />
                <span>Épingler</span>
              </label>
            </div>

            <button
              (click)="submitPost()"
              [disabled]="!newPost.title.trim() || !newPost.content.trim() || isSubmittingPost"
              class="btn-send-post">
              Publier (+15 XP)
            </button>
          </div>
        </div>

        <!-- Non-membre CTA -->
        <div class="guest-banner" *ngIf="!group.isMember">
          <p>Rejoignez cette communauté pour publier, commenter et échanger avec les membres.</p>
          <button (click)="joinGroup()" class="btn-primary-action btn-sm">Rejoindre</button>
        </div>

        <!-- Liste des publications -->
        <div class="posts-list">
          <div *ngIf="isLoadingPosts" class="sk-stack" aria-busy="true" aria-label="Chargement des publications">
            <div class="sk-card" *ngFor="let i of [1,2,3]">
              <div class="sk-meta-row">
                <div class="sk-avatar sk-avatar-round sk-shimmer"></div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
                  <div class="sk-line sk-shimmer" style="width: 46%;"></div>
                  <div class="sk-line-sm sk-shimmer" style="width: 28%;"></div>
                </div>
              </div>
              <div class="sk-line-title sk-shimmer"></div>
              <div class="sk-line sk-shimmer"></div>
              <div class="sk-line sk-line-sm sk-shimmer" style="width: 72%;"></div>
            </div>
          </div>

          <div *ngIf="!isLoadingPosts && posts.length === 0" class="empty-feed">
            <p>Aucune publication pour l'instant. Soyez le premier à animer le groupe !</p>
          </div>

          <article *ngFor="let post of posts" class="group-post-item" [class.pinned-post]="post.isPinned">
            <div class="post-pinned-badge" *ngIf="post.isPinned">Publication Épinglée</div>

            <div class="post-header">
              <div class="author-meta">
                <div class="author-circle">{{ getInitial(post.author?.profile?.fullName || post.author?.email) }}</div>
                <div>
                  <span class="author-name">{{ post.author?.profile?.fullName || post.author?.email }}</span>
                  <span class="post-time">{{ post.createdAt | date:'short' }}</span>
                </div>
              </div>

              <div class="post-badges">
                <span class="badge-post-type">{{ post.type }}</span>
                <span class="badge-post-vis" *ngIf="post.visibility === 'MEMBRES_SEULEMENT'">Membres</span>
                <button *ngIf="post.canEditOrDelete" (click)="deletePost(post)" class="btn-del-post" title="Supprimer">✕</button>
              </div>
            </div>

            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-content">{{ post.content }}</p>
          </article>
        </div>
      </main>

      <!-- ONGLET 2 : SALONS & CHAT DIRECT -->
      <section *ngIf="activeTab === 'chat' && group.isMember" class="chat-tab-content">
        <app-group-chat [groupId]="group.id" [canManageChannels]="canManageGroup()"></app-group-chat>
      </section>

      <!-- ONGLET 3 : À PROPOS & RÈGLES -->
      <section *ngIf="activeTab === 'about'" class="about-tab-content">
        <div class="info-card">
          <h3>Description du groupe</h3>
          <p>{{ group.description }}</p>
        </div>

        <div class="info-card" *ngIf="group.rulesMarkdown">
          <h3>Charte & Règles de la communauté</h3>
          <div class="rules-box">{{ group.rulesMarkdown }}</div>
        </div>

        <div class="info-card">
          <h3>Technologies & Thématiques</h3>
          <div class="tags-row">
            <span class="tag-pill" *ngFor="let t of group.tags">#{{ t }}</span>
          </div>
        </div>
      </section>

      <!-- ONGLET 3 : MEMBRES -->
      <section *ngIf="activeTab === 'members'" class="members-tab-content">
        <div class="members-grid">
          <div *ngFor="let m of members" class="member-card">
            <div class="member-avatar">{{ getInitial(m.user?.profile?.fullName || m.user?.email) }}</div>
            <div class="member-info">
              <strong>{{ m.user?.profile?.fullName || m.user?.email }}</strong>
              <span class="member-role" [class.role-owner]="m.role === 'OWNER'" [class.role-admin]="m.role === 'ADMIN'">{{ m.role }}</span>
              <span class="member-date">Membre depuis {{ m.joinedAt | date:'MMM yyyy' }}</span>
            </div>

            <!-- Action Bloquer pour Admin/Owner -->
            <div class="member-card-actions" *ngIf="canManageGroup() && m.role !== 'OWNER' && m.user?.id !== currentUserId">
              <button (click)="openBanModal(m)" class="btn-ban-action" title="Bloquer ce membre avec motif">
                <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Bloquer</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ONGLET 4 : ADMINISTRATION & MODÉRATION (Tâche 3.10 & 3.12) -->
      <section *ngIf="activeTab === 'admin' && canManageGroup()" class="admin-tab-content">
        <!-- 1. Demandes d'adhésion en attente -->
        <div class="admin-section">
          <h3>Demandes d'adhésion en attente ({{ pendingMembers.length }})</h3>
          <div *ngIf="pendingMembers.length === 0" class="empty-state-mini">
            Aucune demande en attente.
          </div>

          <div *ngFor="let pm of pendingMembers" class="pending-item">
            <div>
              <strong>{{ pm.user?.profile?.fullName || pm.user?.email }}</strong>
              <span class="text-muted">a demandé à rejoindre le {{ pm.joinedAt | date:'short' }}</span>
            </div>
            <div class="pending-actions">
              <button (click)="approveMember(pm)" class="btn-approve">Accepter</button>
              <button (click)="rejectMember(pm)" class="btn-reject">Refuser</button>
            </div>
          </div>
        </div>

        <!-- 2. Membres bloqués du groupe avec motif -->
        <div class="admin-section" style="margin-top: 2rem;">
          <div class="admin-section-header">
            <h3>Membres bloqués ({{ bannedMembers.length }})</h3>
            <span class="badge-banned-count" *ngIf="bannedMembers.length > 0">{{ bannedMembers.length }} exclu(s)</span>
          </div>

          <div *ngIf="isLoadingBannedMembers" class="sk-stack">
            <div class="sk-line sk-shimmer" style="height: 38px; border-radius: 8px;"></div>
          </div>

          <div *ngIf="!isLoadingBannedMembers && bannedMembers.length === 0" class="empty-state-mini">
            Aucun membre n'est actuellement bloqué dans cette communauté.
          </div>

          <div *ngFor="let bm of bannedMembers" class="banned-member-item">
            <div class="banned-member-left">
              <div class="member-avatar avatar-banned">{{ getInitial(bm.user?.profile?.fullName || bm.user?.email) }}</div>
              <div class="banned-details">
                <div class="banned-name-row">
                  <strong>{{ bm.user?.profile?.fullName || bm.user?.email }}</strong>
                  <span class="badge-banned-tag">Exclu</span>
                </div>
                <div class="banned-motif-box">
                  <span class="motif-label">Motif :</span>
                  <span class="motif-text">{{ bm.banReason || 'Motif non précisé' }}</span>
                </div>
                <span class="banned-date" *ngIf="bm.bannedAt">Bloqué le {{ bm.bannedAt | date:'medium' }}</span>
              </div>
            </div>
            <div class="banned-actions">
              <button (click)="unbanMember(bm)" class="btn-unban" title="Réintégrer ce membre dans le groupe">
                <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Débloquer</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- MODAL DE BLOCAGE DE MEMBRE AVEC MOTIF -->
      <div class="modal-overlay" *ngIf="showBanModal && selectedMemberToBan" (click)="closeBanModal()">
        <div class="modal-card modal-ban animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="ban-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h2>Bloquer un membre</h2>
                <p class="modal-sub">Cette action révoquera l'accès du membre au groupe et à ses salons de chat.</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeBanModal()" title="Fermer">✕</button>
          </div>

          <div class="modal-body">
            <!-- Fiche du membre ciblé -->
            <div class="target-member-summary">
              <div class="member-avatar">{{ getInitial(selectedMemberToBan.user?.profile?.fullName || selectedMemberToBan.user?.email) }}</div>
              <div class="target-member-info">
                <strong>{{ selectedMemberToBan.user?.profile?.fullName || selectedMemberToBan.user?.email }}</strong>
                <span class="target-member-sub">{{ selectedMemberToBan.user?.email }} • Rôle : {{ selectedMemberToBan.role }}</span>
              </div>
            </div>

            <!-- Choix du motif -->
            <div class="form-group">
              <label for="banMotifSelect">Motif du blocage <span class="required">*</span></label>
              <select id="banMotifSelect" class="form-select" [(ngModel)]="banMotifType">
                <option value="REGLES">Non-respect des règles de la communauté</option>
                <option value="SPAM">Spam, démarchage ou publicité non autorisée</option>
                <option value="COMPORTEMENT">Comportement agressif, insultes ou harcèlement</option>
                <option value="HORS_SUJET">Publications hors-sujet répétées</option>
                <option value="AUTRE">Autre motif spécifique...</option>
              </select>
            </div>

            <!-- Précision complémentaire -->
            <div class="form-group">
              <label for="banDetails">Précisions ou commentaires (optionnel)</label>
              <textarea
                id="banDetails"
                class="form-textarea"
                rows="3"
                [(ngModel)]="banCustomMotif"
                placeholder="Détaillez le motif ou citez les règles non respectées...">
              </textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeBanModal()" [disabled]="isSubmittingBan">
              Annuler
            </button>
            <button
              type="button"
              class="btn btn-danger btn-icon-text"
              (click)="confirmBanMember()"
              [disabled]="isSubmittingBan">
              <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>{{ isSubmittingBan ? 'Blocage en cours...' : 'Confirmer le blocage' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./group-page.component.css']
})
export class GroupPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(CommunityGroupService);
  private authService = inject(AuthService);

  groupSlug = '';
  group?: Group;
  activeTab: 'feed' | 'chat' | 'about' | 'members' | 'admin' = 'feed';

  posts: GroupPost[] = [];
  members: GroupMember[] = [];
  pendingMembers: GroupMember[] = [];
  bannedMembers: GroupMember[] = [];

  isLoadingPosts = false;
  isJoining = false;
  isSubmittingPost = false;
  isUploadingBanner = false;
  isLoadingBannedMembers = false;
  actionSuccessMessage = '';
  actionErrorMessage = '';

  // Gestion du blocage de membre
  showBanModal = false;
  selectedMemberToBan: GroupMember | null = null;
  banMotifType: string = 'REGLES';
  banCustomMotif: string = '';
  isSubmittingBan = false;

  readonly BAN_MOTIF_PRESETS: Record<string, string> = {
    REGLES: 'Non-respect des règles de la communauté',
    SPAM: 'Spam, démarchage ou publicité non autorisée',
    COMPORTEMENT: 'Comportement agressif, insultes ou harcèlement',
    HORS_SUJET: 'Publications hors-sujet répétées',
    AUTRE: 'Autre motif spécifique'
  };

  newPost: GroupPostCreateRequest = {
    title: '',
    content: '',
    type: 'DISCUSSION',
    visibility: 'PUBLIC',
    isPinned: false
  };

  get currentUserId(): string | undefined {
    return this.authService.currentUser()?.id;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.groupSlug = slug;
        this.loadGroup();
      }
    });
  }

  loadGroup(): void {
    this.groupService.getGroupBySlug(this.groupSlug).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.group = res.data;
          this.loadFeed();
        }
      },
      error: () => {
        this.router.navigate(['/dashboard/groupes']);
      }
    });
  }

  loadFeed(): void {
    if (!this.group) return;
    this.isLoadingPosts = true;
    this.groupService.getGroupFeed(this.group.id).subscribe({
      next: (res) => {
        this.isLoadingPosts = false;
        if (res.success && res.data) {
          this.posts = res.data.content || [];
        }
      },
      error: () => { this.isLoadingPosts = false; }
    });
  }

  loadMembers(): void {
    if (!this.group) return;
    this.groupService.getMembers(this.group.id, 'ACTIVE').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members = res.data.content || [];
        }
      }
    });
  }

  loadPendingMembers(): void {
    if (!this.group) return;
    this.groupService.getMembers(this.group.id, 'PENDING').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingMembers = res.data.content || [];
        }
      }
    });
  }

  loadBannedMembers(): void {
    if (!this.group) return;
    this.isLoadingBannedMembers = true;
    this.groupService.getMembers(this.group.id, 'BANNED').subscribe({
      next: (res) => {
        this.isLoadingBannedMembers = false;
        if (res.success && res.data) {
          this.bannedMembers = res.data.content || [];
        }
      },
      error: () => { this.isLoadingBannedMembers = false; }
    });
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.group) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.actionErrorMessage = 'Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.actionErrorMessage = 'L\'image de couverture ne doit pas dépasser 5 Mo.';
      return;
    }

    this.isUploadingBanner = true;
    this.actionErrorMessage = '';
    this.actionSuccessMessage = '';

    this.groupService.uploadImage(file).subscribe({
      next: (res) => {
        if (res.success && res.data?.url) {
          const bannerUrl = res.data.url;
          this.groupService.updateBanner(this.group!.id, bannerUrl).subscribe({
            next: () => {
              this.isUploadingBanner = false;
              this.group!.bannerUrl = bannerUrl;
              this.actionSuccessMessage = '🎉 Photo de couverture mise à jour avec succès !';
              input.value = '';
            },
            error: (err) => {
              this.isUploadingBanner = false;
              this.actionErrorMessage = err.error?.error?.message || 'Erreur lors de la sauvegarde de la couverture.';
              input.value = '';
            }
          });
        }
      },
      error: (err) => {
        this.isUploadingBanner = false;
        this.actionErrorMessage = err.error?.error?.message || 'Erreur lors du téléchargement de l\'image.';
        input.value = '';
      }
    });
  }

  removeBanner(): void {
    if (!this.group) return;
    if (confirm('Supprimer la photo de couverture actuelle ?')) {
      this.groupService.updateBanner(this.group.id, '').subscribe({
        next: () => {
          this.group!.bannerUrl = undefined;
          this.actionSuccessMessage = 'Photo de couverture supprimée.';
        },
        error: (err) => {
          this.actionErrorMessage = err.error?.error?.message || 'Erreur lors de la suppression.';
        }
      });
    }
  }

  openBanModal(member: GroupMember): void {
    this.selectedMemberToBan = member;
    this.banMotifType = 'REGLES';
    this.banCustomMotif = '';
    this.showBanModal = true;
  }

  closeBanModal(): void {
    this.showBanModal = false;
    this.selectedMemberToBan = null;
    this.banCustomMotif = '';
  }

  confirmBanMember(): void {
    if (!this.group || !this.selectedMemberToBan) return;
    this.isSubmittingBan = true;

    let finalReason = this.BAN_MOTIF_PRESETS[this.banMotifType] || this.banMotifType;
    if (this.banCustomMotif.trim()) {
      finalReason += ` : ${this.banCustomMotif.trim()}`;
    }

    const targetUser = this.selectedMemberToBan.user;
    const targetUserId = targetUser?.id;
    const targetName = targetUser?.profile?.fullName || targetUser?.email || 'Membre';

    this.groupService.moderateMember(this.group.id, targetUserId, 'BANNED', finalReason).subscribe({
      next: () => {
        this.isSubmittingBan = false;
        this.members = this.members.filter(m => m.user?.id !== targetUserId);
        this.group!.memberCount = Math.max(1, this.group!.memberCount - 1);
        this.actionSuccessMessage = `Le membre ${targetName} a été bloqué du groupe avec succès.`;
        this.closeBanModal();
        this.loadBannedMembers();
      },
      error: (err) => {
        this.isSubmittingBan = false;
        this.actionErrorMessage = err.error?.error?.message || 'Erreur lors du blocage du membre.';
      }
    });
  }

  unbanMember(member: GroupMember): void {
    if (!this.group) return;
    const name = member.user?.profile?.fullName || member.user?.email || 'ce membre';
    if (confirm(`Débloquer ${name} et lui permettre de réintégrer la communauté ?`)) {
      this.groupService.moderateMember(this.group.id, member.user.id, 'ACTIVE').subscribe({
        next: () => {
          this.bannedMembers = this.bannedMembers.filter(m => m.id !== member.id);
          this.group!.memberCount += 1;
          this.actionSuccessMessage = `Membre ${name} débloqué avec succès.`;
          this.loadMembers();
        },
        error: (err) => {
          this.actionErrorMessage = err.error?.error?.message || 'Erreur lors du déblocage.';
        }
      });
    }
  }

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'G';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return 'Public';
      case 'OUVERT': return 'Sur demande';
      case 'PRIVE': return 'Privé';
      default: return type;
    }
  }

  canManageGroup(): boolean {
    return this.group?.userRole === 'OWNER' || this.group?.userRole === 'ADMIN';
  }

  joinGroup(): void {
    if (!this.group) return;
    this.isJoining = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    this.groupService.joinGroup(this.group.id).subscribe({
      next: (res) => {
        this.isJoining = false;
        if (res.success && res.data) {
          if (res.data.status === 'ACTIVE') {
            this.group!.isMember = true;
            this.group!.userRole = res.data.role;
            this.group!.memberCount += 1;
            this.actionSuccessMessage = '🎉 Vous êtes désormais membre de cette communauté !';
          } else {
            this.group!.isPending = true;
            this.actionSuccessMessage = '⏳ Demande envoyée aux modérateurs.';
          }
        }
      },
      error: (err) => {
        this.isJoining = false;
        this.actionErrorMessage = err.error?.error?.message || 'Erreur lors de l’adhésion.';
      }
    });
  }

  leaveGroup(): void {
    if (!this.group) return;
    if (confirm('Voulez-vous vraiment quitter ce groupe ?')) {
      this.groupService.leaveGroup(this.group.id).subscribe({
        next: () => {
          this.group!.isMember = false;
          this.group!.userRole = undefined;
          this.group!.memberCount = Math.max(1, this.group!.memberCount - 1);
        }
      });
    }
  }

  submitPost(): void {
    if (!this.group || !this.newPost.title.trim() || !this.newPost.content.trim()) return;
    this.isSubmittingPost = true;

    this.groupService.createPost(this.group.id, this.newPost).subscribe({
      next: (res) => {
        this.isSubmittingPost = false;
        if (res.success && res.data) {
          this.posts.unshift(res.data);
          this.group!.postCount += 1;
          this.newPost.title = '';
          this.newPost.content = '';
          this.newPost.isPinned = false;
        }
      },
      error: () => { this.isSubmittingPost = false; }
    });
  }

  deletePost(post: GroupPost): void {
    if (!this.group) return;
    if (confirm('Supprimer cette publication ?')) {
      this.groupService.deletePost(this.group.id, post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== post.id);
          this.group!.postCount = Math.max(0, this.group!.postCount - 1);
        }
      });
    }
  }

  approveMember(member: GroupMember): void {
    if (!this.group) return;
    this.groupService.moderateMember(this.group.id, member.user.id, 'ACTIVE').subscribe({
      next: () => {
        this.pendingMembers = this.pendingMembers.filter(m => m.id !== member.id);
        this.group!.memberCount += 1;
      }
    });
  }

  rejectMember(member: GroupMember): void {
    if (!this.group) return;
    this.groupService.moderateMember(this.group.id, member.user.id, 'BANNED').subscribe({
      next: () => {
        this.pendingMembers = this.pendingMembers.filter(m => m.id !== member.id);
      }
    });
  }
}

