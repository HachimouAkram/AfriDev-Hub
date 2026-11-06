import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MentorCard } from '../../../core/services/mentor.service';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mentor-card">
      <!-- En-tête avec Avatar & Niveau XP -->
      <div class="card-top">
        <div class="avatar-wrap">
          <div class="mentor-avatar">
            {{ getInitial(mentor.fullName) }}
          </div>
          <span class="badge-mentor" title="Mentor certifié AfriDev">🏆 Mentor</span>
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
        <span class="mentor-location">📍 {{ mentor.city }}, {{ mentor.country }}</span>
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
          <span class="stat-num">⏳ {{ mentor.mentorHoursPerWeek }}h/sem</span>
          <span class="stat-label">Disponibilité</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">🤝 {{ mentor.menteesHelpedCount }}</span>
          <span class="stat-label">Aidés</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-footer">
        <a [routerLink]="['/dashboard/profile', mentor.user?.id || mentor.id]" class="btn-profile">
          Profil
        </a>
        <button (click)="contactMentor()" class="btn-contact-mentor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.743-.598l.147-1.44a5.962 5.962 0 01-1.814-4.432C3 10.444 7.03 6.75 12 6.75s9 3.694 9 8.25z" />
          </svg>
          Solliciter
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

