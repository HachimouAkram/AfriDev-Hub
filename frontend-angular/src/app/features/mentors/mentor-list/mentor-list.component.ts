import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MentorService, MentorCard } from '../../../core/services/mentor.service';
import { MentorCardComponent } from '../mentor-card/mentor-card.component';
import { POPULAR_TAGS } from '../../../core/services/help.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mentor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MentorCardComponent],
  template: `
    <div class="mentors-page-container">
      <!-- Header -->
      <header class="mentors-header">
        <div class="header-content">
          <div class="badge-mentor-header">🏆 Réseau des Mentors Bénévoles</div>
          <h1>Trouver un Mentor Tech Panafricain</h1>
          <p>
            Connectez-vous avec des développeurs seniors et experts d'Afrique prêts à vous orienter, relire votre code et booster votre carrière.
          </p>
        </div>

        <div class="header-action-box">
          <a routerLink="/dashboard/profile" class="btn-become-mentor">
            <span>✨ Devenir Mentor</span>
          </a>
        </div>
      </header>

      <!-- Top Mentors / Stars de la communauté (Tâche 2.8) -->
      <section class="top-mentors-section" *ngIf="topMentors.length > 0 && !searchQuery && !selectedTopic && !selectedCountry">
        <div class="section-title-row">
          <h2>🌟 Mentors les plus actifs</h2>
          <span class="sub-label">Classés par réputation XP et nombre de développeurs accompagnés</span>
        </div>

        <div class="top-mentors-grid">
          <app-mentor-card
            *ngFor="let m of topMentors"
            [mentor]="m"
            (contactRequested)="onContactMentor($event)">
          </app-mentor-card>
        </div>
      </section>

      <!-- Barre de recherche et filtres (Tâche 2.3 & 2.5) -->
      <section class="filters-bar">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher par nom, intitulé (ex: DevOps, Fullstack, AI)..."
          />
        </div>

        <div class="select-filters">
          <select [(ngModel)]="selectedCountry" (ngModelChange)="loadMentors()">
            <option value="">🌍 Tous les pays</option>
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

          <select [(ngModel)]="selectedTopic" (ngModelChange)="loadMentors()">
            <option value="">🎯 Toutes spécialités</option>
            <option *ngFor="let t of topicsList" [value]="t">{{ t }}</option>
          </select>
        </div>
      </section>

      <!-- Grille des Mentors -->
      <section class="mentors-grid-section">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Recherche des mentors disponibles...</p>
        </div>

        <div *ngIf="!isLoading && mentors.length === 0" class="empty-state">
          <div class="empty-icon">🌱</div>
          <h3>Aucun mentor trouvé</h3>
          <p>Essayez de réinitialiser vos filtres ou devenez le premier mentor sur cette technologie !</p>
          <a routerLink="/dashboard/profile" class="btn-primary-soft">Activer mon profil mentor</a>
        </div>

        <div class="mentors-grid" *ngIf="!isLoading && mentors.length > 0">
          <app-mentor-card
            *ngFor="let m of mentors"
            [mentor]="m"
            (contactRequested)="onContactMentor($event)">
          </app-mentor-card>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar" *ngIf="totalPages > 1">
          <button class="page-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Précédent</button>
          <span class="page-info">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Suivant</button>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./mentor-list.component.css']
})
export class MentorListComponent implements OnInit {
  private mentorService = inject(MentorService);
  private router = inject(Router);

  mentors: MentorCard[] = [];
  topMentors: MentorCard[] = [];
  isLoading = false;

  searchQuery = '';
  selectedCountry = '';
  selectedTopic = '';

  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;

  topicsList = POPULAR_TAGS.slice(0, 16);
  private searchTimer?: any;

  ngOnInit(): void {
    this.loadTopMentors();
    this.loadMentors();
  }

  loadTopMentors(): void {
    this.mentorService.getTopMentors(3).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.topMentors = res.data;
        }
      }
    });
  }

  loadMentors(): void {
    this.isLoading = true;
    this.mentorService.getMentors(this.selectedCountry, this.selectedTopic, this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.mentors = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
          this.totalPages = res.data.totalPages || 0;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadMentors();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadMentors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onContactMentor(mentor: MentorCard): void {
    const targetId = mentor.user?.id || mentor.id;
    this.router.navigate(['/dashboard/messages'], {
      queryParams: { targetUser: targetId, subject: 'Demande de Mentorat' }
    });
  }
}

