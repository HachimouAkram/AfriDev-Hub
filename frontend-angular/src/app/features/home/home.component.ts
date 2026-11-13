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

  @ViewChild('stageCanvas', { static: false }) private stageCanvasRef?: ElementRef<HTMLCanvasElement>;
  private scrollObserver?: IntersectionObserver;
  private stageSectionObserver?: IntersectionObserver;
  private canvasCleanupFn?: () => void;
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
    this.initCyberPlexusAnimation();
  }

  ngOnDestroy(): void {
    if (this.stageAnimId) {
      cancelAnimationFrame(this.stageAnimId);
    }
    if (this.canvasCleanupFn) {
      this.canvasCleanupFn();
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
   * Moteur d'animation Canvas 60 FPS 3D Cyber Plexus & Réseau Panafricain de Collaborateurs.
   * Reproduction et enrichissement du rendu Pinterest "Networking: It's About Giving" :
   * - Constellation de profils développeurs en 3D avec avatars silhouettes humaines lumineuses
   * - Hubs de talents panafricains identifiés (pays, rôles Tech : Lead Dev, Full-Stack, IA, DevOps, etc.)
   * - Ondes sonar / pings de connexion en direct sur les nœuds communautaires
   * - Signaux de collaboration en temps réel (photons/paquets de code voyageant le long des liaisons)
   * - Maillage géométrique et triangulation cristalline 3D
   * - Cristaux polyèdres (octaèdres sombres à arêtes néon) en rotation continue
   * - Colonne de flux d'énergie ascensionnel
   * - Réactivité au scroll ultra-fluide et tranquille avec inertie amortie
   * - Adaptabilité parfaite aux modes sombre et clair
   */
  private initCyberPlexusAnimation(): void {
    if (typeof window === 'undefined' || !this.stageCanvasRef) return;
    const canvas = this.stageCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    this.ngZone.runOutsideAngular(() => {
      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });

      interface Node3D {
        x: number;
        y: number;
        z: number;
        vx: number;
        vy: number;
        vz: number;
        r: number;
        colorIdx: number;
        phase: number;
        isHub: boolean;
        badgeText?: string;
        pingPhase: number;
      }

      interface Star3D {
        x: number;
        y: number;
        z: number;
        r: number;
        phase: number;
        speed: number;
      }

      interface Polyhedron3D {
        x: number;
        y: number;
        z: number;
        size: number;
        rotX: number;
        rotY: number;
        rotZ: number;
        vRotX: number;
        vRotY: number;
        vRotZ: number;
        vz: number;
      }

      interface EnergyBeamParticle {
        x: number;
        y: number;
        z: number;
        vy: number;
        len: number;
        width: number;
        alpha: number;
      }

      interface CollabSignal {
        fromIdx: number;
        toIdx: number;
        progress: number;
        speed: number;
        colorIdx: number;
      }

      const isMobile = width < 768;
      const nodeCount = isMobile ? 42 : 78;
      const starCount = isMobile ? 45 : 90;
      const polyCount = isMobile ? 3 : 5;
      const beamParticleCount = isMobile ? 12 : 22;
      const signalCount = isMobile ? 12 : 26;

      const focalLength = 500;
      const boundsX = width * 0.95;
      const boundsY = height * 0.95;
      const minZ = 40;
      const maxZ = 1050;

      const HUB_BADGES = [
        '🇸🇳 Sénégal',
        '🇰🇪 Kenya',
        '🇳🇬 Nigeria',
        '🇰🇲 Comores',
        '🇨🇮 Côte d\'Ivoire',
        '🇲🇦 Maroc',
        '🇷🇼 Rwanda',
        '🇨🇲 Cameroun',
        '🇩🇿 Algérie',
        'Lead Dev',
        'Full-Stack',
        'DevOps',
        'IA & Data',
        'Mobile'
      ];

      // 1. Initialisation des Nœuds Collaborateurs
      const nodes: Node3D[] = [];
      for (let i = 0; i < nodeCount; i++) {
        const isHub = i < HUB_BADGES.length;
        nodes.push({
          x: (Math.random() - 0.5) * boundsX * 2,
          y: (Math.random() - 0.5) * boundsY * 2,
          z: minZ + Math.random() * (maxZ - minZ),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          vz: (Math.random() - 0.5) * 0.2,
          r: isHub ? 3.8 + Math.random() * 1.6 : 2.4 + Math.random() * 2.0,
          colorIdx: i % 3,
          phase: Math.random() * Math.PI * 2,
          isHub,
          badgeText: isHub ? HUB_BADGES[i] : undefined,
          pingPhase: Math.random()
        });
      }

      // 2. Micro-étoiles
      const stars: Star3D[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2.2,
          y: (Math.random() - 0.5) * height * 2.2,
          z: 100 + Math.random() * 1400,
          r: 0.8 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          speed: 1.2 + Math.random() * 2.4
        });
      }

      // 3. Octaèdres Crystalline 3D
      const octaUnitVertices = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
      ];
      const octaFaces = [
        [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
        [0, 5, 2], [2, 5, 1], [1, 5, 3], [3, 5, 0]
      ];

      const polyhedra: Polyhedron3D[] = [];
      for (let i = 0; i < polyCount; i++) {
        polyhedra.push({
          x: (Math.random() - 0.5) * boundsX * 1.5,
          y: (Math.random() - 0.5) * boundsY * 1.5,
          z: 180 + Math.random() * 700,
          size: 26 + Math.random() * 20,
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          rotZ: Math.random() * Math.PI,
          vRotX: (Math.random() - 0.5) * 0.01,
          vRotY: (Math.random() - 0.5) * 0.012,
          vRotZ: (Math.random() - 0.5) * 0.008,
          vz: -0.2 - Math.random() * 0.25
        });
      }

      // 4. Colonne de flux ascensionnel
      const beamParticles: EnergyBeamParticle[] = [];
      for (let i = 0; i < beamParticleCount; i++) {
        beamParticles.push({
          x: (Math.random() - 0.5) * (width * 0.35),
          y: Math.random() * height,
          z: 80 + Math.random() * 500,
          vy: - (2.4 + Math.random() * 3.2),
          len: 24 + Math.random() * 42,
          width: 1.2 + Math.random() * 1.6,
          alpha: 0.35 + Math.random() * 0.45
        });
      }

      // 5. Signaux de Collaboration Réseau (paquets de données voyageant entre développeurs)
      const collabSignals: CollabSignal[] = [];
      for (let s = 0; s < signalCount; s++) {
        const fromIdx = Math.floor(Math.random() * nodeCount);
        let toIdx = (fromIdx + 1 + Math.floor(Math.random() * 6)) % nodeCount;
        collabSignals.push({
          fromIdx,
          toIdx,
          progress: Math.random(),
          speed: 0.006 + Math.random() * 0.012,
          colorIdx: s % 3
        });
      }

      let lastScrollY = window.scrollY || window.pageYOffset || 0;
      let scrollVelocity = 0;
      let targetVelocity = 0;
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const onScroll = () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        const delta = currentY - lastScrollY;
        lastScrollY = currentY;
        targetVelocity += delta * 0.48;
        targetVelocity = Math.max(-40, Math.min(40, targetVelocity));
      };

      const onMouseMove = (e: MouseEvent) => {
        targetMouseX = (e.clientX / width - 0.5) * 2;
        targetMouseY = (e.clientY / height - 0.5) * 2;
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('mousemove', onMouseMove, { passive: true });

      const animate = (now: number) => {
        const t = now * 0.001;

        // Amorti d'inertie physique doux pour le scroll
        scrollVelocity += (targetVelocity - scrollVelocity) * 0.1;
        targetVelocity *= 0.89;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        const absVel = Math.abs(scrollVelocity);
        const velocityRatio = Math.min(absVel / 24, 1);
        const zStep = (0.5 + scrollVelocity * 0.32);

        const isLight = document.body.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';
        const themeAlpha = isLight ? 0.65 : 1.0;

        ctx.clearRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.5;

        // A. Nébuleuses d'Arrière-Plan
        const neb1X = cx * (1 + Math.sin(t * 0.28) * 0.25) + mouseX * 22;
        const neb1Y = cy * (0.8 + Math.cos(t * 0.22) * 0.2);
        const nebGrad1 = ctx.createRadialGradient(neb1X, neb1Y, 10, neb1X, neb1Y, width * 0.46);
        if (isLight) {
          nebGrad1.addColorStop(0, 'rgba(16, 185, 129, 0.09)');
          nebGrad1.addColorStop(0.6, 'rgba(6, 182, 212, 0.04)');
          nebGrad1.addColorStop(1, 'rgba(248, 250, 252, 0)');
        } else {
          nebGrad1.addColorStop(0, `rgba(16, 185, 129, ${(0.14 + velocityRatio * 0.07).toFixed(3)})`);
          nebGrad1.addColorStop(0.55, `rgba(6, 182, 212, ${(0.09 + velocityRatio * 0.05).toFixed(3)})`);
          nebGrad1.addColorStop(1, 'rgba(3, 7, 18, 0)');
        }
        ctx.fillStyle = nebGrad1;
        ctx.fillRect(0, 0, width, height);

        const neb2X = cx * (0.8 - Math.sin(t * 0.32) * 0.22);
        const neb2Y = cy * (1.2 + Math.sin(t * 0.18) * 0.18);
        const nebGrad2 = ctx.createRadialGradient(neb2X, neb2Y, 15, neb2X, neb2Y, width * 0.39);
        if (isLight) {
          nebGrad2.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
          nebGrad2.addColorStop(1, 'rgba(248, 250, 252, 0)');
        } else {
          nebGrad2.addColorStop(0, `rgba(59, 130, 246, ${(0.11 + velocityRatio * 0.05).toFixed(3)})`);
          nebGrad2.addColorStop(0.6, 'rgba(16, 185, 129, 0.04)');
          nebGrad2.addColorStop(1, 'rgba(3, 7, 18, 0)');
        }
        ctx.fillStyle = nebGrad2;
        ctx.fillRect(0, 0, width, height);

        // B. Micro-Étoiles
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.z -= zStep * 0.6;
          if (s.z < 60) s.z = 1400;
          if (s.z > 1450) s.z = 80;

          const scale = focalLength / (focalLength + s.z);
          const px = cx + s.x * scale + mouseX * 12 * scale;
          const py = cy + s.y * scale + mouseY * 12 * scale;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const twinkle = 0.35 + 0.65 * Math.sin(t * s.speed + s.phase);
            const starAlpha = (1 - s.z / 1450) * twinkle * (isLight ? 0.38 : 0.72);
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.6, s.r * scale * 1.4), 0, Math.PI * 2);
            ctx.fillStyle = isLight ? `rgba(16, 185, 129, ${starAlpha})` : `rgba(255, 255, 255, ${starAlpha})`;
            ctx.fill();
          }
        }

        // C. Colonne de Flux Ascensionnel
        const beamSpeedMult = 1.0 + velocityRatio * 2.6;
        for (let i = 0; i < beamParticles.length; i++) {
          const bp = beamParticles[i];
          bp.y += bp.vy * beamSpeedMult;
          if (bp.y < -50) {
            bp.y = height + 40;
            bp.x = (Math.random() - 0.5) * (width * 0.42);
            bp.z = 80 + Math.random() * 500;
          }

          const scale = focalLength / (focalLength + bp.z);
          const bx = cx + (bp.x + Math.sin(t * 1.5 + i) * 18) * scale + mouseX * 18 * scale;
          const by = bp.y;
          const blen = bp.len * scale * (1 + velocityRatio * 0.65);

          const grad = ctx.createLinearGradient(bx, by, bx, by + blen);
          const coreAlpha = bp.alpha * (0.7 + velocityRatio * 0.5) * (isLight ? 0.5 : 0.95);
          if (isLight) {
            grad.addColorStop(0, `rgba(16, 185, 129, ${coreAlpha})`);
            grad.addColorStop(0.5, `rgba(6, 182, 212, ${coreAlpha * 0.6})`);
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
            grad.addColorStop(0.3, `rgba(0, 245, 212, ${coreAlpha * 0.85})`);
            grad.addColorStop(0.7, `rgba(0, 229, 153, ${coreAlpha * 0.4})`);
            grad.addColorStop(1, 'rgba(0, 229, 153, 0)');
          }
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by + blen);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.8, bp.width * scale * (1 + velocityRatio * 0.4));
          ctx.stroke();
        }

        // D. Cristaux Polyèdres 3D Flottants (Octaèdres)
        const rotTiltY = mouseX * 0.22 + scrollVelocity * 0.014;
        const rotTiltX = mouseY * 0.22;

        for (let pIdx = 0; pIdx < polyhedra.length; pIdx++) {
          const poly = polyhedra[pIdx];
          poly.z += poly.vz - zStep * 0.8;
          if (poly.z < 80) poly.z = 850;
          if (poly.z > 950) poly.z = 100;

          poly.rotX += poly.vRotX * (1 + velocityRatio * 2.2);
          poly.rotY += poly.vRotY * (1 + velocityRatio * 2.2);
          poly.rotZ += poly.vRotZ * (1 + velocityRatio * 2.2);

          const transformedVertices: { x: number; y: number; z: number; px: number; py: number }[] = [];
          const cosX = Math.cos(poly.rotX);
          const sinX = Math.sin(poly.rotX);
          const cosY = Math.cos(poly.rotY + rotTiltY);
          const sinY = Math.sin(poly.rotY + rotTiltY);
          const cosZ = Math.cos(poly.rotZ);
          const sinZ = Math.sin(poly.rotZ);

          for (let v = 0; v < octaUnitVertices.length; v++) {
            const vUnit = octaUnitVertices[v];
            let vx = vUnit.x * poly.size;
            let vy = vUnit.y * poly.size;
            let vz = vUnit.z * poly.size;

            const x1 = vx * cosY - vz * sinY;
            const z1 = vx * sinY + vz * cosY;
            const y2 = vy * cosX - z1 * sinX;
            const z2 = vy * sinX + z1 * cosX;
            const x3 = x1 * cosZ - y2 * sinZ;
            const y3 = x1 * sinZ + y2 * cosZ;

            const finalX = poly.x + x3;
            const finalY = poly.y + y3;
            const finalZ = poly.z + z2;

            const scale = focalLength / (focalLength + finalZ);
            const px = cx + finalX * scale + mouseX * 20 * scale;
            const py = cy + finalY * scale + mouseY * 20 * scale;

            transformedVertices.push({ x: finalX, y: finalY, z: finalZ, px, py });
          }

          const polyAlpha = Math.min(Math.max(1 - poly.z / 950, 0), 1) * themeAlpha;
          for (let f = 0; f < octaFaces.length; f++) {
            const [i1, i2, i3] = octaFaces[f];
            const v1 = transformedVertices[i1];
            const v2 = transformedVertices[i2];
            const v3 = transformedVertices[i3];

            const area = (v2.px - v1.px) * (v3.py - v1.py) - (v2.py - v1.py) * (v3.px - v1.px);
            if (area > 0) {
              ctx.beginPath();
              ctx.moveTo(v1.px, v1.py);
              ctx.lineTo(v2.px, v2.py);
              ctx.lineTo(v3.px, v3.py);
              ctx.closePath();

              ctx.fillStyle = isLight
                ? `rgba(16, 185, 129, ${(0.05 * polyAlpha).toFixed(3)})`
                : `rgba(2, 22, 30, ${(0.46 * polyAlpha).toFixed(3)})`;
              ctx.fill();

              ctx.strokeStyle = isLight
                ? `rgba(16, 185, 129, ${(0.42 * polyAlpha).toFixed(3)})`
                : `rgba(0, 245, 212, ${(0.52 * polyAlpha).toFixed(3)})`;
              ctx.lineWidth = 1.0;
              ctx.stroke();
            }
          }

          for (let v = 0; v < transformedVertices.length; v++) {
            const tv = transformedVertices[v];
            ctx.beginPath();
            ctx.arc(tv.px, tv.py, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? '#10b981' : '#00f5d4';
            ctx.fill();
          }
        }

        // E. Projection des Nœuds Développeurs & Collaborateurs
        const projectedNodes: { px: number; py: number; scale: number; node: Node3D; alpha: number }[] = [];

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.z -= zStep;
          n.x += n.vx;
          n.y += n.vy;

          if (n.z < minZ) {
            n.z = maxZ - 10;
            n.x = (Math.random() - 0.5) * boundsX * 2;
            n.y = (Math.random() - 0.5) * boundsY * 2;
          } else if (n.z > maxZ) {
            n.z = minZ + 10;
          }

          const scale = focalLength / (focalLength + n.z);
          const xRot = n.x * Math.cos(rotTiltY) - n.z * Math.sin(rotTiltY) * 0.15;
          const yRot = n.y * Math.cos(rotTiltX);

          const px = cx + xRot * scale + mouseX * 28 * scale;
          const py = cy + yRot * scale + mouseY * 28 * scale;

          const depthAlpha = (1 - (n.z - minZ) / (maxZ - minZ));
          const pulse = 0.75 + 0.25 * Math.sin(t * 1.9 + n.phase);
          const nodeAlpha = Math.max(0.12, depthAlpha * pulse * themeAlpha);

          projectedNodes.push({ px, py, scale, node: n, alpha: nodeAlpha });
        }

        // F. Maillage Géométrique de Réseau & Triangles Cristallins
        const maxDist2D = isMobile ? 125 : 170;
        const maxDist2DSq = maxDist2D * maxDist2D;
        const colorStops = isLight
          ? ['rgba(16, 185, 129, ', 'rgba(6, 182, 212, ', 'rgba(56, 189, 248, ']
          : ['rgba(0, 229, 153, ', 'rgba(0, 245, 212, ', 'rgba(56, 189, 248, '];

        // Stocker les connexions valides pour les signaux de données
        const activeLinks: { p1: typeof projectedNodes[0]; p2: typeof projectedNodes[0] }[] = [];

        for (let i = 0; i < projectedNodes.length; i++) {
          const p1 = projectedNodes[i];
          if (p1.px < -60 || p1.px > width + 60 || p1.py < -60 || p1.py > height + 60) continue;

          for (let j = i + 1; j < projectedNodes.length; j++) {
            const p2 = projectedNodes[j];
            const dx = p1.px - p2.px;
            const dy = p1.py - p2.py;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDist2DSq) {
              const dist = Math.sqrt(distSq);
              const linkAlpha = (1 - dist / maxDist2D) * 0.32 * Math.min(p1.alpha, p2.alpha) * (1 + velocityRatio * 0.5);

              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.strokeStyle = `${colorStops[p1.node.colorIdx]}${linkAlpha.toFixed(3)})`;
              ctx.lineWidth = Math.max(0.65, 1.25 * ((p1.scale + p2.scale) * 0.5));
              ctx.stroke();

              activeLinks.push({ p1, p2 });

              // Triangulation Shimmering
              if (j < i + 16) {
                for (let k = j + 1; k < Math.min(projectedNodes.length, j + 7); k++) {
                  const p3 = projectedNodes[k];
                  const dx2 = p1.px - p3.px;
                  const dy2 = p1.py - p3.py;
                  const dx3 = p2.px - p3.px;
                  const dy3 = p2.py - p3.py;
                  if (dx2 * dx2 + dy2 * dy2 < maxDist2DSq * 0.65 && dx3 * dx3 + dy3 * dy3 < maxDist2DSq * 0.65) {
                    ctx.beginPath();
                    ctx.moveTo(p1.px, p1.py);
                    ctx.lineTo(p2.px, p2.py);
                    ctx.lineTo(p3.px, p3.py);
                    ctx.closePath();
                    ctx.fillStyle = isLight
                      ? `rgba(16, 185, 129, ${(0.024 * linkAlpha).toFixed(4)})`
                      : `rgba(0, 245, 212, ${(0.042 * linkAlpha).toFixed(4)})`;
                    ctx.fill();
                    break;
                  }
                }
              }
            }
          }
        }

        // G. Signaux de Collaboration Réseau (Data Pulses en Transit)
        if (activeLinks.length > 0) {
          const pulseSpeedMult = 1.0 + velocityRatio * 2.2;
          for (let s = 0; s < collabSignals.length; s++) {
            const sig = collabSignals[s];
            const link = activeLinks[s % activeLinks.length];
            sig.progress += sig.speed * pulseSpeedMult;
            if (sig.progress >= 1) {
              sig.progress = 0;
            }

            const p1 = link.p1;
            const p2 = link.p2;
            const px = p1.px + (p2.px - p1.px) * sig.progress;
            const py = p1.py + (p2.py - p1.py) * sig.progress;
            const pulseScale = (p1.scale + p2.scale) * 0.5;
            const pulseR = Math.max(1.8, 3.2 * pulseScale);

            // Traînée du paquet de données
            const tailLen = 0.12;
            const tailX = p1.px + (p2.px - p1.px) * Math.max(0, sig.progress - tailLen);
            const tailY = p1.py + (p2.py - p1.py) * Math.max(0, sig.progress - tailLen);
            const sigGrad = ctx.createLinearGradient(tailX, tailY, px, py);
            sigGrad.addColorStop(0, `${colorStops[sig.colorIdx]}0)`);
            sigGrad.addColorStop(1, `${colorStops[sig.colorIdx]}0.85)`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(px, py);
            ctx.strokeStyle = sigGrad;
            ctx.lineWidth = Math.max(1.2, 2.2 * pulseScale);
            ctx.stroke();

            // Tête lumineuse du signal
            ctx.beginPath();
            ctx.arc(px, py, pulseR, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? '#047857' : '#ffffff';
            ctx.fill();
          }
        }

        // H. Dessin des Nœuds Collaborateurs (Avatars Silhouettes & Badges Panafricains)
        for (let i = 0; i < projectedNodes.length; i++) {
          const p = projectedNodes[i];
          const pr = Math.max(1.6, p.node.r * p.scale * (1 + velocityRatio * 0.18));
          const px = p.px;
          const py = p.py;
          const alpha = p.alpha;
          const colorStr = colorStops[p.node.colorIdx];

          // 1. Onde Sonar / Ping de Connexion (pour les Hubs de talent)
          if (p.node.isHub) {
            p.node.pingPhase = (p.node.pingPhase + 0.007) % 1;
            const pingR = pr * (1.1 + p.node.pingPhase * 3.6);
            const pingAlpha = (1 - p.node.pingPhase) * 0.45 * alpha * themeAlpha;
            ctx.beginPath();
            ctx.arc(px, py, pingR, 0, Math.PI * 2);
            ctx.strokeStyle = `${colorStr}${pingAlpha.toFixed(3)})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }

          // 2. Halo lumineux externe
          const haloR = pr * 3.2;
          const haloGrad = ctx.createRadialGradient(px, py, pr * 0.3, px, py, haloR);
          if (isLight) {
            haloGrad.addColorStop(0, `rgba(16, 185, 129, ${(0.55 * alpha).toFixed(3)})`);
            haloGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          } else {
            haloGrad.addColorStop(0, `${colorStr}${(0.72 * alpha).toFixed(3)})`);
            haloGrad.addColorStop(1, `${colorStr}0)`);
          }
          ctx.beginPath();
          ctx.arc(px, py, haloR, 0, Math.PI * 2);
          ctx.fillStyle = haloGrad;
          ctx.fill();

          // 3. Silhouette Humaine / Avatar Développeur (Inspiré du pin "Networking: It's About Giving")
          // Dessinée dès que le nœud est dans le plan intermédiaire ou en avant-plan
          if (pr >= 3.0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(px, py, pr * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = isLight
              ? `rgba(255, 255, 255, ${(0.92 * alpha).toFixed(3)})`
              : `rgba(6, 18, 30, ${(0.88 * alpha).toFixed(3)})`;
            ctx.fill();
            ctx.strokeStyle = `${colorStr}${(0.85 * alpha).toFixed(3)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Clip au disque de l'avatar pour arrondir la silhouette
            ctx.clip();

            const silhouetteColor = isLight ? '#047857' : '#ffffff';

            // Tête du profil (cercle)
            const headR = pr * 0.44;
            const headY = py - pr * 0.32;
            ctx.beginPath();
            ctx.arc(px, headY, headR, 0, Math.PI * 2);
            ctx.fillStyle = silhouetteColor;
            ctx.fill();

            // Épaules / Buste (arc de cercle doux)
            const bodyR = pr * 1.05;
            const bodyY = py + pr * 1.12;
            ctx.beginPath();
            ctx.arc(px, bodyY, bodyR, Math.PI, 0, false);
            ctx.fillStyle = silhouetteColor;
            ctx.fill();

            ctx.restore();

            // 4. Micro-Badge Panafricain ou Rôle Tech pour les Hubs
            if (p.node.isHub && p.node.badgeText && p.scale > 0.44 && pr >= 3.8) {
              ctx.save();
              ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              const text = p.node.badgeText;
              const textWidth = ctx.measureText(text).width;
              const badgeX = px + pr * 1.6;
              const badgeY = py - 7;
              const padX = 6;
              const bx = badgeX - padX;
              const by = badgeY - 9;
              const bw = textWidth + padX * 2;
              const bh = 15;

              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(bx, by, bw, bh, 4);
              } else {
                ctx.rect(bx, by, bw, bh);
              }
              ctx.fillStyle = isLight
                ? `rgba(255, 255, 255, ${(0.94 * alpha).toFixed(3)})`
                : `rgba(3, 10, 20, ${(0.86 * alpha).toFixed(3)})`;
              ctx.fill();
              ctx.strokeStyle = `${colorStr}${(0.75 * alpha).toFixed(3)})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();

              ctx.fillStyle = isLight ? '#065f46' : '#ecfdf5';
              ctx.fillText(text, badgeX, badgeY + 2);
              ctx.restore();
            }
          } else {
            // Nœud lointain : point étincelant net
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1.4, pr), 0, Math.PI * 2);
            ctx.fillStyle = isLight ? '#059669' : (p.node.colorIdx === 0 ? '#00e599' : (p.node.colorIdx === 1 ? '#00f5d4' : '#38bdf8'));
            ctx.fill();
          }
        }

        this.stageAnimId = requestAnimationFrame(animate);
      };

      this.stageAnimId = requestAnimationFrame(animate);

      this.canvasCleanupFn = () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('mousemove', onMouseMove);
      };
    });
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
