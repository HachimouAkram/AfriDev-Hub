import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../../core/services/auth.service';
import { OpportunityService, Opportunity, Application } from '../../../../core/services/opportunity.service';
import { AdminService } from '../../../../core/services/admin.service';
import { MessageService, DirectMessage } from '../../../../core/services/message.service';

@Component({
  selector: 'app-dashboard-offers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard-offers.component.html',
  styleUrl: './dashboard-offers.component.css'
})
export class DashboardOffersComponent implements OnInit {
  private authService = inject(AuthService);
  private opportunityService = inject(OpportunityService);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  user = this.authService.currentUser;
  myPostedOpportunities = signal<Opportunity[]>([]);
  myReceivedApplications = signal<Application[]>([]);
  loading = signal<boolean>(true);

  // Detail Modal State
  showDetailModal = false;
  selectedOpportunity: Opportunity | null = null;
  opportunityApplicants: Application[] = [];
  loadingApplicants = false;

  // Edit Modal State
  showEditModal = false;
  offerForm = {
    title: '',
    description: '',
    type: 'JOB' as 'JOB' | 'FREELANCE' | 'COLLABORATION' | 'INTERNSHIP',
    location: '',
    isRemote: false,
    budget: '',
    stackInput: '',
    maxApplicants: 1,
    isPaid: true
  };
  isSubmittingEdit = false;
  editErrorMessage = '';

  // Delete Modal State
  showDeleteModal = false;
  opportunityToDelete: Opportunity | null = null;

  // Chat Modal State
  showChatModal = false;
  chatRecipient: User | null = null;
  chatMessages: DirectMessage[] = [];
  newChatMessage = '';
  isSendingMessage = false;

  // Report Modal State
  showReportModal = false;
  reportTargetApplication: Application | null = null;
  reportReason = '';
  isSubmittingReport = false;
  reportSuccessMessage = '';
  reportErrorMessage = '';

  ngOnInit(): void {
    this.loadMyPostedData();
  }

  loadMyPostedData(): void {
    this.loading.set(true);
    this.opportunityService.getMyPostedOpportunities().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myPostedOpportunities.set(res.data);
        }
      }
    });

    this.opportunityService.getReceivedApplications().subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.myReceivedApplications.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  cleanText(txt: string | undefined): string {
    if (!txt) return '';
    return txt.replace(/S\?\?n\?\?gal/gi, 'Sénégal')
              .replace(/Dakar/gi, 'Dakar');
  }

  // --- DETAIL MODAL & APPLICANTS FOR THIS OFFER ---
  openDetailModal(opp: Opportunity): void {
    this.selectedOpportunity = opp;
    this.showDetailModal = true;
    this.opportunityApplicants = [];
    this.loadingApplicants = true;

    this.opportunityService.getApplications(opp.id).subscribe({
      next: (res) => {
        this.loadingApplicants = false;
        if (res.success && res.data) {
          this.opportunityApplicants = res.data;
        }
      },
      error: () => {
        this.loadingApplicants = false;
        // Fallback filter from received applications
        this.opportunityApplicants = this.myReceivedApplications().filter(a => a.opportunityId === opp.id);
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOpportunity = null;
    this.opportunityApplicants = [];
  }

  // --- EDIT MODAL ---
  openEditModal(opp: Opportunity): void {
    this.selectedOpportunity = opp;
    this.offerForm = {
      title: opp.title,
      description: opp.description,
      type: opp.type,
      location: opp.location,
      isRemote: opp.isRemote || false,
      budget: opp.budget || '',
      stackInput: opp.stack ? opp.stack.join(', ') : '',
      maxApplicants: opp.maxApplicants || 1,
      isPaid: opp.isPaid !== undefined ? opp.isPaid : true
    };
    this.editErrorMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedOpportunity = null;
  }

  submitEdit(): void {
    if (!this.selectedOpportunity) return;
    if (!this.offerForm.title.trim() || !this.offerForm.description.trim()) {
      this.editErrorMessage = 'Le titre et la description sont obligatoires.';
      return;
    }

    this.isSubmittingEdit = true;
    this.editErrorMessage = '';

    const stack = this.offerForm.stackInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const finalBudget = (this.offerForm.type === 'INTERNSHIP' && !this.offerForm.isPaid)
      ? 'Non rémunéré (Convention)'
      : (this.offerForm.budget.trim() || null);

    const payload = {
      title: this.offerForm.title.trim(),
      description: this.offerForm.description.trim(),
      type: this.offerForm.type,
      location: this.offerForm.location.trim(),
      isRemote: this.offerForm.isRemote,
      budget: finalBudget,
      stack: stack,
      maxApplicants: this.offerForm.maxApplicants > 0 ? this.offerForm.maxApplicants : 1,
      isPaid: this.offerForm.type === 'INTERNSHIP' ? this.offerForm.isPaid : true
    };

    this.opportunityService.updateOpportunity(this.selectedOpportunity.id, payload).subscribe({
      next: (res) => {
        this.isSubmittingEdit = false;
        if (res.success) {
          this.closeEditModal();
          this.loadMyPostedData();
        }
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        this.editErrorMessage = err.error?.message || 'Erreur lors de la mise à jour de l\'offre.';
      }
    });
  }

  // --- TOGGLE STATUS ---
  toggleStatus(opp: Opportunity): void {
    this.opportunityService.toggleOpportunityStatus(opp.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMyPostedData();
        }
      }
    });
  }

  // --- DELETE MODAL ---
  confirmDelete(opp: Opportunity): void {
    this.opportunityToDelete = opp;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.opportunityToDelete = null;
  }

  executeDelete(): void {
    if (!this.opportunityToDelete) return;

    this.opportunityService.deleteOpportunity(this.opportunityToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadMyPostedData();
      },
      error: (err) => {
        console.error('Erreur suppression offre:', err);
        this.closeDeleteModal();
      }
    });
  }

  // --- APPLICATION STATUS ACTIONS ---
  onUpdateStatus(app: Application, newStatus: 'ACCEPTED' | 'REJECTED'): void {
    this.opportunityService.updateApplicationStatus(app.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          app.status = newStatus;
        }
      }
    });
  }

  // Direct Chat Modal Handlers
  openChatModal(applicantUser: User | undefined): void {
    if (!applicantUser) return;
    this.chatRecipient = applicantUser;
    this.showChatModal = true;
    this.chatMessages = [];
    this.loadConversation(applicantUser.id);
  }

  closeChatModal(): void {
    this.showChatModal = false;
    this.chatRecipient = null;
    this.newChatMessage = '';
  }

  loadConversation(otherUserId: string): void {
    this.messageService.getConversation(otherUserId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.chatMessages = res.data;
        }
      }
    });
  }

  sendChatMessage(): void {
    if (!this.newChatMessage.trim() || !this.chatRecipient) return;
    this.isSendingMessage = true;

    this.messageService.sendMessage(this.chatRecipient.id, this.newChatMessage).subscribe({
      next: (res) => {
        this.isSendingMessage = false;
        if (res.success && res.data) {
          this.chatMessages.push(res.data);
          this.newChatMessage = '';
        }
      },
      error: () => {
        this.isSendingMessage = false;
      }
    });
  }

  // Report Modal Handlers
  openReportModal(app: Application): void {
    this.reportTargetApplication = app;
    this.reportReason = '';
    this.reportErrorMessage = '';
    this.reportSuccessMessage = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportTargetApplication = null;
  }

  submitReport(): void {
    if (!this.reportTargetApplication || !this.reportReason.trim()) return;

    this.isSubmittingReport = true;
    const reasonText = `Signalement candidature [AppID: ${this.reportTargetApplication.id}] pour l'offre [${this.reportTargetApplication.opportunityTitle}]: ${this.reportReason}`;

    this.adminService.createReport('APPLICATION', this.reportTargetApplication.id, reasonText).subscribe({
      next: (res) => {
        this.isSubmittingReport = false;
        if (res.success) {
          this.reportSuccessMessage = 'Signalement transmis aux modérateurs avec succès.';
          setTimeout(() => this.closeReportModal(), 1800);
        }
      },
      error: (err) => {
        this.isSubmittingReport = false;
        this.reportErrorMessage = err.error?.message || 'Erreur lors de l\'envoi du signalement.';
      }
    });
  }
}
