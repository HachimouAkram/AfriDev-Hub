import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="company-badge" [ngClass]="levelClass">
      <span class="badge-dot"></span>
      <span class="badge-label">{{ label }}</span>
      <span *ngIf="showXp && xp !== undefined" class="badge-xp">{{ xp }} XP</span>
    </span>
  `,
  styles: [`
    .company-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 11px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
      flex-shrink: 0;
    }

    .badge-xp {
      opacity: 0.9;
      font-size: 0.72rem;
      margin-left: 2px;
      padding-left: 6px;
      border-left: 1px solid currentColor;
    }

    /* Paliers */
    .lvl-startup {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }

    .lvl-reconnue {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .lvl-certifiee {
      background: rgba(168, 85, 247, 0.12);
      color: #a855f7;
      border-color: rgba(168, 85, 247, 0.3);
    }

    .lvl-partenaire {
      background: rgba(249, 115, 22, 0.12);
      color: #f97316;
      border-color: rgba(249, 115, 22, 0.3);
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
    const l = this.level?.toUpperCase() || '';
    if (l.includes('ELITE') || l.includes('ÉLITE')) return 'lvl-elite';
    if (l.includes('PARTENAIRE')) return 'lvl-partenaire';
    if (l.includes('CERTIF')) return 'lvl-certifiee';
    if (l.includes('RECONNUE')) return 'lvl-reconnue';
    return 'lvl-startup';
  }

  get label(): string {
    const l = this.level?.toUpperCase() || '';
    if (l.includes('ELITE') || l.includes('ÉLITE')) return 'Élite Afrique';
    if (l.includes('PARTENAIRE')) return 'Partenaire';
    if (l.includes('CERTIF')) return 'Certifiée';
    if (l.includes('RECONNUE')) return 'Reconnue';
    return 'Startup';
  }
}
