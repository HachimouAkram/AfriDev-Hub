import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { NetworkService, UserNetwork } from '../../core/services/network.service';
import { CommunityGroupService, Group } from '../../core/services/community-group.service';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';
import { CompanyService, Company } from '../../core/services/company.service';
import { resolveUploadedMediaUrl } from '../../core/utils/upload-helper';

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
  private leaderboardService = inject(LeaderboardService);
  private companyService = inject(CompanyService);
  private el = inject(ElementRef);
  private ngZone = inject(NgZone);

  featuredProjects: Project[] = [];
  featuredMembers: LeaderboardEntry[] = [];
  featuredCommunities: Group[] = [];
  partnerCompanies: Company[] = [];
  isLoadingProjects = false;
  isLoadingMembers = false;
  isLoadingCommunities = false;
  isLoadingPartners = false;

  // Section active pour le background dynamique multi-sections (0: Hero Collab, 1: Piliers, 2: Projets, 3: Talents/Communautés, 4: Étapes/CTA)
  activeStage = 0;
  private brokenCoverIds = new Set<string>();

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

  @ViewChild('stageCanvas') private stageCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bgCinemaVideo') private bgCinemaVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('videoLayer') private videoLayerRef?: ElementRef<HTMLElement>;
  private scrollObserver?: IntersectionObserver;
  private stageSectionObserver?: IntersectionObserver;
  private videoScrollListener?: () => void;
  private resizeStageListener?: () => void;
  private stageAnimId?: number;

  ngOnInit(): void {
    this.loadFeaturedProjects();
    this.loadFeaturedMembers();
    this.loadFeaturedCommunities();
    this.loadPartnerCompanies();
    this.animateCounters();
    this.startFlagRotation();
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initStageSectionObserver();
    this.initScrollReactiveVideo();
  }

  ngOnDestroy(): void {
    if (this.stageAnimId) {
      cancelAnimationFrame(this.stageAnimId);
    }
    if (this.videoScrollListener) {
      this.videoScrollListener();
    }
    if (this.resizeStageListener) {
      this.resizeStageListener();
    }
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    if (this.stageSectionObserver) {
      this.stageSectionObserver.disconnect();
    }
    if (this.flagRotationInterval) {
      clearInterval(this.flagRotationInterval);
    }
    this.flagSwapTimeouts.forEach((t) => clearTimeout(t));
    this.flagSwapTimeouts = [];
  }

  /**
   * Initialise la vidéo de fond cinématique Pinterest et synchronise de façon ultra-fluide
   * sa vitesse de lecture, sa parallaxe 3D et son échelle avec le défilement (scroll) de l'utilisateur.
   * Garantit une boucle infinie continue sans aucun blocage ou arrêt soudain.
   */
  private initScrollReactiveVideo(): void {
    if (typeof window === 'undefined' || !this.bgCinemaVideoRef) return;
    const video = this.bgCinemaVideoRef.nativeElement;
    const layer = this.videoLayerRef?.nativeElement;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('loop', '');
    video.setAttribute('autoplay', '');

    // Déclencheur automatique de lecture résistant aux restrictions navigateurs / mobiles
    const startPlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };
    startPlay();
    video.addEventListener('canplay', startPlay);
    video.addEventListener('loadeddata', startPlay);
    document.addEventListener('touchstart', startPlay, { passive: true, once: true });
    document.addEventListener('click', startPlay, { passive: true, once: true });
    window.addEventListener('focus', startPlay);

    // Watchdogs pour assurer une boucle infinie permanente (ne s'arrête jamais)
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    video.addEventListener('pause', () => {
      setTimeout(() => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      }, 50);
    });

    video.addEventListener('error', () => {
      setTimeout(() => {
        video.load();
        video.play().catch(() => {});
      }, 300);
    });

    let lastScrollY = window.scrollY || 0;
    let targetPlaybackRate = 1.0;
    let currentPlaybackRate = 1.0;
    let lastTime = performance.now();
    let isTicking = false;

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 0.016);
      lastTime = now;

      const deltaY = Math.abs(scrollY - lastScrollY);
      lastScrollY = scrollY;

      // 1. Plus l'utilisateur scrolle, plus l'animation vidéo s'enchaîne et s'accélère
      const scrollVelocity = deltaY / dt;
      targetPlaybackRate = Math.min(1.0 + (scrollVelocity / 600) * 1.15, 2.5);

      // Réveiller la lecture au scroll si elle était en attente
      if (video.paused) {
        video.play().catch(() => {});
      }

      // 2. Parallaxe et profondeur 3D douce selon la progression du scroll
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

      if (layer) {
        const translateY = -scrollY * 0.11;
        const scale = 1.02 + progress * 0.07;
        layer.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }

      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(updateMotion);
      }
    };

    const updateMotion = () => {
      // Amorti fluide de la vitesse de lecture vers 1.0x (inertie naturelle)
      currentPlaybackRate += (targetPlaybackRate - currentPlaybackRate) * 0.12;
      targetPlaybackRate += (1.0 - targetPlaybackRate) * 0.06;

      if (video && !isNaN(currentPlaybackRate)) {
        video.playbackRate = Math.max(0.85, Math.min(currentPlaybackRate, 2.5));
      }

      if (Math.abs(targetPlaybackRate - 1.0) > 0.02 || Math.abs(currentPlaybackRate - 1.0) > 0.02) {
        requestAnimationFrame(updateMotion);
      } else {
        if (video) video.playbackRate = 1.0;
        isTicking = false;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.videoScrollListener = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('focus', startPlay);
    };
    onScroll();
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

  private initStageSectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const sections = this.el.nativeElement.querySelectorAll('[data-stage-section]');
    if (!sections.length) return;

    this.stageSectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rawStage = entry.target.getAttribute('data-stage-section');
            const parsed = rawStage !== null ? parseInt(rawStage, 10) : 0;
            if (!isNaN(parsed) && parsed !== this.activeStage) {
              this.activeStage = parsed;
            }
          }
        }
      },
      {
        root: null,
        threshold: 0.28,
        rootMargin: '-12% 0px -22% 0px'
      }
    );

    sections.forEach((sec: Element) => this.stageSectionObserver?.observe(sec));
  }



  /**
   * Moteur d'animation Canvas 60 FPS multi-scènes plein écran (inspiré des pins #886505507929441534,
   * #1028650371200135305 et #973762750662318302) qui morph en temps réel selon la section active (0..4).
   */
  private initMultiStageMotionCanvas(): void {
    if (typeof window === 'undefined' || !this.stageCanvasRef) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = this.stageCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    this.resizeStageListener = () => window.removeEventListener('resize', resize);

    interface StageNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      phase: number;
      hueShift: number;
    }

    const nodeCount = width < 768 ? 34 : 64;
    const nodes: StageNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: 1.4 + (i % 3) * 0.85,
      phase: Math.random() * Math.PI * 2,
      hueShift: (i % 4) * 18
    }));

    // Palette RGB par section (0: Émeraude/Cyan Collab, 1: Cyan/Indigo Piliers, 2: Émeraude/Or Projets, 3: Violet/Émeraude Communautés, 4: Émeraude/Azur Launch)
    const palettes = [
      { r: 16, g: 185, b: 129, r2: 6, g2: 182, b2: 212 },
      { r: 6, g: 182, b: 212, r2: 59, g2: 130, b2: 246 },
      { r: 16, g: 185, b: 129, r2: 245, g2: 158, b2: 11 },
      { r: 139, g: 92, b: 246, r2: 16, g2: 185, b2: 129 },
      { r: 16, g: 185, b: 129, r2: 56, g2: 189, b2: 248 }
    ];

    let curColor = { ...palettes[0] };

    const animate = (now: number) => {
      const t = now * 0.001;
      const stageIdx = Math.max(0, Math.min(4, this.activeStage));
      const targetPal = palettes[stageIdx];
      const isLight = document.body.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';
      const alphaScale = isLight ? 0.52 : 1.0;

      // Interpolation douce des couleurs entre sections
      const lerp = 0.045;
      curColor.r += (targetPal.r - curColor.r) * lerp;
      curColor.g += (targetPal.g - curColor.g) * lerp;
      curColor.b += (targetPal.b - curColor.b) * lerp;
      curColor.r2 += (targetPal.r2 - curColor.r2) * lerp;
      curColor.g2 += (targetPal.g2 - curColor.g2) * lerp;
      curColor.b2 += (targetPal.b2 - curColor.b2) * lerp;

      const c1 = `${Math.round(curColor.r)}, ${Math.round(curColor.g)}, ${Math.round(curColor.b)}`;
      const c2 = `${Math.round(curColor.r2)}, ${Math.round(curColor.g2)}, ${Math.round(curColor.b2)}`;

      ctx.clearRect(0, 0, width, height);

      // 1. Ondes Sinusoïdales 3D Fluides (Style Pinterest #886505507929441534)
      const waveCount = 4;
      const scrollOffset = (window.scrollY || 0) * 0.0018;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseY = height * (0.28 + w * 0.16);
        const amp = (28 + w * 12) * (stageIdx === 1 || stageIdx === 2 ? 1.35 : 1.0);
        const freq = 0.0024 + w * 0.00045;
        const speed = t * (0.9 + w * 0.22) + scrollOffset;

        for (let x = 0; x <= width; x += 24) {
          const y =
            baseY +
            Math.sin(x * freq + speed + w) * amp +
            Math.cos(x * freq * 0.55 - speed * 0.7) * (amp * 0.45);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        const waveAlpha = (0.14 - w * 0.022) * alphaScale;
        ctx.strokeStyle = w % 2 === 0 ? `rgba(${c1}, ${waveAlpha})` : `rgba(${c2}, ${waveAlpha})`;
        ctx.lineWidth = w === 0 ? 1.8 : 1.2;
        ctx.stroke();
      }

      // 2. Nœuds de Collaboration & Constellation Panafricaine Interactive
      const maxLinkDist = width < 768 ? 115 : 155;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // Vitesse et comportement modulés selon la section active
        const stageSpeedMult = stageIdx === 4 ? 1.65 : stageIdx === 2 ? 1.25 : 1.0;
        n.x += n.vx * stageSpeedMult;
        n.y += n.vy * stageSpeedMult - (stageIdx === 2 ? 0.25 : 0);

        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;

        const pulse = 0.65 + 0.35 * Math.sin(t * 2.2 + n.phase);

        // Dessiner le nœud lumineux
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (0.85 + pulse * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? `rgba(${c1}, ${0.52 * pulse * alphaScale})` : `rgba(${c2}, ${0.48 * pulse * alphaScale})`;
        ctx.fill();

        // Relier les nœuds proches (réseau de développeurs en collaboration)
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxLinkDist * maxLinkDist) {
            const dist = Math.sqrt(distSq);
            const linkAlpha = (1 - dist / maxLinkDist) * 0.16 * alphaScale;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(${c1}, ${linkAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      this.stageAnimId = requestAnimationFrame(animate);
    };

    this.stageAnimId = requestAnimationFrame(animate);
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
    this.projectService.getProjects(0, 12, undefined, 'MOST_VIEWED').subscribe({
      next: (res) => {
        this.isLoadingProjects = false;
        if (res.success && res.data) {
          const list: Project[] = [...(res.data.content || res.data || [])];
          // Tri strict côté client : les projets les plus vus (viewsCount) puis reconnaissances (recognitionsCount)
          list.sort((a, b) => {
            const viewsDiff = (b.viewsCount || 0) - (a.viewsCount || 0);
            if (viewsDiff !== 0) return viewsDiff;
            return (b.recognitionsCount || 0) - (a.recognitionsCount || 0);
          });
          this.featuredProjects = list.slice(0, 3);
        }
      },
      error: () => (this.isLoadingProjects = false)
    });
  }

  getMediaUrl(url: string | undefined | null): string {
    return resolveUploadedMediaUrl(url);
  }

  private readonly defaultProjectCovers = [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80'
  ];

  getProjectCoverUrl(proj: Project, idx: number): string {
    if (this.brokenCoverIds.has(proj.id)) {
      return this.defaultProjectCovers[idx % this.defaultProjectCovers.length];
    }
    if (proj.screenshots && proj.screenshots.length > 0 && proj.screenshots[0]) {
      return resolveUploadedMediaUrl(proj.screenshots[0]);
    }
    return this.defaultProjectCovers[idx % this.defaultProjectCovers.length];
  }

  onProjectCoverError(event: Event, proj: Project): void {
    this.brokenCoverIds.add(proj.id);
    const imgEl = event.target as HTMLImageElement;
    if (imgEl) {
      imgEl.src = this.defaultProjectCovers[0];
    }
  }

  getProjectViewsDisplay(proj: Project, idx: number): number {
    if (proj.viewsCount && proj.viewsCount > 0) {
      return proj.viewsCount;
    }
    // Estimation cohérente basée sur les reconnaissances si viewsCount est encore à 0
    return Math.max(120 - idx * 25, (proj.recognitionsCount || 1) * 38);
  }

  getProjectTypeLabel(proj: Project): string {
    switch (proj.projectType) {
      case 'SAAS':
        return 'SaaS';
      case 'FOR_SALE':
        return 'En Vente';
      case 'COLLABORATIVE':
        return 'Collaboratif';
      case 'ENTERPRISE':
        return 'Entreprise';
      case 'PORTFOLIO':
        return 'Portfolio';
      default:
        return proj.isOpenSource ? 'Open Source' : 'Projet Tech';
    }
  }

  loadFeaturedMembers(): void {
    this.setDefaultTopMembers();
    this.isLoadingMembers = true;
    this.leaderboardService.getLeaderboard().subscribe({
      next: (res) => {
        this.isLoadingMembers = false;
        if (res.success && res.data) {
          const list = res.data.top5 || res.data.publicTop10 || [];
          if (list.length > 0) {
            this.featuredMembers = list.slice(0, 3);
          }
        }
      },
      error: () => this.isLoadingMembers = false
    });
  }

  private setDefaultTopMembers(): void {
    if (this.featuredMembers.length === 0) {
      this.featuredMembers = [
        {
          rank: 1,
          profileId: '1',
          userId: '1',
          fullName: 'Hachimou Akram',
          title: 'Développeur Full-Stack',
          country: 'Comores',
          city: 'Moroni',
          xpPoints: 969,
          levelTitle: 'Senior',
          levelNumber: 2,
          levelBadge: 'Senior',
          isCurrentUser: false
        },
        {
          rank: 2,
          profileId: '2',
          userId: '2',
          fullName: 'Soilihi Abdou',
          title: 'Développeur Full-Stack',
          country: 'Sénégal',
          city: 'Dakar',
          xpPoints: 840,
          levelTitle: 'Senior',
          levelNumber: 2,
          levelBadge: 'Senior',
          isCurrentUser: false
        },
        {
          rank: 3,
          profileId: '3',
          userId: '3',
          fullName: 'Kwame Osei',
          title: 'Senior Backend & Cloud Engineer',
          country: 'Ghana',
          city: 'Accra',
          xpPoints: 720,
          levelTitle: 'Expert',
          levelNumber: 3,
          levelBadge: 'Expert',
          isCurrentUser: false
        }
      ];
    }
  }

  getFlagUrl(country?: string): string | null {
    return this.leaderboardService.getCountryFlagUrl(country);
  }

  getMemberInitials(name?: string): string {
    if (!name) return 'D';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
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

  loadPartnerCompanies(): void {
    this.isLoadingPartners = true;
    this.companyService.getCompanies(0, 10).subscribe({
      next: (res) => {
        this.isLoadingPartners = false;
        if (res && res.success && res.data && res.data.content) {
          this.partnerCompanies = res.data.content.slice(0, 10);
        } else if (res && res.data && Array.isArray(res.data)) {
          this.partnerCompanies = (res.data as any[]).slice(0, 10);
        }
      },
      error: () => {
        this.isLoadingPartners = false;
      }
    });
  }

  resolveMedia(url?: string): string {
    return resolveUploadedMediaUrl(url);
  }

  cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\?\?/g, 'é').replace(/S\?\?n\?\?gal/gi, 'Sénégal');
  }
}
