import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluationService, Evaluation, ReputationScore, Collaboration } from '../../../core/services/evaluation.service';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './evaluation-list.component.html',
  styleUrl: './evaluation-list.component.css'
})
export class EvaluationListComponent implements OnInit {
  private evalService = inject(EvaluationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  evaluateeId: string = '';
  reputationScore: ReputationScore | null = null;
  evaluations: Evaluation[] = [];
  myCollaborations: Collaboration[] = [];
  isLoading = true;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  currentUser = this.authService.currentUser;

  // Declare Collab Modal
  showCollabModal = false;
  partnerId = '';
  collabType = 'COMMON_REPO';
  proofUrl = '';
  isDeclaring = false;
  collabSuccessMessage = '';
  collabErrorMessage = '';

  // Submit Evaluation Modal
  showEvalModal = false;
  selectedCollabId = 'collab-mock-1';
  targetEvaluateeId = '';

  codeQuality = 5;
  collaborationRating = 5;
  technicalDepth = 4;
  reliability = 5;
  feedback = '';
  isSubmittingEval = false;
  evalSuccessMessage = '';
  evalErrorMessage = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.evaluateeId = params['id'] || this.currentUser()?.id || this.currentUser()?.profile?.id || 'p1';
      this.loadEvaluationsData();
    });
  }

  loadEvaluationsData(): void {
    this.isLoading = true;
    this.evalService.getReputationScore(this.evaluateeId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reputationScore = res.data;
        }
      },
      error: () => {
        // Mock data preview if backend is empty
        this.reputationScore = {
          evaluateeId: this.evaluateeId,
          totalEvaluations: 4,
          overallReputationScore: 4.8,
          codeQualityAvg: 4.9,
          collaborationAvg: 4.7,
          technicalDepthAvg: 4.8,
          reliabilityAvg: 4.9,
          dimensions: [
            { dimension: 'Qualité du Code', score: 4.9 },
            { dimension: 'Profondeur Technique', score: 4.8 },
            { dimension: 'Fiabilité & Délais', score: 4.9 },
            { dimension: 'Collaboration & Communication', score: 4.7 }
          ]
        };
      }
    });

    this.evalService.getReceivedEvaluations(this.evaluateeId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.evaluations = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });

    if (this.isLoggedIn()) {
      this.evalService.getMyCollaborations().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.myCollaborations = res.data;
          }
        },
        error: () => {}
      });
    }
  }

  onVerifyCollab(collabId: string): void {
    this.evalService.verifyCollaboration(collabId).subscribe({
      next: (res) => {
        if (res.success) {
          const found = this.myCollaborations.find(c => c.id === collabId);
          if (found) found.verified = true;
          this.loadEvaluationsData();
        }
      }
    });
  }

  openCollabModal(): void {
    this.showCollabModal = true;
    this.collabSuccessMessage = '';
    this.collabErrorMessage = '';
  }

  closeCollabModal(): void {
    this.showCollabModal = false;
  }

  onSubmitCollab(): void {
    if (!this.partnerId || !this.proofUrl) return;

    this.isDeclaring = true;
    this.collabErrorMessage = '';

    this.evalService.declareCollaboration(this.partnerId, this.collabType, this.proofUrl).subscribe({
      next: (res) => {
        this.isDeclaring = false;
        if (res.success) {
          this.collabSuccessMessage = 'Collaboration déclarée ! En attente de vérification par votre partenaire.';
          setTimeout(() => this.closeCollabModal(), 2000);
        }
      },
      error: (err) => {
        this.isDeclaring = false;
        this.collabErrorMessage = err.error?.error?.message || 'Erreur lors de la déclaration.';
      }
    });
  }

  getPendingEvaluationsCollaborations(): Collaboration[] {
    return this.myCollaborations.filter(c => c.verified && !c.evaluatedByCurrentUser);
  }

  openEvalModal(collabOrEvaluateeId?: any): void {
    const pendingList = this.getPendingEvaluationsCollaborations();
    if (typeof collabOrEvaluateeId === 'object' && collabOrEvaluateeId?.id) {
      this.selectedCollabId = collabOrEvaluateeId.id;
      const currId = this.currentUser()?.id;
      this.targetEvaluateeId = (collabOrEvaluateeId.initiator?.id === currId)
        ? collabOrEvaluateeId.partner?.id
        : collabOrEvaluateeId.initiator?.id;
    } else {
      if (typeof collabOrEvaluateeId === 'string' && collabOrEvaluateeId) {
        this.targetEvaluateeId = collabOrEvaluateeId;
      }
      if (pendingList.length > 0) {
        this.selectedCollabId = pendingList[0].id;
        this.onCollabSelected();
      } else {
        this.selectedCollabId = '';
      }
    }
    this.showEvalModal = true;
    this.evalSuccessMessage = '';
    this.evalErrorMessage = '';
  }

  onCollabSelected(): void {
    const found = this.myCollaborations.find(c => c.id === this.selectedCollabId);
    if (found) {
      const currId = this.currentUser()?.id;
      this.targetEvaluateeId = (found.initiator?.id === currId)
        ? found.partner?.id
        : found.initiator?.id;
    }
  }

  getSelectedCollab(): Collaboration | null {
    if (!this.selectedCollabId) return null;
    return this.myCollaborations.find(c => c.id === this.selectedCollabId) || null;
  }

  getEvaluateeName(collab: Collaboration | null): string {
    if (!collab) return 'Développeur';
    const currId = this.currentUser()?.id;
    const targetUser = (collab.initiator?.id === currId) ? collab.partner : collab.initiator;
    return targetUser?.profile?.fullName || targetUser?.email || 'Développeur';
  }

  closeEvalModal(): void {
    this.showEvalModal = false;
  }

  onSubmitEval(): void {
    if (!this.targetEvaluateeId || !this.selectedCollabId) return;

    const payload = {
      evaluateeId: this.targetEvaluateeId,
      collaborationId: this.selectedCollabId,
      codeQuality: this.codeQuality,
      collaborationRating: this.collaborationRating,
      technicalDepth: this.technicalDepth,
      reliability: this.reliability,
      feedback: this.feedback,
      isPublic: true
    };

    this.isSubmittingEval = true;
    this.evalErrorMessage = '';

    this.evalService.submitEvaluation(payload).subscribe({
      next: (res) => {
        this.isSubmittingEval = false;
        if (res.success) {
          this.evalSuccessMessage = 'Évaluation soumise avec succès ! Le score de réputation a été réattribué.';
          setTimeout(() => {
            this.closeEvalModal();
            this.loadEvaluationsData();
          }, 2000);
        }
      },
      error: (err) => {
        this.isSubmittingEval = false;
        this.evalErrorMessage = err.error?.error?.message || 'RÈGLE DE SÉCURITÉ : La collaboration doit impérativement être vérifiée par le partenaire avant l\'évaluation.';
      }
    });
  }
}
