import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  HelpService,
  HelpPostCreateRequest,
  HelpPostType,
  DeveloperLevel,
  HELP_TYPE_LABELS,
  POPULAR_TAGS
} from '../../../core/services/help.service';

/**
 * Formulaire de création d'une publication d'aide / orientation.
 * Tâche 1.7.
 */
@Component({
  selector: 'app-create-help-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="projects-dashboard-page animate-fade-in">
      <div class="projects-header-card app-card">
        <div class="header-text-group">
          <h2>Demander de l'Aide ou une Orientation</h2>
          <p class="subtext">
            Expliquez clairement votre besoin. La communauté et nos volontaires vous répondront rapidement.
          </p>
        </div>

        <div class="header-buttons-wrap">
          <a routerLink="/dashboard/aide" class="btn btn-outline-clean btn-icon-text">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour aux demandes</span>
          </a>
        </div>
      </div>

      <form (ngSubmit)="submit()" class="create-help-form app-card" #form="ngForm">

        <!-- Type de demande (Tâche 1.4) -->
        <div class="form-group">
          <label>Type de demande <span class="required">*</span></label>
          <div class="type-selector">
            <button
              type="button"
              *ngFor="let t of types"
              class="type-btn"
              [class.active]="formData.type === t"
              (click)="formData.type = t">
              {{ typeLabels[t] }}
            </button>
          </div>
        </div>

        <!-- Titre -->
        <div class="form-group">
          <label for="title">Titre de votre demande <span class="required">*</span></label>
          <input
            id="title"
            type="text"
            [(ngModel)]="formData.title"
            name="title"
            required
            minlength="5"
            maxlength="200"
            placeholder="Ex: Comment débuter en développement backend avec Spring Boot ?"
            class="form-control"
            #titleInput="ngModel"
          />
          <div class="field-hint" *ngIf="titleInput.invalid && titleInput.touched">
            Le titre doit contenir au moins 5 caractères.
          </div>
        </div>

        <!-- Photos / Captures d'écran du problème (Max 5 photos, au-dessus de la description) -->
        <div class="form-group photos-upload-group">
          <div class="photos-label-row">
            <label>
              Captures d'écran ou photos du problème
              <span class="label-badge">{{ (formData.screenshotUrls?.length || 0) }}/5 photos max</span>
            </label>
            <span class="upload-hint-sub">Ajoutez jusqu'à 5 photos pour que les mentors puissent zoomer et analyser l'erreur</span>
          </div>

          <!-- Grille des photos déjà ajoutées -->
          <div class="photos-preview-grid" *ngIf="formData.screenshotUrls && formData.screenshotUrls.length > 0">
            <div *ngFor="let url of formData.screenshotUrls; let i = index" class="photo-preview-item">
              <img [src]="resolveUrl(url)" alt="Capture problème" class="preview-img" />
              <button type="button" (click)="removePhoto(i)" class="btn-remove-photo" title="Supprimer cette photo">×</button>
            </div>
          </div>

          <!-- Zone d'upload -->
          <div class="upload-dropzone" *ngIf="(formData.screenshotUrls?.length || 0) < 5">
            <input
              type="file"
              id="problemPhotosInput"
              accept="image/*"
              multiple
              (change)="onPhotosSelected($event)"
              class="hidden-file-input"
              #photosInput
            />
            <label for="problemPhotosInput" class="upload-dropzone-label">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span *ngIf="!isUploadingPhoto">Ajouter des photos / captures ({{ 5 - (formData.screenshotUrls?.length || 0) }} restante{{ 5 - (formData.screenshotUrls?.length || 0) > 1 ? 's' : '' }})</span>
              <span *ngIf="isUploadingPhoto">Téléversement de la photo en cours...</span>
            </label>
          </div>
        </div>

        <!-- Description (Markdown) -->
        <div class="form-group">
          <label for="description">
            Description détaillée <span class="required">*</span>
            <span class="label-badge">Markdown supporté</span>
          </label>
          <textarea
            id="description"
            rows="8"
            [(ngModel)]="formData.description"
            name="description"
            required
            minlength="20"
            placeholder="Détaillez votre contexte, ce que vous avez déjà essayé, le blocage rencontré ou ce que vous recherchez..."
            class="form-control"
            #descInput="ngModel"
          ></textarea>
          <div class="field-hint" *ngIf="descInput.invalid && descInput.touched">
            La description doit contenir au moins 20 caractères.
          </div>
        </div>

        <!-- Niveau du demandeur -->
        <div class="form-group">
          <label for="niveau">Votre niveau d'expérience</label>
          <select id="niveau" [(ngModel)]="formData.niveauDemandeur" name="niveauDemandeur" class="form-control">
            <option [ngValue]="undefined">Non spécifié</option>
            <option value="JUNIOR">Débutant / Étudiant</option>
            <option value="MID">Développeur Junior (1-2 ans)</option>
            <option value="SENIOR">Intermédiaire (3-5 ans)</option>
            <option value="EXPERT">Confirmé / Senior</option>
          </select>
        </div>

        <!-- Tags & Catégories (Tâche 1.4) -->
        <div class="form-group">
          <label>Tags techniques (ex: #Angular, #Java)</label>
          <div class="tags-input-wrapper">
            <span class="tag-pill" *ngFor="let tag of formData.tags; let i = index">
              {{ tag }}
              <button type="button" (click)="removeTag(i)" class="tag-remove">×</button>
            </span>
            <input
              type="text"
              [(ngModel)]="newTag"
              name="newTag"
              (keydown.enter)="addTag($event)"
              placeholder="Ajouter un tag puis Entrée..."
              class="tag-input"
            />
          </div>

          <!-- Tags populaires suggérés -->
          <div class="suggested-tags">
            <span class="suggested-label">Suggestions :</span>
            <button
              type="button"
              *ngFor="let tag of popularTags"
              class="suggested-tag-btn"
              [class.selected]="formData.tags.includes(tag)"
              (click)="toggleTag(tag)">
              + {{ tag }}
            </button>
          </div>
        </div>

        <!-- Alertes & Messages -->
        <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>
        <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>

        <!-- Boutons d'action -->
        <div class="form-actions">
          <button type="button" routerLink="/dashboard/aide" class="btn btn-outline-clean">Annuler</button>
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting"
            class="btn btn-emerald">
            <span *ngIf="!isSubmitting">Publier ma demande</span>
            <span *ngIf="isSubmitting">Publication en cours...</span>
          </button>
        </div>

      </form>
    </div>
  `,
  styleUrls: ['./create-help-post.component.css']
})
export class CreateHelpPostComponent {
  private helpService = inject(HelpService);
  private router = inject(Router);

  types: HelpPostType[] = ['ORIENTATION', 'CODE', 'FORMATION', 'CARRIERE', 'PROJET'];
  typeLabels = HELP_TYPE_LABELS;
  popularTags = POPULAR_TAGS.slice(0, 15);

  formData: HelpPostCreateRequest = {
    title: '',
    description: '',
    type: 'ORIENTATION',
    tags: [],
    screenshotUrls: [],
    visibility: 'PUBLIQUE'
  };

  newTag = '';
  isSubmitting = false;
  isUploadingPhoto = false;
  errorMessage = '';
  successMessage = '';

  resolveUrl(url?: string | null): string {
    return this.helpService.resolveScreenshotUrl(url);
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (!this.formData.screenshotUrls) {
      this.formData.screenshotUrls = [];
    }

    const availableSlots = 5 - this.formData.screenshotUrls.length;
    if (availableSlots <= 0) {
      this.errorMessage = 'Vous avez déjà atteint la limite de 5 photos.';
      input.value = '';
      return;
    }

    const filesToUpload = Array.from(input.files).slice(0, availableSlots);
    input.value = '';

    filesToUpload.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      this.isUploadingPhoto = true;
      this.helpService.uploadScreenshot(file).subscribe({
        next: (res) => {
          this.isUploadingPhoto = false;
          if (res.success && res.data?.url) {
            this.formData.screenshotUrls?.push(res.data.url);
          }
        },
        error: () => {
          this.isUploadingPhoto = false;
          this.errorMessage = 'Impossible de téléverser l\'image.';
        }
      });
    });
  }

  removePhoto(index: number): void {
    if (this.formData.screenshotUrls) {
      this.formData.screenshotUrls.splice(index, 1);
    }
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.newTag.trim().replace(/^#/, '');
    if (tag && !this.formData.tags.includes(tag)) {
      this.formData.tags.push(tag);
    }
    this.newTag = '';
  }

  removeTag(index: number): void {
    this.formData.tags.splice(index, 1);
  }

  toggleTag(tag: string): void {
    const idx = this.formData.tags.indexOf(tag);
    if (idx >= 0) {
      this.formData.tags.splice(idx, 1);
    } else {
      this.formData.tags.push(tag);
    }
  }

  submit(): void {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.helpService.createPost(this.formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.successMessage = 'Votre demande a été publiée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/dashboard/aide', res.data.id]);
          }, 1000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error?.message || 'Une erreur est survenue lors de la publication.';
      }
    });
  }
}

