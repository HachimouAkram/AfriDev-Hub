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
    <div class="create-help-container">
      <div class="create-help-header">
        <a routerLink="/dashboard/aide" class="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour au feed
        </a>
        <h1>📢 Demander de l'Aide ou une Orientation</h1>
        <p class="subtitle">
          Expliquez clairement votre besoin. La communauté et nos volontaires vous répondront rapidement.
        </p>
      </div>

      <form (ngSubmit)="submit()" class="create-help-form" #form="ngForm">

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
            <option value="JUNIOR">🌱 Débutant / Étudiant</option>
            <option value="MID">🧑‍💻 Développeur Junior (1-2 ans)</option>
            <option value="SENIOR">⭐ Intermédiaire (3-5 ans)</option>
            <option value="EXPERT">🏆 Confirmé / Senior</option>
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
          <button type="button" routerLink="/dashboard/aide" class="btn-cancel">Annuler</button>
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting"
            class="btn-submit">
            <span *ngIf="!isSubmitting">📢 Publier ma demande</span>
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
    visibility: 'PUBLIQUE'
  };

  newTag = '';
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

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
