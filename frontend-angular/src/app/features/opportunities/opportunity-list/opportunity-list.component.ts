import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OpportunityService, Opportunity } from '../../../core/services/opportunity.service';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-list.component.html',
  styleUrl: './opportunity-list.component.css'
})
export class OpportunityListComponent implements OnInit {
  private opportunityService = inject(OpportunityService);
  private authService = inject(AuthService);

  opportunities: Opportunity[] = [
    {
      id: 'opt-1',
      publisher: { id: 'u10', email: 'hr@techafrica.com', emailVerified: true, role: 'RECRUITER', status: 'ACTIVE', profile: { id: 'p10', fullName: 'Tech Africa Talent', country: 'Kenya', city: 'Nairobi', title: 'Tech Talent Acquisition', skills: [], availability: 'OPEN', completionScore: 100, mobileMoneyVerified: true } },
      title: 'Lead Architecte Java Spring Boot / Cloud',
      description: 'Nous recherchons un développeur senior pour piloter la refonte de notre plateforme bancaire distribuée.',
      type: 'JOB',
      location: 'Kenya / Remote Panafricain',
      isRemote: true,
      stack: ['Spring Boot', 'Java 21', 'Docker', 'PostgreSQL'],
      budget: '$3,500 - $5,000 / mois',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString()
    },
    {
      id: 'opt-2',
      publisher: { id: 'u11', email: 'dev@openafrica.org', emailVerified: true, role: 'DEVELOPER', status: 'ACTIVE', profile: { id: 'p11', fullName: 'OpenSource Africa Initiative', country: 'Nigeria', city: 'Lagos', title: 'Open Source Community Lead', skills: [], availability: 'OPEN', completionScore: 90, mobileMoneyVerified: true } },
      title: 'Collaboration Open Source: Calculateur de Réputation',
      description: 'Rejoignez une équipe de 4 développeurs pour concevoir l\'algorithme de vérification par les pairs en Python/FastAPI.',
      type: 'COLLABORATION',
      location: 'Remote',
      isRemote: true,
      stack: ['Python', 'FastAPI', 'Redis'],
      budget: 'Bénévolat / Open Source',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString()
    }
  ];
  selectedType: string = 'ALL';
  isLoading = false;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Apply Modal State
  showApplyModal = false;
  selectedOpportunity: Opportunity | null = null;
  applicationMessage = '';
  cvUrl = '';
  isApplying = false;
  applySuccessMessage = '';
  applyErrorMessage = '';

  // Create Opportunity Modal
  showCreateModal = false;
  isSubmitting = false;
  createErrorMessage = '';

  optTitle = '';
  optDescription = '';
  optType: 'JOB' | 'FREELANCE' | 'COLLABORATION' | 'INTERNSHIP' = 'JOB';
  optLocation = 'Sénégal (Dakar)';
  optIsRemote = true;
  optStack = 'Angular, Spring Boot';
  optBudget = '1 500 000 FCFA / mois';

  ngOnInit(): void {
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    const typeParam = this.selectedType === 'ALL' ? undefined : this.selectedType;

    this.opportunityService.getOpportunities(typeParam).subscribe({
      next: (res: any) => {
        let fetched: Opportunity[] = [];
        if (res?.success && res?.data?.content && Array.isArray(res.data.content)) {
          fetched = res.data.content;
        } else if (res?.data && Array.isArray(res.data)) {
          fetched = res.data;
        } else if (res?.content && Array.isArray(res.content)) {
          fetched = res.content;
        } else if (Array.isArray(res)) {
          fetched = res;
        }

        if (fetched && fetched.length > 0) {
          this.opportunities = fetched;
        }
      },
      error: () => {}
    });
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.loadOpportunities();
  }

  openApplyModal(opt: Opportunity): void {
    this.selectedOpportunity = opt;
    this.showApplyModal = true;
    this.applySuccessMessage = '';
    this.applyErrorMessage = '';
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedOpportunity = null;
  }

  onSubmitApplication(): void {
    if (!this.selectedOpportunity || !this.applicationMessage) return;

    this.isApplying = true;
    this.applyErrorMessage = '';

    this.opportunityService.applyToOpportunity(this.selectedOpportunity.id, this.applicationMessage, this.cvUrl).subscribe({
      next: (res) => {
        this.isApplying = false;
        if (res.success) {
          this.applySuccessMessage = 'Votre candidature a été envoyée avec succès à l\'émetteur !';
          setTimeout(() => this.closeApplyModal(), 2000);
        }
      },
      error: (err) => {
        this.isApplying = false;
        this.applyErrorMessage = err.error?.error?.message || 'Erreur lors de l\'envoi de la candidature.';
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onSubmitOpportunity(): void {
    if (!this.optTitle || !this.optDescription) return;

    const stack = this.optStack.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      title: this.optTitle,
      description: this.optDescription,
      type: this.optType,
      location: this.optLocation,
      isRemote: this.optIsRemote,
      stack: stack,
      budget: this.optBudget
    };

    this.isSubmitting = true;

    this.opportunityService.createOpportunity(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadOpportunities();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.createErrorMessage = err.error?.error?.message || 'Erreur lors de la publication.';
      }
    });
  }
}
