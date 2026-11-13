import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, Company } from '../../../core/services/company.service';
import { ProfileService } from '../../../core/services/profile.service';
import { compressImage, resolveUploadedMediaUrl } from '../../../core/utils/upload-helper';
import { CompanyBadgeComponent } from '../../../shared/components/company-badge/company-badge.component';
import { DeleteAccountModalComponent } from '../../../shared/components/delete-account-modal/delete-account-modal.component';

@Component({
  selector: 'app-recruiter-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompanyBadgeComponent, DeleteAccountModalComponent],
  template: `
    <div class="company-profile-container" *ngIf="company(); else loadingTpl">
      <!-- Header -->
      <div class="profile-header-card">
        <div class="header-info">
          <h2>Profil de l'Entreprise</h2>
          <p>Ces informations s'affichent sur toutes vos offres et sur votre page vitrine publique.</p>
        </div>
        <a [routerLink]="['/company', company()?.slug]" class="btn btn-outline" target="_blank">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 17px; height: 17px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Prévisualiser la page publique</span>
        </a>
      </div>

      <!-- Main Form -->
      <form (ngSubmit)="saveProfile()" class="profile-form-grid">
        <div class="form-card">
          <h3>Identité de l'Entreprise</h3>

          <div class="form-group">
            <label>Nom de l'Entreprise *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Slogan / Tagline</label>
            <input type="text" [(ngModel)]="form.tagline" name="tagline" class="form-input" placeholder="ex: Bâtir le futur de la fintech panafricaine" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Secteur d'activité</label>
              <input type="text" [(ngModel)]="form.sector" name="sector" class="form-input" placeholder="ex: FinTech, EdTech, E-commerce, IA" />
            </div>
            <div class="form-group">
              <label>Taille de l'entreprise</label>
              <select [(ngModel)]="form.companySize" name="companySize" class="form-select">
                <option value="">Sélectionner</option>
                <option value="1-10">1 - 10 employés</option>
                <option value="11-50">11 - 50 employés</option>
                <option value="51-200">51 - 200 employés</option>
                <option value="201-500">201 - 500 employés</option>
                <option value="500+">500+ employés</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Description détaillée</label>
            <textarea [(ngModel)]="form.description" name="description" rows="5" class="form-textarea" placeholder="Présentez la mission de votre entreprise, vos défis techniques, et votre culture d'équipe..."></textarea>
          </div>
        </div>

        <div class="form-card">
          <h3>Présence & Médias</h3>

          <!-- Logo de l'Entreprise (Upload Cloudinary) -->
          <div class="form-group">
            <label>Logo de l'Entreprise (format carré recommandé)</label>

            <div class="media-upload-row" *ngIf="form.logoUrl">
              <div class="logo-preview-box">
                <img [src]="resolveUrl(form.logoUrl)" alt="Aperçu logo" />
              </div>
              <div class="media-preview-actions">
                <label class="btn-upload-inline">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    (change)="onLogoFileSelected($event)"
                    [disabled]="isUploadingLogo"
                    style="display: none;" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-svg-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>{{ isUploadingLogo ? 'Téléversement...' : 'Changer le logo' }}</span>
                </label>
                <button type="button" class="btn-remove-inline" (click)="removeLogo()" [disabled]="isUploadingLogo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-svg-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>

            <div class="upload-dropzone" *ngIf="!form.logoUrl">
              <label class="upload-dropzone-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onLogoFileSelected($event)"
                  [disabled]="isUploadingLogo"
                  style="display: none;" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="upload-svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span *ngIf="!isUploadingLogo">Cliquez pour téléverser le logo (PNG, JPG, WebP — max 5 Mo)</span>
                <span *ngIf="isUploadingLogo">Téléversement vers Cloudinary en cours...</span>
              </label>
            </div>
            <div class="upload-error-text" *ngIf="logoUploadError">{{ logoUploadError }}</div>
          </div>

          <!-- Bannière de l'Entreprise (Upload Cloudinary) -->
          <div class="form-group">
            <label>Bannière de couverture (format paysage)</label>

            <div class="banner-preview-box" *ngIf="form.coverUrl">
              <img [src]="resolveUrl(form.coverUrl)" alt="Aperçu bannière" />
              <div class="banner-overlay-actions">
                <label class="btn-banner-action">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    (change)="onCoverFileSelected($event)"
                    [disabled]="isUploadingCover"
                    style="display: none;" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-svg-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>{{ isUploadingCover ? 'Téléversement...' : 'Remplacer' }}</span>
                </label>
                <button type="button" class="btn-banner-action btn-banner-danger" (click)="removeCover()" [disabled]="isUploadingCover">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-svg-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>

            <div class="upload-dropzone" *ngIf="!form.coverUrl">
              <label class="upload-dropzone-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onCoverFileSelected($event)"
                  [disabled]="isUploadingCover"
                  style="display: none;" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="upload-svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span *ngIf="!isUploadingCover">Cliquez pour téléverser une bannière (PNG, JPG, WebP — max 5 Mo)</span>
                <span *ngIf="isUploadingCover">Téléversement vers Cloudinary en cours...</span>
              </label>
            </div>
            <div class="upload-error-text" *ngIf="coverUploadError">{{ coverUploadError }}</div>
          </div>

          <div class="form-group">
            <label>Site web officiel</label>
            <input type="url" [(ngModel)]="form.website" name="website" class="form-input" placeholder="https://monsite.africa" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Pays</label>
              <input type="text" [(ngModel)]="form.country" name="country" class="form-input" placeholder="ex: Sénégal, Algérie, Cameroun..." />
            </div>
            <div class="form-group">
              <label>Ville</label>
              <input type="text" [(ngModel)]="form.city" name="city" class="form-input" placeholder="ex: Dakar, Alger, Douala..." />
            </div>
          </div>

          <div class="form-group">
            <label>Année de fondation</label>
            <input type="number" [(ngModel)]="form.foundedYear" name="foundedYear" class="form-input" placeholder="ex: 2022" />
          </div>

          <div class="msg-box success" *ngIf="successMsg">{{ successMsg }}</div>
          <div class="msg-box error" *ngIf="errorMsg">{{ errorMsg }}</div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="isSaving">
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>
      </form>

      <!-- Zone de Danger : Suppression du Compte & de l'Entreprise -->
      <div class="danger-zone-card">
        <div class="danger-info">
          <div class="danger-title-row">
            <span class="danger-badge">Zone de Danger</span>
            <h3>Suppression du Compte & de l'Entreprise</h3>
          </div>
          <p>
            Vous êtes le responsable de cette entreprise. La suppression de votre compte entraînera la 
            <strong>suppression définitive et irréversible de l'entreprise {{ company()?.name }}</strong>, de toutes ses offres d'emploi publiées, ainsi que l'accès de toute votre équipe recruteur.
          </p>
        </div>
        <button type="button" class="btn btn-danger" (click)="showDeleteAccountModal = true">
          Supprimer mon compte et l'entreprise...
        </button>
      </div>

      <!-- Modal de Suppression -->
      <app-delete-account-modal 
        [isOpen]="showDeleteAccountModal" 
        (closed)="showDeleteAccountModal = false">
      </app-delete-account-modal>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement du profil entreprise...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .company-profile-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-header-card {
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

    .profile-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .form-card {
      background: var(--card-bg, rgba(30, 41, 59, 0.7));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: var(--text-primary, #f8fafc);
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: #10b981;
    }

    .form-textarea {
      resize: vertical;
    }

    .media-upload-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 4px;
    }

    .logo-preview-box {
      width: 68px;
      height: 68px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(16, 185, 129, 0.35);
      background: rgba(15, 23, 42, 0.8);
      flex-shrink: 0;
    }

    .logo-preview-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .media-preview-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .btn-upload-inline,
    .btn-remove-inline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-upload-inline {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }

    .btn-upload-inline:hover {
      background: rgba(16, 185, 129, 0.22);
      border-color: #10b981;
    }

    .btn-remove-inline {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .btn-remove-inline:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .upload-dropzone {
      margin-top: 4px;
    }

    .upload-dropzone-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 1.15rem 1rem;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.45);
      color: #94a3b8;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .upload-dropzone-label:hover {
      border-color: #10b981;
      color: #34d399;
      background: rgba(16, 185, 129, 0.06);
    }

    .upload-svg {
      width: 22px;
      height: 22px;
      color: #10b981;
      flex-shrink: 0;
    }

    .upload-svg-sm {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    .banner-preview-box {
      position: relative;
      width: 100%;
      height: 135px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.8);
      margin-top: 4px;
    }

    .banner-preview-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-overlay-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 6px;
    }

    .btn-banner-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0.35rem 0.7rem;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #f8fafc;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-banner-action:hover {
      background: #10b981;
      color: #022c22;
      border-color: #10b981;
    }

    .btn-banner-danger:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    .upload-error-text {
      color: #f87171;
      font-size: 0.76rem;
      margin-top: 4px;
    }

    .msg-box {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .msg-box.success {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .msg-box.error {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .form-actions {
      margin-top: auto;
      padding-top: 1rem;
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: #10b981;
      color: #064e3b;
      font-weight: 700;
      width: 100%;
      justify-content: center;
    }

    .btn-primary:hover {
      background: #059669;
      color: #fff;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .danger-zone-card {
      background: rgba(239, 68, 68, 0.06);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-top: 1rem;
    }

    .danger-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.4rem;
    }

    .danger-badge {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .danger-info h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #fca5a5;
    }

    .danger-info p {
      margin: 0;
      font-size: 0.88rem;
      color: #cbd5e1;
      max-width: 600px;
      line-height: 1.4;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      padding: 0.75rem 1.4rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #b91c1c;
      box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
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
export class RecruiterCompanyProfileComponent implements OnInit {
  private companyService = inject(CompanyService);
  private profileService = inject(ProfileService);

  company = signal<Company | null>(null);
  form: Partial<Company> = {};
  isSaving = false;
  successMsg = '';
  errorMsg = '';
  showDeleteAccountModal = false;

  isUploadingLogo = false;
  logoUploadError = '';
  isUploadingCover = false;
  coverUploadError = '';

  resolveUrl(url?: string | null): string {
    return resolveUploadedMediaUrl(url);
  }

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.form = { ...res.data };
        }
      }
    });
  }

  async onLogoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const rawFile = input.files[0];
    if (!rawFile.type.startsWith('image/')) {
      this.logoUploadError = 'Veuillez sélectionner une image valide (PNG, JPG, WebP).';
      return;
    }
    if (rawFile.size > 5 * 1024 * 1024) {
      this.logoUploadError = 'L\'image dépasse la taille maximale autorisée (5 Mo).';
      return;
    }

    this.isUploadingLogo = true;
    this.logoUploadError = '';

    const file = await compressImage(rawFile, 800, 0.88);
    this.profileService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingLogo = false;
        if (res.success && res.data?.url) {
          this.form.logoUrl = resolveUploadedMediaUrl(res.data.url);
        } else {
          this.logoUploadError = 'Erreur lors du téléversement du logo.';
        }
      },
      error: (err) => {
        this.isUploadingLogo = false;
        this.logoUploadError = err?.error?.error?.message || err?.error?.message || 'Erreur lors du téléversement du logo.';
      }
    });
  }

  removeLogo(): void {
    this.form.logoUrl = '';
    this.logoUploadError = '';
  }

  async onCoverFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const rawFile = input.files[0];
    if (!rawFile.type.startsWith('image/')) {
      this.coverUploadError = 'Veuillez sélectionner une image valide (PNG, JPG, WebP).';
      return;
    }
    if (rawFile.size > 5 * 1024 * 1024) {
      this.coverUploadError = 'L\'image dépasse la taille maximale autorisée (5 Mo).';
      return;
    }

    this.isUploadingCover = true;
    this.coverUploadError = '';

    const file = await compressImage(rawFile, 1920, 0.85);
    this.profileService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingCover = false;
        if (res.success && res.data?.url) {
          this.form.coverUrl = resolveUploadedMediaUrl(res.data.url);
        } else {
          this.coverUploadError = 'Erreur lors du téléversement de la bannière.';
        }
      },
      error: (err) => {
        this.isUploadingCover = false;
        this.coverUploadError = err?.error?.error?.message || err?.error?.message || 'Erreur lors du téléversement de la bannière.';
      }
    });
  }

  removeCover(): void {
    this.form.coverUrl = '';
    this.coverUploadError = '';
  }

  saveProfile(): void {
    const comp = this.company();
    if (!comp) return;

    this.isSaving = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.companyService.updateCompany(comp.id, this.form).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.company.set(res.data);
          this.form = { ...res.data };
          this.successMsg = 'Profil de l\'entreprise mis à jour avec succès !';
        } else {
          this.errorMsg = res.error?.message || 'Erreur lors de la mise à jour.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = err?.error?.message || 'Erreur lors de l\'enregistrement.';
      }
    });
  }
}

