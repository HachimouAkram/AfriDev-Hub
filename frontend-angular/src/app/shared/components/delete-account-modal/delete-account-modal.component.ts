import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AccountDeletionImpact } from '../../../core/services/auth.service';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-icon-box">
            <svg class="icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div class="header-titles">
            <h3 class="modal-title">Supprimer définitivement votre compte</h3>
            <span class="warning-badge">Action Irréversible</span>
          </div>
          <button type="button" class="btn-close" (click)="close()" [disabled]="isDeleting">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div *ngIf="isLoadingImpact" class="loading-impact">
            <div class="spinner"></div>
            <p>Analyse des données et responsabilités associées...</p>
          </div>

          <div *ngIf="!isLoadingImpact">
            <!-- Warning Alert for Company Owner -->
            <div *ngIf="impact?.isCompanyOwner" class="alert-danger-highlight">
              <div class="alert-title-row">
                <span class="alert-icon">🏢</span>
                <h4>Attention : Vous êtes le responsable de l'entreprise</h4>
              </div>
              <p class="alert-desc">
                Vous êtes enregistré comme fondateur / responsable de l'entreprise <strong>« {{ impact?.companyName }} »</strong>.
              </p>
              <div class="consequences-card">
                <div class="consequence-item">
                  <span class="cross-icon">✕</span>
                  <span>Votre entreprise <strong>{{ impact?.companyName }}</strong> sera <strong>complètement supprimée</strong> de la plateforme AfriDev Hub.</span>
                </div>
                <div class="consequence-item" *ngIf="impact?.publishedOpportunitiesCount">
                  <span class="cross-icon">✕</span>
                  <span>Toutes les <strong>{{ impact?.publishedOpportunitiesCount }} offres d'emploi</strong> publiées et leurs candidatures reçues seront effacées.</span>
                </div>
                <div class="consequence-item" *ngIf="impact?.teamMembersCount">
                  <span class="cross-icon">✕</span>
                  <span>Les <strong>{{ impact?.teamMembersCount }} membres</strong> associés à cette entreprise perdront leur affiliation et leur accès recruteur.</span>
                </div>
                <div class="consequence-item">
                  <span class="cross-icon">✕</span>
                  <span>Les points XP d'entreprise et l'historique d'activité seront perdus.</span>
                </div>
              </div>
            </div>

            <!-- Standard Warning for Developer / Non-Owner -->
            <div *ngIf="!impact?.isCompanyOwner" class="alert-warning-standard">
              <p>
                La suppression de votre compte est <strong>immédiate et définitive</strong>. Toutes vos données personnelles, vos projets, vos points XP et vos interactions seront supprimés.
              </p>
              <div *ngIf="impact?.isCompanyMember" class="member-notice">
                ℹ️ Vous êtes actuellement membre de l'entreprise <strong>« {{ impact?.memberCompanyName }} »</strong>. Votre compte sera retiré de l'équipe de l'entreprise.
              </div>
            </div>

            <!-- Confirmation Input Requirement -->
            <div class="confirmation-section">
              <label for="confirmInput" class="confirm-label">
                Pour confirmer la suppression, saisissez le mot <strong class="text-danger">SUPPRIMER</strong> en majuscules :
              </label>
              <input 
                id="confirmInput"
                type="text" 
                [(ngModel)]="confirmText" 
                name="confirmText"
                class="confirm-input" 
                placeholder="SUPPRIMER"
                [disabled]="isDeleting"
                autocomplete="off" />
            </div>

            <!-- Error message if any -->
            <div class="error-banner" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()" [disabled]="isDeleting">
            Annuler
          </button>
          <button 
            type="button" 
            class="btn btn-danger" 
            [disabled]="isConfirmDisabled() || isDeleting"
            (click)="onConfirmDelete()">
            <span *ngIf="!isDeleting">
              {{ impact?.isCompanyOwner ? 'Supprimer mon compte et l\'entreprise' : 'Supprimer définitivement mon compte' }}
            </span>
            <span *ngIf="isDeleting" class="deleting-spinner">
              <span class="mini-spinner"></span> Suppression en cours...
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1.25rem;
    }

    .modal-container {
      background: #0f172a;
      border: 1px solid rgba(239, 68, 68, 0.35);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(239, 68, 68, 0.15);
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalAppear {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
    }

    .header-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-danger {
      width: 26px;
      height: 26px;
      color: #ef4444;
    }

    .header-titles {
      flex: 1;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 4px 0;
    }

    .warning-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .btn-close:hover:not(:disabled) {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
      color: #cbd5e1;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .loading-impact {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      gap: 1rem;
      color: #94a3b8;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(239, 68, 68, 0.2);
      border-top-color: #ef4444;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert-danger-highlight {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .alert-title-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.5rem;
    }

    .alert-title-row h4 {
      margin: 0;
      color: #fca5a5;
      font-size: 1rem;
      font-weight: 700;
    }

    .alert-icon {
      font-size: 1.3rem;
    }

    .alert-desc {
      color: #f1f5f9;
      font-size: 0.92rem;
      margin: 0 0 1rem 0;
    }

    .consequences-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .consequence-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: #fca5a5;
      line-height: 1.4;
    }

    .cross-icon {
      color: #ef4444;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .alert-warning-standard {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      color: #fde68a;
    }

    .alert-warning-standard p {
      margin: 0;
      font-size: 0.9rem;
    }

    .member-notice {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #93c5fd;
    }

    .confirmation-section {
      margin-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .confirm-label {
      font-size: 0.88rem;
      color: #e2e8f0;
    }

    .text-danger {
      color: #ef4444;
    }

    .confirm-input {
      background: rgba(15, 23, 42, 0.9);
      border: 1.5px solid rgba(239, 68, 68, 0.4);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      transition: all 0.2s;
    }

    .confirm-input:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
    }

    .error-banner {
      margin-top: 1rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
    }

    .modal-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(2, 6, 23, 0.4);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.7rem 1.2rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }
    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
      box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
    }
    .btn-danger:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    .deleting-spinner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mini-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class DeleteAccountModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  impact: AccountDeletionImpact | null = null;
  isLoadingImpact = false;
  confirmText = '';
  isDeleting = false;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initModal();
    }
  }

  initModal(): void {
    this.confirmText = '';
    this.errorMessage = '';
    this.isDeleting = false;
    this.isLoadingImpact = true;

    this.authService.getDeletionImpact().subscribe({
      next: (res) => {
        this.isLoadingImpact = false;
        if (res.success && res.data) {
          this.impact = res.data;
        }
      },
      error: (err) => {
        this.isLoadingImpact = false;
        if (err.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 1500);
        } else {
          this.errorMessage = err.error?.message || 'Impossible de vérifier l\'impact de suppression.';
        }
      }
    });
  }

  isConfirmDisabled(): boolean {
    return this.confirmText.trim().toUpperCase() !== 'SUPPRIMER';
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.isDeleting) {
      this.close();
    }
  }

  close(): void {
    if (this.isDeleting) return;
    this.isOpen = false;
    this.closed.emit();
  }

  onConfirmDelete(): void {
    if (this.isConfirmDisabled() || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';

    this.authService.deleteAccount('SUPPRIMER').subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.close();
        alert('Votre compte et toutes les données associées ont été définitivement supprimés.');
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isDeleting = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la suppression de votre compte.';
      }
    });
  }
}

