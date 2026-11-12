import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Group } from '../../../core/services/community-group.service';

@Component({
  selector: 'app-group-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="group-card app-card">
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
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span>{{ group.country }}{{ group.city ? ', ' + group.city : '' }}</span>
        </span>

        <p class="group-desc">{{ group.description }}</p>

        <!-- Tags -->
        <div class="group-tags" *ngIf="group.tags && group.tags.length > 0">
          <span class="tag-pill" *ngFor="let t of group.tags.slice(0, 3)">#{{ t }}</span>
        </div>

        <!-- Métriques avec icônes SVG fines -->
        <div class="group-metrics">
          <span class="metric-item">
            <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <strong>{{ group.memberCount }}</strong> membre{{ group.memberCount > 1 ? 's' : '' }}
          </span>
          <span class="metric-item">
            <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <strong>{{ group.postCount }}</strong> publication{{ group.postCount > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Pied de carte : Actions -->
      <div class="card-footer">
        <a [routerLink]="['/dashboard/groupes', group.slug]" class="btn-visit">Explorer</a>

        <!-- Actions Admin / Propriétaire (Modifier & Supprimer) -->
        <div class="owner-actions" *ngIf="canManage()">
          <button (click)="onEdit($event)" class="btn-icon-subtle" title="Modifier cette communauté">
            <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button (click)="onDelete($event)" class="btn-icon-subtle btn-delete-subtle" title="Supprimer cette communauté">
            <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        <button
          *ngIf="!group.isMember && !group.isPending"
          (click)="onJoin()"
          class="btn-join">
          Rejoindre
        </button>

        <span *ngIf="group.isPending" class="badge-pending">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>En attente</span>
        </span>

        <span *ngIf="group.isMember" class="badge-member">
          <svg class="icon-svg icon-svg-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span>Membre</span>
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./group-card.component.css']
})
export class GroupCardComponent {
  @Input() group!: Group;
  @Output() joinRequested = new EventEmitter<Group>();
  @Output() editRequested = new EventEmitter<Group>();
  @Output() deleteRequested = new EventEmitter<Group>();

  canManage(): boolean {
    return this.group.userRole === 'OWNER' || this.group.userRole === 'ADMIN';
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editRequested.emit(this.group);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteRequested.emit(this.group);
  }

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'G';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return 'Public';
      case 'OUVERT': return 'Sur demande';
      case 'PRIVE': return 'Privé';
      default: return type;
    }
  }

  onJoin(): void {
    this.joinRequested.emit(this.group);
  }
}
