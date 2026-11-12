import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="company-badge" [ngClass]="levelClass">
      <span class="badge-icon">{{ icon }}</span>
      <span class="badge-label">{{ label }}</span>
      <span *ngIf="showXp && xp !== undefined" class="badge-xp">{{ xp }} XP</span>
    </span>
  `,
  styles: [`
    .company-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .badge-icon {
      font-size: 0.85rem;
      line-height: 1;
    }

    .badge-xp {
      opacity: 0.85;
      font-size: 0.7rem;
      margin-left: 2px;
      padding-left: 6px;
      border-left: 1px solid currentColor;
    }

    /* Paliers */
    .lvl-startup {
      background: rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      border-color: rgba(148, 163, 184, 0.25);
    }

    .lvl-reconnue {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }

    .lvl-certifiee {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .lvl-partenaire {
      background: rgba(168, 85, 247, 0.12);
      color: #a855f7;
      border-color: rgba(168, 85, 247, 0.3);
    }

    .lvl-elite {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.18));
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }
  `]
})
export class CompanyBadgeComponent {
  @Input() level: string = 'STARTUP';
  @Input() xp?: number;
  @Input() showXp: boolean = false;

  get levelClass(): string {
    switch (this.level?.toUpperCase()) {
      case 'ELITE_AFRIQUE': return 'lvl-elite';
      case 'PARTENAIRE': return 'lvl-partenaire';
      case 'CERTIFIEE': return 'lvl-certifiee';
      case 'RECONNUE': return 'lvl-reconnue';
      default: return 'lvl-startup';
    }
  }

  get icon(): string {
    switch (this.level?.toUpperCase()) {
      case 'ELITE_AFRIQUE': return '👑';
      case 'PARTENAIRE': return '💎';
      case 'CERTIFIEE': return '🛡️';
      case 'RECONNUE': return '⭐';
      default: return '🌱';
    }
  }

  get label(): string {
    switch (this.level?.toUpperCase()) {
      case 'ELITE_AFRIQUE': return 'Élite Afrique';
      case 'PARTENAIRE': return 'Partenaire';
      case 'CERTIFIEE': return 'Certifiée';
      case 'RECONNUE': return 'Reconnue';
      default: return 'Startup';
    }
  }
}

