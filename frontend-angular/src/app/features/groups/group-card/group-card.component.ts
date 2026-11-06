import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Group } from '../../../core/services/community-group.service';

@Component({
  selector: 'app-group-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="group-card">
      <!-- Bannière -->
      <div class="card-banner" [style.background-image]="group.bannerUrl ? 'url(' + group.bannerUrl + ')' : null">
        <div class="banner-overlay"></div>
        <span class="badge-access" [class]="'access-' + group.accessType.toLowerCase()">
          {{ getAccessLabel(group.accessType) }}
        </span>
      </div>

      <!-- Avatar & Titres -->
      <div class="card-body">
        <div class="group-avatar-wrap">
          <div class="group-avatar" *ngIf="!group.avatarUrl">
            {{ getInitial(group.name) }}
          </div>
          <img *ngIf="group.avatarUrl" [src]="group.avatarUrl" [alt]="group.name" class="group-avatar-img" />
        </div>

        <h3 class="group-name">
          <a [routerLink]="['/dashboard/groupes', group.slug]">{{ group.name }}</a>
        </h3>

        <span class="group-location" *ngIf="group.country">
          📍 {{ group.country }}{{ group.city ? ', ' + group.city : '' }}
        </span>

        <p class="group-desc">{{ group.description }}</p>

        <!-- Tags -->
        <div class="group-tags" *ngIf="group.tags && group.tags.length > 0">
          <span class="tag-pill" *ngFor="let t of group.tags.slice(0, 3)">#{{ t }}</span>
        </div>

        <!-- Métriques -->
        <div class="group-metrics">
          <span class="metric-item">
            <strong>👥 {{ group.memberCount }}</strong> membre{{ group.memberCount > 1 ? 's' : '' }}
          </span>
          <span class="metric-item">
            <strong>📝 {{ group.postCount }}</strong> publication{{ group.postCount > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Pied de carte : Actions -->
      <div class="card-footer">
        <a [routerLink]="['/dashboard/groupes', group.slug]" class="btn-visit">Explorer</a>

        <button
          *ngIf="!group.isMember && !group.isPending"
          (click)="onJoin()"
          class="btn-join">
          Rejoindre
        </button>

        <span *ngIf="group.isPending" class="badge-pending">⏳ En attente</span>

        <span *ngIf="group.isMember" class="badge-member">✓ Déjà membre</span>
      </div>
    </div>
  `,
  styleUrls: ['./group-card.component.css']
})
export class GroupCardComponent {
  @Input() group!: Group;
  @Output() joinRequested = new EventEmitter<Group>();

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'G';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return '🌐 Public';
      case 'OUVERT': return '🛡️ Sur demande';
      case 'PRIVE': return '🔒 Privé';
      default: return type;
    }
  }

  onJoin(): void {
    this.joinRequested.emit(this.group);
  }
}

