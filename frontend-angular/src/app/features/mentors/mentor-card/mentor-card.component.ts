import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MentorCard } from '../../../core/services/mentor.service';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mentor-card app-card">
      <!-- En-tête avec Avatar & Niveau XP -->
      <div class="card-top">
        <div class="avatar-wrap">
          <div class="mentor-avatar">
            {{ getInitial(mentor.fullName) }}
          </div>
          <span class="badge-mentor" title="Mentor certifié AfriDev">
            <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span>Mentor</span>
          </span>
        </div>

        <div class="xp-badge">
          <span class="xp-points">{{ mentor.xpPoints }} XP</span>
          <span class="xp-level">{{ mentor.levelTitle }}</span>
        </div>
      </div>

      <!-- Infos principales -->
      <div class="mentor-info">
        <h3 class="mentor-name">{{ mentor.fullName }}</h3>
        <p class="mentor-title">{{ mentor.title || 'Développeur Senior' }}</p>
        <span class="mentor-location" *ngIf="mentor.country">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span>{{ mentor.city ? mentor.city + ', ' : '' }}{{ mentor.country }}</span>
        </span>
      </div>

      <!-- Bio / Pitch -->
      <p class="mentor-bio">
        {{ mentor.mentorBio || 'Disponible pour accompagner des développeurs juniors et étudiants de la tech.' }}
      </p>

      <!-- Domaines de mentorat -->
      <div class="mentor-topics" *ngIf="mentor.mentorTopics && mentor.mentorTopics.length > 0">
        <span class="topic-tag" *ngFor="let topic of mentor.mentorTopics.slice(0, 4)">
          {{ topic }}
        </span>
      </div>

      <!-- Statistiques d'impact -->
      <div class="mentor-stats-bar">
        <div class="stat-item">
          <span class="stat-num">
            <svg class="icon-svg icon-svg-xs text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ mentor.mentorHoursPerWeek }}h/sem
          </span>
          <span class="stat-label">Disponibilité</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">
            <svg class="icon-svg icon-svg-xs text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {{ mentor.menteesHelpedCount }}
          </span>
          <span class="stat-label">Développeurs aidés</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-footer">
        <a [routerLink]="['/dashboard/profile', mentor.user?.id || mentor.id]" class="btn-profile">
          Profil
        </a>
        <button (click)="contactMentor()" class="btn-contact-mentor">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.743-.598l.147-1.44a5.962 5.962 0 01-1.814-4.432C3 10.444 7.03 6.75 12 6.75s9 3.694 9 8.25z" />
          </svg>
          <span>Solliciter</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./mentor-card.component.css']
})
export class MentorCardComponent {
  @Input() mentor!: MentorCard;
  @Output() contactRequested = new EventEmitter<MentorCard>();

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'M';
  }

  contactMentor(): void {
    this.contactRequested.emit(this.mentor);
  }
}
