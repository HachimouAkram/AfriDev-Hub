import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommunityGroupService, GroupCreateRequest, GroupAccessType } from '../../../core/services/community-group.service';
import { POPULAR_TAGS } from '../../../core/services/help.service';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="create-group-container">
      <div class="create-group-header">
        <a routerLink="/dashboard/groupes" class="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux groupes
        </a>
        <h1>Créer une Communauté Tech</h1>
        <p class="subtitle">
          Rassemblez des développeurs, partagez vos tutoriels, organisez des sessions et animez votre collectif.
        </p>
      </div>

      <form (ngSubmit)="submit()" class="create-group-form" #form="ngForm">
        <!-- Nom du groupe -->
        <div class="form-group">
          <label for="name">Nom de la communauté <span class="required">*</span></label>
          <input
            id="name"
            type="text"
            [(ngModel)]="formData.name"
            (ngModelChange)="onNameChange()"
            name="name"
            required
            minlength="3"
            maxlength="100"
            placeholder="Ex: Angular Dakar Hub, DevOps Cameroon, Python Abidjan"
            class="form-control"
          />
        </div>

        <!-- Slug URL -->
        <div class="form-group">
          <label for="slug">Identifiant unique (URL) <span class="required">*</span></label>
          <div class="slug-input-wrapper">
            <span class="slug-prefix">/dashboard/groupes/</span>
            <input
              id="slug"
              type="text"
              [(ngModel)]="formData.slug"
              name="slug"
              required
              class="slug-input"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="desc">Description & Mission du groupe <span class="required">*</span></label>
          <textarea
            id="desc"
            rows="5"
            [(ngModel)]="formData.description"
            name="description"
            required
            minlength="10"
            placeholder="Présentez la mission du groupe, à qui il s'adresse et ce qu'on y apprend..."
            class="form-control">
          </textarea>
        </div>

        <!-- Visibilité / Accès -->
        <div class="form-group">
          <label>Niveau de confidentialité & Accès <span class="required">*</span></label>
          <div class="access-options">
            <label class="access-card" [class.selected]="formData.accessType === 'PUBLIC'">
              <input type="radio" [(ngModel)]="formData.accessType" name="accessType" value="PUBLIC" />
              <div>
                <strong>🌐 Groupe Public</strong>
                <span>Accessible à tous les membres d'AfriDev sans modération.</span>
              </div>
            </label>

            <label class="access-card" [class.selected]="formData.accessType === 'OUVERT'">
              <input type="radio" [(ngModel)]="formData.accessType" name="accessType" value="OUVERT" />
              <div>
                <strong>🛡️ Sur Demande (Ouvert)</strong>
                <span>Visible publiquement, mais les adhésions sont validées par vous.</span>
              </div>
            </label>

            <label class="access-card" [class.selected]="formData.accessType === 'PRIVE'">
              <input type="radio" [(ngModel)]="formData.accessType" name="accessType" value="PRIVE" />
              <div>
                <strong>🔒 Groupe Privé</strong>
                <span>Invisible dans la recherche, accessible uniquement par invitation.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Localisation -->
        <div class="form-row-2">
          <div class="form-group">
            <label for="country">Pays d'ancrage</label>
            <input
              id="country"
              type="text"
              [(ngModel)]="formData.country"
              name="country"
              placeholder="Ex: Sénégal, Côte d'Ivoire, Cameroun..."
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="city">Ville (Optionnel)</label>
            <input
              id="city"
              type="text"
              [(ngModel)]="formData.city"
              name="city"
              placeholder="Ex: Dakar, Abidjan, Douala..."
              class="form-control"
            />
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label>Technologies / Thématiques clés</label>
          <div class="tags-input-wrapper">
            <span class="tag-pill" *ngFor="let t of formData.tags; let i = index">
              {{ t }}
              <button type="button" (click)="removeTag(i)" class="tag-remove">×</button>
            </span>
            <input
              type="text"
              [(ngModel)]="newTag"
              name="newTag"
              (keydown.enter)="addTag($event)"
              placeholder="Ajouter une techno puis Entrée..."
              class="tag-input"
            />
          </div>

          <div class="suggested-tags">
            <span class="suggested-lbl">Suggestions :</span>
            <button
              type="button"
              *ngFor="let t of suggestedTags"
              class="suggested-tag-btn"
              [class.selected]="formData.tags.includes(t)"
              (click)="toggleTag(t)">
              + {{ t }}
            </button>
          </div>
        </div>

        <!-- Alertes -->
        <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>
        <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" routerLink="/dashboard/groupes" class="btn-cancel">Annuler</button>
          <button type="submit" [disabled]="form.invalid || isSubmitting" class="btn-submit">
            <span *ngIf="!isSubmitting">✨ Créer mon Groupe (+50 XP)</span>
            <span *ngIf="isSubmitting">Création en cours...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./create-group.component.css']
})
export class CreateGroupComponent {
  private groupService = inject(CommunityGroupService);
  private router = inject(Router);

  suggestedTags = POPULAR_TAGS.slice(0, 12);

  formData: GroupCreateRequest = {
    name: '',
    slug: '',
    description: '',
    accessType: 'PUBLIC',
    tags: [],
    country: '',
    city: ''
  };

  newTag = '';
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  onNameChange(): void {
    if (!this.formData.slug || this.formData.slug.length === 0 || this.formData.slug.startsWith(this.formData.name.slice(0, 3).toLowerCase())) {
      this.formData.slug = this.formData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  addTag(e: Event): void {
    e.preventDefault();
    const tag = this.newTag.trim().replace(/^#/, '');
    if (tag && !this.formData.tags.includes(tag)) {
      this.formData.tags.push(tag);
    }
    this.newTag = '';
  }

  removeTag(idx: number): void {
    this.formData.tags.splice(idx, 1);
  }

  toggleTag(t: string): void {
    const idx = this.formData.tags.indexOf(t);
    if (idx >= 0) this.formData.tags.splice(idx, 1);
    else this.formData.tags.push(t);
  }

  submit(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.groupService.createGroup(this.formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.successMessage = '🎉 Groupe créé avec succès !';
          setTimeout(() => {
            this.router.navigate(['/dashboard/groupes', res.data.slug]);
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error?.message || 'Erreur lors de la création du groupe.';
      }
    });
  }
}
