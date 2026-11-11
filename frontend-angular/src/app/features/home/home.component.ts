import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { NetworkService, UserNetwork } from '../../core/services/network.service';
import { CommunityGroupService, Group } from '../../core/services/community-group.service';

interface GlobeCountry {
  code: string;
  label: string;
  width: number;
}

interface GlobeSlot {
  id: number;
  y: number;
  align: 'center' | 'left' | 'right';
  anchorX: number;
  pool: GlobeCountry[];
  poolIdx: number;
  current: GlobeCountry;
  isSwapping: boolean;
}

const GLOBE_COUNTRIES: Record<string, GlobeCountry> = {
  SN: { code: 'SN', label: 'Sénégal', width: 94 },
  GN: { code: 'GN', label: 'Guinée', width: 88 },
  ML: { code: 'ML', label: 'Mali', width: 78 },
  MA: { code: 'MA', label: 'Maroc', width: 84 },
  TN: { code: 'TN', label: 'Tunisie', width: 92 },
  CI: { code: 'CI', label: "Côte d'Iv.", width: 102 },
  GH: { code: 'GH', label: 'Ghana', width: 88 },
  NG: { code: 'NG', label: 'Nigéria', width: 92 },
  BF: { code: 'BF', label: 'Burkina', width: 92 },
  KE: { code: 'KE', label: 'Kenya', width: 86 },
  RW: { code: 'RW', label: 'Rwanda', width: 94 },
  CM: { code: 'CM', label: 'Cameroun', width: 104 },
  BJ: { code: 'BJ', label: 'Bénin', width: 84 },
  KM: { code: 'KM', label: 'Comores', width: 98 },
  CD: { code: 'CD', label: 'RD Congo', width: 104 },
  ZA: { code: 'ZA', label: 'Afr. du Sud', width: 108 },
  EG: { code: 'EG', label: 'Égypte', width: 90 },
  TG: { code: 'TG', label: 'Togo', width: 82 }
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  public authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private networkService = inject(NetworkService);
  private groupService = inject(CommunityGroupService);
  private el = inject(ElementRef);

  featuredProjects: Project[] = [];
  featuredMembers: UserNetwork[] = [];
  featuredCommunities: Group[] = [];
  isLoadingProjects = false;
  isLoadingMembers = false;
  isLoadingCommunities = false;

  // 18 Pan-African Countries rotating smoothly across the 8 orbital globe slots (8 initial + 10 added)
  globeSlots: GlobeSlot[] = [
    { id: 0, y: 10, align: 'center', anchorX: 230, pool: [GLOBE_COUNTRIES['SN'], GLOBE_COUNTRIES['GN'], GLOBE_COUNTRIES['ML']], poolIdx: 0, current: GLOBE_COUNTRIES['SN'], isSwapping: false },
    { id: 1, y: 30, align: 'left', anchorX: 112, pool: [GLOBE_COUNTRIES['MA'], GLOBE_COUNTRIES['TN']], poolIdx: 0, current: GLOBE_COUNTRIES['MA'], isSwapping: false },
    { id: 2, y: 30, align: 'right', anchorX: 346, pool: [GLOBE_COUNTRIES['CI'], GLOBE_COUNTRIES['GH']], poolIdx: 0, current: GLOBE_COUNTRIES['CI'], isSwapping: false },
    { id: 3, y: 146, align: 'left', anchorX: 104, pool: [GLOBE_COUNTRIES['NG'], GLOBE_COUNTRIES['BF']], poolIdx: 0, current: GLOBE_COUNTRIES['NG'], isSwapping: false },
    { id: 4, y: 146, align: 'right', anchorX: 358, pool: [GLOBE_COUNTRIES['KE'], GLOBE_COUNTRIES['RW']], poolIdx: 0, current: GLOBE_COUNTRIES['KE'], isSwapping: false },
    { id: 5, y: 262, align: 'left', anchorX: 112, pool: [GLOBE_COUNTRIES['CM'], GLOBE_COUNTRIES['BJ']], poolIdx: 0, current: GLOBE_COUNTRIES['CM'], isSwapping: false },
    { id: 6, y: 262, align: 'right', anchorX: 348, pool: [GLOBE_COUNTRIES['KM'], GLOBE_COUNTRIES['CD']], poolIdx: 0, current: GLOBE_COUNTRIES['KM'], isSwapping: false },
    { id: 7, y: 282, align: 'center', anchorX: 230, pool: [GLOBE_COUNTRIES['ZA'], GLOBE_COUNTRIES['EG'], GLOBE_COUNTRIES['TG']], poolIdx: 0, current: GLOBE_COUNTRIES['ZA'], isSwapping: false }
  ];

  private readonly clockwiseOrder = [0, 2, 4, 6, 7, 5, 3, 1];
  private rotationCursor = 0;
  private flagRotationInterval?: ReturnType<typeof setInterval>;
  private flagSwapTimeouts: ReturnType<typeof setTimeout>[] = [];

  // Animated Statistics above Showcase
  statDevs = 0;
  statProjects = 0;
  statOffers = 0;
  statCountries = 0;

  private scrollObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.loadFeaturedProjects();
    this.loadFeaturedMembers();
    this.loadFeaturedCommunities();
    this.animateCounters();
    this.startFlagRotation();
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    if (this.flagRotationInterval) {
      clearInterval(this.flagRotationInterval);
    }
    this.flagSwapTimeouts.forEach((t) => clearTimeout(t));
    this.flagSwapTimeouts = [];
  }

  private startFlagRotation(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.flagRotationInterval = setInterval(() => {
      const slotIdx = this.clockwiseOrder[this.rotationCursor % this.clockwiseOrder.length];
      this.rotationCursor++;
      const slot = this.globeSlots[slotIdx];
      if (!slot) return;

      slot.isSwapping = true;
      const timer = setTimeout(() => {
        slot.poolIdx = (slot.poolIdx + 1) % slot.pool.length;
        slot.current = slot.pool[slot.poolIdx];
        slot.isSwapping = false;
      }, 260);
      this.flagSwapTimeouts.push(timer);
    }, 1350);
  }

  getSlotTransform(slot: GlobeSlot): string {
    let x = slot.anchorX;
    if (slot.align === 'center') {
      x = Math.round(slot.anchorX - slot.current.width / 2);
    } else if (slot.align === 'left') {
      x = Math.max(4, Math.round(slot.anchorX - slot.current.width));
    } else {
      x = Math.min(456 - slot.current.width, slot.anchorX);
    }
    return `translate(${x}, ${slot.y})`;
  }

  private initScrollReveal(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: make all visible
      const elements = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
      elements.forEach((el: Element) => el.classList.add('is-visible'));
      return;
    }

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once animated, stop observing this element
          this.scrollObserver?.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    const elements = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el: Element) => this.scrollObserver?.observe(el));
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

  loadFeaturedCommunities(): void {
    this.isLoadingCommunities = true;
    this.groupService.searchGroups(undefined, undefined, undefined, 0, 3).subscribe({
      next: (res) => {
        this.isLoadingCommunities = false;
        if (res.success && res.data) {
          const list = res.data.content || [];
          this.featuredCommunities = list.slice(0, 3);
        }
      },
      error: () => this.isLoadingCommunities = false
    });
  }

  getGroupInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'C';
  }

  cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\?\?/g, 'é').replace(/S\?\?n\?\?gal/gi, 'Sénégal');
  }
}
