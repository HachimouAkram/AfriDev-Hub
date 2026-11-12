import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { NetworkService, UserNetwork } from '../../core/services/network.service';
import { CommunityGroupService, Group } from '../../core/services/community-group.service';
import { LeaderboardService, LeaderboardEntry } from '../../core/services/leaderboard.service';

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
  private el = inject(ElementRef);

  featuredProjects: Project[] = [];
  featuredMembers: LeaderboardEntry[] = [];
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

  @ViewChild('earthCanvas') private earthCanvasRef?: ElementRef<HTMLCanvasElement>;
  private scrollObserver?: IntersectionObserver;
  private scrollListener?: () => void;
  private glAnimId?: number;
  private glContext?: WebGLRenderingContext | null;
  private targetRotX = 0.22;
  private targetRotY = -0.32;
  private targetRotZ = -0.08;
  private currentRotX = 0.22;
  private currentRotY = -0.32;
  private currentRotZ = -0.08;

  ngOnInit(): void {
    this.loadFeaturedProjects();
    this.loadFeaturedMembers();
    this.loadFeaturedCommunities();
    this.animateCounters();
    this.startFlagRotation();
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initRealEarthWebGL();
  }

  ngOnDestroy(): void {
    if (this.glAnimId) {
      cancelAnimationFrame(this.glAnimId);
    }
    if (this.scrollListener) {
      this.scrollListener();
    }
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    if (this.flagRotationInterval) {
      clearInterval(this.flagRotationInterval);
    }
    this.flagSwapTimeouts.forEach((t) => clearTimeout(t));
    this.flagSwapTimeouts = [];
  }

  /**
   * Initialise un VRAI globe terrestre 3D en WebGL ultra-performant.
   * Il tourne de façon fluide avec le défilement (scroll) de l'utilisateur
   * et projette la véritable carte de la Terre avec l'Afrique au centre et un halo atmosphérique émeraude.
   */
  private initRealEarthWebGL(): void {
    if (typeof window === 'undefined' || !this.earthCanvasRef) return;
    const canvas = this.earthCanvasRef.nativeElement;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;
    this.glContext = gl;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 520;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_res;
      uniform vec3 u_rot;
      uniform sampler2D u_tex;

      void main() {
        vec2 p = (gl_FragCoord.xy - u_res * 0.5) / (min(u_res.x, u_res.y) * 0.5);
        float r = length(p);
        float sphereR = 0.86;

        // Halo d'atmosphère externe doux
        if (r > sphereR) {
          float dist = r - sphereR;
          float glow = exp(-dist * 13.0) * 0.55;
          gl_FragColor = vec4(vec3(0.06, 0.73, 0.51) * glow, glow * 0.8);
          return;
        }

        // Normale sphérique 3D
        float z = sqrt(max(0.0, sphereR * sphereR - r * r));
        vec3 normal = vec3(p.x, -p.y, z) / sphereR;

        // 1. Rotation autour de X (Pitch / Inclinaison verticale)
        float cosX = cos(u_rot.x);
        float sinX = sin(u_rot.x);
        vec3 vX = vec3(
          normal.x,
          normal.y * cosX - normal.z * sinX,
          normal.y * sinX + normal.z * cosX
        );

        // 2. Rotation autour de Y (Yaw / Rotation Est-Ouest avec changement de sens)
        float cosY = cos(u_rot.y);
        float sinY = sin(u_rot.y);
        vec3 vY = vec3(
          vX.x * cosY + vX.z * sinY,
          vX.y,
          -vX.x * sinY + vX.z * cosY
        );

        // 3. Rotation autour de Z (Roll / Basculement axial latéral)
        float cosZ = cos(u_rot.z);
        float sinZ = sin(u_rot.z);
        vec3 rotNormal = vec3(
          vY.x * cosZ - vY.y * sinZ,
          vY.x * sinZ + vY.y * cosZ,
          vY.z
        );

        // Projection équirectangulaire de la vraie texture terrestre
        float lon = atan(rotNormal.x, -rotNormal.z);
        float lat = asin(clamp(rotNormal.y, -1.0, 1.0));
        vec2 uv = vec2((lon + 3.14159265) / (2.0 * 3.14159265), (lat + 1.57079632) / 3.14159265);

        vec4 texColor = texture2D(u_tex, vec2(uv.x, 1.0 - uv.y));

        // Éclairage directionnel 3D (Soleil venant du haut-gauche)
        vec3 lightDir = normalize(vec3(0.65, 0.45, 0.85));
        float diff = max(dot(normal, lightDir), 0.0);
        float ambient = 0.42;
        float light = diff * 0.58 + ambient;

        vec3 dayColor = texColor.rgb * light;
        vec3 nightColor = texColor.rgb * 0.40 + vec3(0.02, 0.09, 0.06);
        vec3 surface = mix(nightColor, dayColor, clamp(diff * 1.9, 0.0, 1.0));

        // Effet de halo d'atmosphère rasante (Rayleigh / Fresnel émeraude)
        float fresnel = pow(1.0 - normal.z, 2.5);
        vec3 atmoRim = vec3(0.12, 0.85, 0.58) * fresnel * 0.75;

        gl_FragColor = vec4(surface + atmoRim, 0.96);
      }
    `;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uRot = gl.getUniformLocation(program, 'u_rot');

    gl.uniform2f(uRes, canvas.width, canvas.height);

    // Initialisation d'une texture temporaire émeraude
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([16, 185, 129, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Chargement de la vraie texture photographique de la Terre
    const img = new Image();
    img.src = '/earth-texture.jpg';
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };

    // Synchronisation en direct avec le défilement (Scroll) :
    // Vitesse ralentie et changement dynamique d'orientation et de direction
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;

      // 1. Rotation horizontale ralentie et multi-directionnelle :
      // Au fil du défilement, la rotation ondoie et inverse doucement son orientation
      this.targetRotY = -0.32 + Math.sin(scrollY * 0.00065) * 1.25 + scrollY * 0.00015;

      // 2. Changement dynamique d'inclinaison verticale (Pitch haut/bas) :
      this.targetRotX = 0.22 + Math.sin(scrollY * 0.00095) * 0.26;

      // 3. Basculement latéral subtil (Roll 3D) :
      this.targetRotZ = -0.08 + Math.cos(scrollY * 0.0008) * 0.12;

      const hostEl = this.el.nativeElement as HTMLElement;
      if (hostEl) {
        hostEl.style.setProperty('--scroll-y-pos', `${scrollY}px`);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.scrollListener = () => window.removeEventListener('scroll', onScroll);
    onScroll();

    // Boucle de rendu WebGL à 60/120fps (accélération matérielle GPU)
    let lastTime = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Respiration subtile en repos (très lente)
      const idleBreathing = Math.sin(now * 0.00035) * 0.03;

      // Interpolation amortie ultra-douce
      const lerpSpeed = 0.055;
      this.currentRotX += (this.targetRotX - this.currentRotX) * lerpSpeed;
      this.currentRotY += ((this.targetRotY + idleBreathing) - this.currentRotY) * lerpSpeed;
      this.currentRotZ += (this.targetRotZ - this.currentRotZ) * lerpSpeed;

      gl.uniform3f(uRot, this.currentRotX, this.currentRotY, this.currentRotZ);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      this.glAnimId = requestAnimationFrame(render);
    };

    this.glAnimId = requestAnimationFrame(render);
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

  cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\?\?/g, 'é').replace(/S\?\?n\?\?gal/gi, 'Sénégal');
  }
}
