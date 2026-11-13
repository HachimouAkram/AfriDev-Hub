import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, Company } from '../../../core/services/company.service';
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
          👁️ Prévisualiser la page publique
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

          <div class="form-group">
            <label>URL du Logo (carré recommandé)</label>
            <input type="url" [(ngModel)]="form.logoUrl" name="logoUrl" class="form-input" placeholder="https://..." />
            <div class="logo-preview" *ngIf="form.logoUrl">
              <img [src]="form.logoUrl" alt="Aperçu logo" />
            </div>
          </div>

          <div class="form-group">
            <label>URL de la Bannière (format paysage)</label>
            <input type="url" [(ngModel)]="form.coverUrl" name="coverUrl" class="form-input" placeholder="https://..." />
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

    .logo-preview {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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

  company = signal<Company | null>(null);
  form: Partial<Company> = {};
  isSaving = false;
  successMsg = '';
  errorMsg = '';
  showDeleteAccountModal = false;

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

