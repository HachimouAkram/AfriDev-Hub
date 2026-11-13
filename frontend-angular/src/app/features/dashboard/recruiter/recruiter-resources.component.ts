import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResourcesComponent } from '../pages/dashboard-resources/dashboard-resources.component';

@Component({
  selector: 'app-recruiter-resources',
  standalone: true,
  imports: [CommonModule, DashboardResourcesComponent],
  template: `
    <div class="recruiter-subpage-wrapper">
      <div class="page-notice">
        <span class="notice-badge">Savoir & Formations</span>
        <p>Partagez les cours, frameworks et guides techniques de votre entreprise avec la communauté.</p>
      </div>
      <app-dashboard-resources></app-dashboard-resources>
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
export class RecruiterResourcesComponent {}

