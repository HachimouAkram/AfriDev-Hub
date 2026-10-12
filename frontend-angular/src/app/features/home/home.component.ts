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

  // Animated Statistics above Showcase
  statDevs = 0;
  statProjects = 0;
  statOffers = 0;
  statCountries = 0;

  ngOnInit(): void {
    this.loadFeaturedProjects();
    this.loadFeaturedMembers();
    this.animateCounters();
  }

  animateCounters(): void {
    const targetDevs = 56740;
    const targetProjects = 12480;
    const targetOffers = 3850;
    const targetCountries = 54;
    const duration = 2200; // ms
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo curve for smooth finish
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      this.statDevs = Math.floor(easeProgress * targetDevs);
      this.statProjects = Math.floor(easeProgress * targetProjects);
      this.statOffers = Math.floor(easeProgress * targetOffers);
      this.statCountries = Math.floor(easeProgress * targetCountries);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  loadFeaturedProjects(): void {
    this.isLoadingProjects = true;
    this.projectService.getProjects(0, 3).subscribe({
      next: (res) => {
        this.isLoadingProjects = false;
        if (res.success && res.data) {
          const list = res.data.content || res.data || [];
          this.featuredProjects = list.slice(0, 3);
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
