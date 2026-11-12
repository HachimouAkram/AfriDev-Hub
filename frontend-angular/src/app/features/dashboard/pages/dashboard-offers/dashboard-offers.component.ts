import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, User } from '../../../../core/services/auth.service';
import { OpportunityService, Opportunity, Application } from '../../../../core/services/opportunity.service';
import { AdminService } from '../../../../core/services/admin.service';
import { MessageService, DirectMessage } from '../../../../core/services/message.service';
import { ProfileService } from '../../../../core/services/profile.service';

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
  private profileService = inject(ProfileService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

  /** Résout les URLs relatives des fichiers téléversés (CV, lettre PDF) */
  fileUrl(url: string | undefined | null): string {
    return this.profileService.getFullFileUrl(url);
  }

  // In-App PDF Viewer Modal State
  showPdfModal = false;
  isLoadingPdf = false;
  safeCvUrl: SafeResourceUrl | null = null;
  currentPdfBlobUrl: string | null = null;
  currentRawPdfUrl: string | null = null;
  currentPdfTitle = 'Document';
  currentPdfSubtitle = '';
  currentPdfFilename = 'document.pdf';

  openPdfViewer(rawUrl?: string | null, filename = 'Document.pdf', title = 'Curriculum Vitae', subtitle = 'Document du candidat'): void {
    if (!rawUrl) return;
    const proxyUrl = this.profileService.getPdfViewerUrl(rawUrl);
    this.currentRawPdfUrl = proxyUrl;
    this.currentPdfFilename = filename;
    this.currentPdfTitle = title;
    this.currentPdfSubtitle = subtitle;
    this.isLoadingPdf = true;
    this.showPdfModal = true;

    fetch(proxyUrl)
      .then(res => {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.blob();
      })
      .then(blob => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        if (this.currentPdfBlobUrl) {
          URL.revokeObjectURL(this.currentPdfBlobUrl);
        }
        this.currentPdfBlobUrl = URL.createObjectURL(pdfBlob);
        this.safeCvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentPdfBlobUrl);
        this.isLoadingPdf = false;
      })
      .catch(err => {
        console.warn('Erreur fetch PDF blob, fallback URL proxy directe:', err);
        this.safeCvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(proxyUrl);
        this.isLoadingPdf = false;
      });
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.safeCvUrl = null;
    if (this.currentPdfBlobUrl) {
      URL.revokeObjectURL(this.currentPdfBlobUrl);
      this.currentPdfBlobUrl = null;
    }
  }

  openPdfInNewTab(): void {
    if (this.currentPdfBlobUrl) {
      window.open(this.currentPdfBlobUrl, '_blank');
    } else if (this.currentRawPdfUrl) {
      window.open(this.currentRawPdfUrl, '_blank');
    }
  }

  downloadPdf(): void {
    const url = this.currentPdfBlobUrl || this.currentRawPdfUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = this.currentPdfFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getApplicantName(app: Application): string {
    return app.applicant?.profile?.fullName || app.applicant?.email || 'Candidat';
  }

  getTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'JOB': return 'Emploi (CDI/CDD)';
      case 'FREELANCE': return 'Freelance';
      case 'INTERNSHIP': return 'Stage';
      case 'COLLABORATION': return 'Collaboration';
      default: return type || 'Autre';
    }
  }

  user = this.authService.currentUser;
  myPostedOpportunities = signal<Opportunity[]>([]);
  myReceivedApplications = signal<Application[]>([]);
  loading = signal<boolean>(true);

  // Create Modal State
  showCreateModal = false;
  isSubmittingCreate = false;
  createErrorMessage = '';

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
  chatTargetApplication: Application | null = null;
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

  // Cancel Acceptance Modal State
  showCancelAcceptanceModal = false;
  cancelTargetApplication: Application | null = null;
  cancelReasonCategory = 'DESISTEMENT_CANDIDAT';
  cancelReasonDetails = '';
  isSubmittingCancel = false;
  cancelErrorMessage = '';

  // Reject Modal State
  showRejectModal = false;
  rejectTargetApplication: Application | null = null;
  rejectReason = '';
  isSubmittingReject = false;

  ngOnInit(): void {
    this.loadMyPostedData();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.openCreateModal();
      }
    });
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

  /** Récupère l'URL du CV soit depuis la candidature soit depuis le profil du candidat */
  getCandidateCvUrl(app: Application): string | null {
    if (app.cvUrl && app.cvUrl.trim().length > 0) {
      return app.cvUrl.trim();
    }
    const profileCv = (app.applicant as any)?.profile?.cvUrl;
    if (profileCv && typeof profileCv === 'string' && profileCv.trim().length > 0) {
      return profileCv.trim();
    }
    return null;
  }

  /** Retourne l'URL proxy pour visualiser le CV en PDF direct */
  candidateCvViewerUrl(app: Application): string {
    const cv = this.getCandidateCvUrl(app);
    return this.profileService.getPdfViewerUrl(cv);
  }

  // --- CREATE MODAL ---
  openCreateModal(): void {
    this.offerForm = {
      title: '',
      description: '',
      type: 'JOB',
      location: '',
      isRemote: false,
      budget: '',
      stackInput: '',
      maxApplicants: 1,
      isPaid: true
    };
    this.createErrorMessage = '';
    this.isSubmittingCreate = false;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createErrorMessage = '';
  }

  onSubmitCreate(): void {
    if (!this.offerForm.title.trim() || !this.offerForm.description.trim() || !this.offerForm.location.trim()) {
      this.createErrorMessage = 'Veuillez remplir tous les champs obligatoires (*).';
      return;
    }

    const stack = this.offerForm.stackInput
      ? this.offerForm.stackInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const finalBudget = (this.offerForm.type === 'INTERNSHIP' && !this.offerForm.isPaid)
      ? 'Non rémunéré (Convention)'
      : this.offerForm.budget.trim();

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

    this.isSubmittingCreate = true;
    this.createErrorMessage = '';

    this.opportunityService.createOpportunity(payload).subscribe({
      next: (res) => {
        this.isSubmittingCreate = false;
        if (res.success) {
          this.closeCreateModal();
          this.loadMyPostedData();
        }
      },
      error: (err) => {
        this.isSubmittingCreate = false;
        this.createErrorMessage = err.error?.message || err.error?.error?.message || 'Erreur lors de la publication de l\'offre.';
      }
    });
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
    if (newStatus === 'REJECTED') {
      this.openRejectModal(app);
      return;
    }

    this.opportunityService.updateApplicationStatus(app.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          app.status = newStatus;
          this.loadMyPostedData();
        }
      }
    });
  }

  // --- MODAL ANNULATION D'ACCEPTATION ---
  openCancelAcceptanceModal(app: Application): void {
    this.cancelTargetApplication = app;
    this.cancelReasonCategory = 'DESISTEMENT_CANDIDAT';
    this.cancelReasonDetails = '';
    this.cancelErrorMessage = '';
    this.showCancelAcceptanceModal = true;
  }

  closeCancelAcceptanceModal(): void {
    this.showCancelAcceptanceModal = false;
    this.cancelTargetApplication = null;
    this.cancelReasonDetails = '';
    this.cancelErrorMessage = '';
  }

  submitCancelAcceptance(): void {
    if (!this.cancelTargetApplication) return;

    let fullReason = '';
    if (this.cancelReasonCategory === 'DESISTEMENT_CANDIDAT') {
      fullReason = 'Désistement à la demande du candidat';
    } else if (this.cancelReasonCategory === 'MESENTENTE_TERMES') {
      fullReason = 'Mésentente ou manque de compréhension sur les termes de la mission';
    } else if (this.cancelReasonCategory === 'INDISPONIBILITE') {
      fullReason = 'Indisponibilité du candidat pour le démarrage';
    } else {
      fullReason = 'Autre motif d\'annulation';
    }

    if (this.cancelReasonDetails.trim()) {
      fullReason += ` : ${this.cancelReasonDetails.trim()}`;
    }

    this.isSubmittingCancel = true;
    this.cancelErrorMessage = '';
    this.opportunityService.updateApplicationStatus(this.cancelTargetApplication.id, 'REJECTED', fullReason).subscribe({
      next: (res) => {
        this.isSubmittingCancel = false;
        if (res.success) {
          if (this.cancelTargetApplication) {
            this.cancelTargetApplication.status = 'REJECTED';
            this.cancelTargetApplication.rejectionReason = fullReason;
          }
          this.closeCancelAcceptanceModal();
          this.loadMyPostedData();
        } else {
          this.cancelErrorMessage = res.error?.message || 'Impossible d\'annuler l\'acceptation.';
        }
      },
      error: (err) => {
        this.isSubmittingCancel = false;
        this.cancelErrorMessage = err?.error?.message || 'Une erreur est survenue lors de l\'annulation.';
      }
    });
  }

  // --- MODAL REFUS AVEC MOTIF ---
  openRejectModal(app: Application): void {
    this.rejectTargetApplication = app;
    this.rejectReason = 'Profil non retenu pour cette opportunité';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectTargetApplication = null;
    this.rejectReason = '';
  }

  submitReject(): void {
    if (!this.rejectTargetApplication) return;
    this.isSubmittingReject = true;
    const reason = this.rejectReason.trim() || 'Profil non retenu pour cette opportunité.';
    this.opportunityService.updateApplicationStatus(this.rejectTargetApplication.id, 'REJECTED', reason).subscribe({
      next: (res) => {
        this.isSubmittingReject = false;
        if (res.success) {
          if (this.rejectTargetApplication) {
            this.rejectTargetApplication.status = 'REJECTED';
            this.rejectTargetApplication.rejectionReason = reason;
          }
          this.closeRejectModal();
          this.loadMyPostedData();
        }
      },
      error: () => {
        this.isSubmittingReject = false;
      }
    });
  }

  // Direct Chat Modal Handlers
  openChatModal(applicantUser: User | undefined, app?: Application): void {
    if (!applicantUser) return;
    this.chatRecipient = applicantUser;
    this.chatTargetApplication = app || null;
    this.showChatModal = true;
    this.chatMessages = [];
    this.loadConversation(applicantUser.id);
  }

  closeChatModal(): void {
    this.showChatModal = false;
    this.chatRecipient = null;
    this.chatTargetApplication = null;
    this.newChatMessage = '';
  }

  reportFromChat(): void {
    if (!this.chatTargetApplication) return;
    const app = this.chatTargetApplication;
    this.closeChatModal();
    this.openReportModal(app);
  }

  reportSpecificMessage(msg: DirectMessage): void {
    if (!this.chatTargetApplication) return;
    const app = this.chatTargetApplication;
    const senderName = msg.sender?.profile?.fullName || 'ce candidat';
    this.closeChatModal();
    this.openReportModal(app);
    this.reportReason = `Message suspect / abusif reçu de ${senderName} : « ${msg.content} »`;
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
