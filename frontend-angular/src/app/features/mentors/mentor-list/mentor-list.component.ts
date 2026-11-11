import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MentorService, MentorCard } from '../../../core/services/mentor.service';
import { MentorCardComponent } from '../mentor-card/mentor-card.component';
import { POPULAR_TAGS } from '../../../core/services/help.service';

@Component({
  selector: 'app-mentor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MentorCardComponent],
  template: `
    <div class="projects-dashboard-page animate-fade-in">
      <!-- 1. En-tête identique à Événements -->
      <div class="projects-header-card app-card">
        <div class="header-text-group">
          <h2>Trouver un Mentor Tech Panafricain</h2>
          <p class="subtext">
            Connectez-vous avec des développeurs seniors et experts d'Afrique prêts à vous orienter, relire votre code et booster votre carrière.
          </p>
        </div>

        <div class="header-buttons-wrap">
          <a routerLink="/dashboard/profile" class="btn btn-emerald btn-icon-text">
            <svg class="icon-svg icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Devenir Mentor</span>
          </a>
        </div>
      </div>

      <!-- 2. Barre de filtres par spécialités (Pills identiques à Événements) -->
      <div class="category-filters-row">
        <button
          (click)="selectTopic('')"
          class="filter-pill-btn"
          [class.active]="selectedTopic === ''">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span>Toutes spécialités</span>
        </button>
        <button
          *ngFor="let t of popularFilterTopics"
          (click)="selectTopic(t)"
          class="filter-pill-btn"
          [class.active]="selectedTopic === t">
          <span>{{ t }}</span>
        </button>
      </div>

      <!-- 3. Contrôles & Barre de Recherche (Identique à Événements) -->
      <div class="controls-bar app-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher par nom, intitulé ou technologie..."
            class="form-input search-input"
          />
        </div>

        <div class="select-filters-group">
          <select [(ngModel)]="selectedCountry" (ngModelChange)="loadMentors()" class="filter-select">
            <option value="">Tous les pays</option>
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
        </div>

        <div class="counter-badge">
          Total : <strong>{{ totalElements }}</strong> mentor(s)
        </div>
      </div>

      <!-- Top Mentors actifs -->
      <section class="top-mentors-card app-card" *ngIf="topMentors.length > 0 && !searchQuery && !selectedTopic && !selectedCountry">
        <div class="top-mentors-header">
          <div class="top-title-group">
            <svg class="icon-svg icon-svg-sm text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <h3>Mentors les plus actifs</h3>
          </div>
          <span class="subtext">Classés par réputation XP et nombre de développeurs accompagnés</span>
        </div>

        <div class="top-mentors-grid">
          <app-mentor-card
            *ngFor="let m of topMentors"
            [mentor]="m"
            (contactRequested)="onContactMentor($event)">
          </app-mentor-card>
        </div>
      </section>

      <!-- Grille Principale des Mentors -->
      <section class="mentors-content-section">
        <div *ngIf="isLoading" class="sk-grid" aria-busy="true" aria-label="Chargement des mentors">
          <div class="sk-card" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="sk-meta-row">
              <div class="sk-avatar sk-avatar-round sk-shimmer"></div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
                <div class="sk-line sk-shimmer" style="width: 66%;"></div>
                <div class="sk-line-sm sk-shimmer" style="width: 48%;"></div>
              </div>
            </div>
            <div class="sk-line sk-shimmer"></div>
            <div class="sk-meta-row">
              <div class="sk-pill sk-shimmer" style="width: 62px;"></div>
              <div class="sk-pill sk-shimmer" style="width: 72px;"></div>
            </div>
            <div class="sk-btn sk-shimmer" style="margin-top: auto;"></div>
          </div>
        </div>

        <div *ngIf="!isLoading && mentors.length === 0" class="empty-state app-card">
          <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3>Aucun mentor trouvé</h3>
          <p class="subtext">Essayez de réinitialiser vos filtres ou devenez le premier mentor sur cette technologie !</p>
          <a routerLink="/dashboard/profile" class="btn btn-emerald btn-icon-text">
            <span>Activer mon profil mentor</span>
          </a>
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
          <button class="filter-pill-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Précédent</button>
          <span class="subtext">Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
          <button class="filter-pill-btn" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">Suivant</button>
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

  popularFilterTopics = [
    'Angular', 'Spring Boot', 'Python', 'FastAPI', 'React', 'DevOps',
    'Docker', 'PostgreSQL', 'Mobile', 'Flutter', 'Data Science', 'Orientation'
  ];

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

  selectTopic(topic: string): void {
    this.selectedTopic = topic;
    this.currentPage = 0;
    this.loadMentors();
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
