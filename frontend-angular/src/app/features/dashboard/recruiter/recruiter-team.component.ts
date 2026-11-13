import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, Company, CompanyMember } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recruiter-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="recruiter-team-container">
      <div class="team-header-card">
        <div class="header-info">
          <h2>Équipe de Recrutement</h2>
          <p>Gérez les recruteurs habilités à publier des offres et recruter au nom de votre entreprise.</p>
        </div>
        <button class="btn btn-primary" (click)="openInviteModal()" *ngIf="isOwner()">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Inviter un recruteur</span>
        </button>
      </div>

      <!-- Notice pour les recruteurs non-owners -->
      <div class="info-alert" *ngIf="!isOwner()">
        <svg class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span>Seul le responsable (propriétaire) de l'entreprise peut inviter ou retirer des membres de l'équipe.</span>
      </div>

      <!-- Members Grid -->
      <div class="members-grid" *ngIf="!isLoading(); else loadingTpl">
        <div class="member-card" *ngFor="let member of members()">
          <div class="member-avatar">
            <img *ngIf="member.avatarUrl; else avatarPlaceholder" [src]="member.avatarUrl" [alt]="member.fullName" />
            <ng-template #avatarPlaceholder>
              <div class="avatar-letter">{{ member.fullName.charAt(0).toUpperCase() }}</div>
            </ng-template>
          </div>

          <div class="member-details">
            <div class="name-row">
              <span class="member-name">{{ member.fullName }}</span>
              <span class="role-badge" [class.role-owner]="member.role === 'OWNER'">
                {{ member.role === 'OWNER' ? 'Responsable' : 'Recruteur' }}
              </span>
            </div>
            <span class="member-title">{{ member.jobTitle || 'Recruteur Talent Acquisition' }}</span>
            <span class="member-email">{{ member.email }}</span>
            <span class="member-date" *ngIf="member.joinedAt">
              Membre depuis le {{ member.joinedAt | date:'mediumDate' }}
            </span>
          </div>

          <div class="member-actions" *ngIf="isOwner() && member.role !== 'OWNER'">
            <button class="btn-icon-danger" (click)="removeMember(member)" title="Retirer de l'équipe">
              <svg class="danger-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des membres de l'équipe...</p>
        </div>
      </ng-template>

      <!-- Invite Modal -->
      <div class="modal-backdrop" *ngIf="showInviteModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Inviter un nouveau recruteur</h3>
            <button class="close-btn" (click)="closeInviteModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              La personne doit déjà posséder un compte AfriDev Hub. Elle recevra l'accès immédiat à l'espace entreprise.
            </p>
            <div class="form-group">
              <label>Adresse Email du recruteur *</label>
              <input type="email" [(ngModel)]="inviteEmail" class="form-input" placeholder="recruteur@afriq.tech" />
            </div>
            <div class="form-group">
              <label>Fonction / Poste *</label>
              <input type="text" [(ngModel)]="inviteJobTitle" class="form-input" placeholder="ex: Talent Acquisition Specialist" />
            </div>
            <div class="error-msg" *ngIf="inviteError">{{ inviteError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeInviteModal()">Annuler</button>
            <button class="btn btn-primary" (click)="submitInvite()" [disabled]="isSubmittingInvite">
              {{ isSubmittingInvite ? 'Invitation...' : 'Confirmer l\'invitation' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recruiter-team-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .team-header-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-info h2 {
      margin: 0;
      font-size: 1.3rem;
      color: var(--text-primary, #f8fafc);
    }

    .header-info p {
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
    }

    .info-alert {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: #93c5fd;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .alert-svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .btn-svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .danger-svg {
      width: 18px;
      height: 18px;
    }

    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .member-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .member-avatar {
      width: 54px;
      height: 54px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      background: rgba(16, 185, 129, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .member-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-letter {
      font-size: 1.4rem;
      font-weight: 700;
      color: #10b981;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .member-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary, #f8fafc);
    }

    .role-badge {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 9999px;
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
    }

    .role-badge.role-owner {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      font-weight: 700;
    }

    .member-title {
      font-size: 0.8rem;
      color: #10b981;
      margin-top: 2px;
    }

    .member-email {
      font-size: 0.75rem;
      color: var(--text-secondary, #94a3b8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-date {
      font-size: 0.7rem;
      color: var(--text-muted, #64748b);
      margin-top: 4px;
    }

    .btn-icon-danger {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #ef4444;
      padding: 6px;
      border-radius: 8px;
      transition: background 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon-danger:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: #10b981;
      color: #064e3b;
      font-weight: 700;
    }

    .btn-primary:hover {
      background: #059669;
      color: #fff;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      padding: 1.5rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .modal-header h3 {
      margin: 0;
      color: #f8fafc;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .modal-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 4px;
    }

    .form-input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      font-size: 0.9rem;
      box-sizing: border-box;
    }

    .error-msg {
      color: #ef4444;
      font-size: 0.8rem;
      margin-bottom: 0.75rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RecruiterTeamComponent implements OnInit {
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);

  company = signal<Company | null>(null);
  members = signal<CompanyMember[]>([]);
  isLoading = signal<boolean>(true);

  showInviteModal = false;
  inviteEmail = '';
  inviteJobTitle = '';
  inviteError = '';
  isSubmittingInvite = false;

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.loadMembers(res.data.id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  isOwner(): boolean {
    const comp = this.company();
    const currUser = this.authService.currentUser();
    return !!(comp && currUser && comp.ownerId === currUser.id);
  }

  loadMembers(companyId: string): void {
    this.isLoading.set(true);
    this.companyService.getMembers(companyId, 0, 50).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members.set(res.data.content);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openInviteModal(): void {
    this.showInviteModal = true;
    this.inviteEmail = '';
    this.inviteJobTitle = '';
    this.inviteError = '';
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
  }

  submitInvite(): void {
    if (!this.inviteEmail.trim() || !this.inviteJobTitle.trim()) {
      this.inviteError = 'Veuillez remplir l\'adresse email et la fonction.';
      return;
    }

    const comp = this.company();
    if (!comp) return;

    this.isSubmittingInvite = true;
    this.inviteError = '';

    this.companyService.inviteMember(comp.id, this.inviteEmail.trim(), this.inviteJobTitle.trim()).subscribe({
      next: (res) => {
        this.isSubmittingInvite = false;
        if (res.success) {
          this.closeInviteModal();
          this.loadMembers(comp.id);
        } else {
          this.inviteError = res.error?.message || 'Impossible d\'inviter ce membre.';
        }
      },
      error: (err) => {
        this.isSubmittingInvite = false;
        this.inviteError = err?.error?.message || 'Erreur lors de l\'invitation.';
      }
    });
  }

  removeMember(member: CompanyMember): void {
    const comp = this.company();
    if (!comp) return;

    if (!confirm(`Voulez-vous vraiment retirer ${member.fullName} de l'équipe de recrutement ?`)) {
      return;
    }

    this.companyService.removeMember(comp.id, member.userId).subscribe({
      next: () => this.loadMembers(comp.id)
    });
  }
}

