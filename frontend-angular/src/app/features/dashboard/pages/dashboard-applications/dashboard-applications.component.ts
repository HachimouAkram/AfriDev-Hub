import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OpportunityService, Application } from '../../../../core/services/opportunity.service';

@Component({
  selector: 'app-dashboard-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-applications.component.html',
  styleUrl: './dashboard-applications.component.css'
})
export class DashboardApplicationsComponent implements OnInit {
  private opportunityService = inject(OpportunityService);

  mySubmittedApplications = signal<Application[]>([]);
  loading = signal<boolean>(true);

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
}
