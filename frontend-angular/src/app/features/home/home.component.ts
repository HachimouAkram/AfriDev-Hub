import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { NetworkService, UserNetwork } from '../../core/services/network.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private networkService = inject(NetworkService);

  featuredProjects: Project[] = [];
  featuredMembers: UserNetwork[] = [];
  isLoadingProjects = false;
  isLoadingMembers = false;

  ngOnInit(): void {
    this.loadFeaturedProjects();
    this.loadFeaturedMembers();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  loadFeaturedProjects(): void {
    this.isLoadingProjects = true;
    this.projectService.getProjects(0, 4).subscribe({
      next: (res) => {
        this.isLoadingProjects = false;
        if (res.success && res.data) {
          this.featuredProjects = res.data.content || res.data || [];
        }
      },
      error: () => this.isLoadingProjects = false
    });
  }

  loadFeaturedMembers(): void {
    this.isLoadingMembers = true;
    this.networkService.getNetworkUsers({ role: 'ALL' }).subscribe({
      next: (res) => {
        this.isLoadingMembers = false;
        if (res.success && res.data) {
          // Exclude self if logged in or display top 4 members
          const currentId = this.authService.currentUser()?.id;
          this.featuredMembers = res.data
            .filter((u: UserNetwork) => u.id !== currentId)
            .slice(0, 4);
        }
      },
      error: () => this.isLoadingMembers = false
    });
  }

  cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\?\?/g, 'é').replace(/S\?\?n\?\?gal/gi, 'Sénégal');
  }
}
