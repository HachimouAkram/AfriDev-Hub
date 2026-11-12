import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OpportunityService, Application } from '../../../../core/services/opportunity.service';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-dashboard-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-applications.component.html',
  styleUrl: './dashboard-applications.component.css'
})
export class DashboardApplicationsComponent implements OnInit {
  private opportunityService = inject(OpportunityService);
  private profileService = inject(ProfileService);
  private sanitizer = inject(DomSanitizer);

  /** Résout les URLs relatives des fichiers téléversés */
  fileUrl(url: string | undefined | null): string {
    return this.profileService.getFullFileUrl(url);
  }

  mySubmittedApplications = signal<Application[]>([]);
  loading = signal<boolean>(true);

  // In-App PDF Viewer Modal State
  showPdfModal = false;
  isLoadingPdf = false;
  safeCvUrl: SafeResourceUrl | null = null;
  currentPdfBlobUrl: string | null = null;
  currentRawPdfUrl: string | null = null;
  currentPdfTitle = 'Document';
  currentPdfSubtitle = '';
  currentPdfFilename = 'document.pdf';

  ngOnInit(): void {
    this.loadMyApplications();
  }

  loadMyApplications(): void {
    this.opportunityService.getMyApplications().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.mySubmittedApplications.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  openPdfViewer(rawUrl?: string | null, filename = 'Document.pdf', title = 'Curriculum Vitae', subtitle = 'Document PDF officiel'): void {
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
}
