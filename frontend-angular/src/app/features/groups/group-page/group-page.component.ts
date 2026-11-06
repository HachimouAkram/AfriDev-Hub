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
                <span *ngIf="group.country"> • 📍 {{ group.country }}</span>
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
              ⏳ Adhésion en attente d'approbation
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
            📢 Publications & Échanges
          </button>
          <button
            *ngIf="group.isMember"
            class="tab-link"
            [class.active]="activeTab === 'chat'"
            (click)="activeTab = 'chat'">
            💬 Salons & Chat Direct
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'about'"
            (click)="activeTab = 'about'">
            ℹ️ À propos & Règles
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'members'"
            (click)="activeTab = 'members'; loadMembers()">
            👥 Membres ({{ group.memberCount }})
          </button>
          <button
            *ngIf="canManageGroup()"
            class="tab-link"
            [class.active]="activeTab === 'admin'"
            (click)="activeTab = 'admin'; loadPendingMembers()">
            🛡️ Administration & Modération
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
          <h3>✍️ Publier dans la communauté</h3>
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
                <option value="DISCUSSION">💬 Discussion</option>
                <option value="RESSOURCE">📚 Ressource & Code</option>
                <option value="ANNONCE">📢 Annonce</option>
                <option value="EVENEMENT">📅 Événement</option>
              </select>

              <select [(ngModel)]="newPost.visibility">
                <option value="PUBLIC">🌐 Visible par tous</option>
                <option value="MEMBRES_SEULEMENT">🔒 Membres seulement</option>
              </select>

              <label *ngIf="canManageGroup()" class="checkbox-pin">
                <input type="checkbox" [(ngModel)]="newPost.isPinned" />
                <span>📌 Épingler</span>
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
          <p>🔒 Rejoignez cette communauté pour publier, commenter et échanger avec les membres.</p>
          <button (click)="joinGroup()" class="btn-primary-action btn-sm">Rejoindre</button>
        </div>

        <!-- Liste des publications -->
        <div class="posts-list">
          <div *ngIf="isLoadingPosts" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des publications...</p>
          </div>

          <div *ngIf="!isLoadingPosts && posts.length === 0" class="empty-feed">
            <p>Aucune publication pour l'instant. Soyez le premier à animer le groupe !</p>
          </div>

          <article *ngFor="let post of posts" class="group-post-item" [class.pinned-post]="post.isPinned">
            <div class="post-pinned-badge" *ngIf="post.isPinned">📌 Publication Épinglée</div>

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
                <span class="badge-post-vis" *ngIf="post.visibility === 'MEMBRES_SEULEMENT'">🔒 Membres</span>
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
              <span class="member-role">{{ m.role }}</span>
              <span class="member-date">Membre depuis {{ m.joinedAt | date:'MMM yyyy' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ONGLET 4 : ADMINISTRATION & MODÉRATION (Tâche 3.10 & 3.12) -->
      <section *ngIf="activeTab === 'admin' && canManageGroup()" class="admin-tab-content">
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
      </section>
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

  isLoadingPosts = false;
  isJoining = false;
  isSubmittingPost = false;
  actionSuccessMessage = '';
  actionErrorMessage = '';

  newPost: GroupPostCreateRequest = {
    title: '',
    content: '',
    type: 'DISCUSSION',
    visibility: 'PUBLIC',
    isPinned: false
  };

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

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'G';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return '🌐 Public';
      case 'OUVERT': return '🛡️ Sur demande';
      case 'PRIVE': return '🔒 Privé';
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

