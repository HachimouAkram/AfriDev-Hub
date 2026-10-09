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

  opportunities: Opportunity[] = [];
  selectedType: string = 'ALL';
  isLoading = true;

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
    this.isLoading = true;
    const typeParam = this.selectedType === 'ALL' ? undefined : this.selectedType;

    this.opportunityService.getOpportunities(typeParam).subscribe({
      next: (res: any) => {
        this.isLoading = false;
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

        this.opportunities = fetched;
      },
      error: () => {
        this.isLoading = false;
        this.opportunities = [];
      }
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
