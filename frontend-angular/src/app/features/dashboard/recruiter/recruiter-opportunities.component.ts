import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardOffersComponent } from '../pages/dashboard-offers/dashboard-offers.component';

@Component({
  selector: 'app-recruiter-opportunities',
  standalone: true,
  imports: [CommonModule, DashboardOffersComponent],
  template: `
    <div class="recruiter-subpage-wrapper">
      <div class="page-notice">
        <span class="notice-badge">Entreprise</span>
        <p>Toutes les offres créées depuis cette interface portent automatiquement le nom et le badge de votre entreprise.</p>
      </div>
      <app-dashboard-offers></app-dashboard-offers>
    </div>
  `,
  styles: [`
    .recruiter-subpage-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-notice {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .notice-badge {
      background: #10b981;
      color: #064e3b;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .page-notice p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-primary, #f8fafc);
    }
  `]
})
export class RecruiterOpportunitiesComponent {}

