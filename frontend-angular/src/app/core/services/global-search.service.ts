import { Injectable, inject } from '@angular/core';
import { ProjectService, Project } from './project.service';
import { NetworkService, UserNetwork } from './network.service';
import { OpportunityService, Opportunity } from './opportunity.service';
import { TechEventService, TechEvent } from './tech-event.service';
import { CompanyService, Company } from './company.service';
import { Observable, combineLatest, map, of, catchError, shareReplay } from 'rxjs';

export interface SearchResultProject {
  id: string;
  title: string;
  category: string;
  authorName: string;
  country: string;
  stack: string[];
  price?: number;
  currency?: string;
  matchScore: number;
}

export interface SearchResultDeveloper {
  id: string;
  fullName: string;
  title: string;
  country: string;
  city: string;
  avatarUrl?: string;
  skills: string[];
  reputationScore: number;
}

export interface SearchResultOpportunity {
  id: string;
  title: string;
  type: string;
  location: string;
  stack: string[];
}

export interface SearchResultEvent {
  id: string;
  title: string;
  type: string;
  location: string;
  startDate: string;
  tags: string[];
}

export interface SearchResultCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  country?: string;
  city?: string;
  sector?: string;
  companyLevel?: string;
  verified?: boolean;
}

export interface GlobalSearchResults {
  query: string;
  suggestedCorrection?: string | null;
  projects: SearchResultProject[];
  developers: SearchResultDeveloper[];
  opportunities: SearchResultOpportunity[];
  events: SearchResultEvent[];
  companies: SearchResultCompany[];
  technologies: string[];
  totalMatches: number;
}

interface CachedSearchDataset {
  rawProjects: Project[];
  rawUsers: UserNetwork[];
  rawOpps: Opportunity[];
  rawEvents: TechEvent[];
  rawCompanies: Company[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private projectService = inject(ProjectService);
  private networkService = inject(NetworkService);
  private opportunityService = inject(OpportunityService);
  private techEventService = inject(TechEventService);
  private companyService = inject(CompanyService);

  private cachedData: CachedSearchDataset | null = null;
  private readonly CACHE_TTL_MS = 600000; // 10 minutes pour un cache ultra-performant
  private readonly STORAGE_KEY = 'afridev_search_cache_v2';
  private inFlightLoad$: Observable<CachedSearchDataset> | null = null;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < this.CACHE_TTL_MS)) {
          this.cachedData = parsed;
        }
      }
    } catch {
      // Ignore les erreurs de quota ou parsing
    }
  }

  private saveToStorage(data: CachedSearchDataset): void {
    if (typeof window === 'undefined') return;
    try {
      const json = JSON.stringify(data);
      sessionStorage.setItem(this.STORAGE_KEY, json);
    } catch {
      // Ignore les erreurs de quota
    }
  }

  hasCachedData(): boolean {
    return !!(this.cachedData && (Date.now() - this.cachedData.timestamp < this.CACHE_TTL_MS));
  }

  /**
   * Préchauffe en arrière-plan le jeu de données pour rendre la frappe 100% instantanée (0 ms).
   * Partage une seule requête en vol (in-flight request) pour ne jamais spammer le serveur.
   */
  prefetch(): Observable<boolean> {
    if (this.hasCachedData()) {
      return of(true);
    }
    return this.loadDataset().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private loadDataset(): Observable<CachedSearchDataset> {
    if (this.hasCachedData() && this.cachedData) {
      return of(this.cachedData);
    }
    if (this.inFlightLoad$) {
      return this.inFlightLoad$;
    }

    this.inFlightLoad$ = combineLatest([
      this.projectService.getProjects(0, 30).pipe(catchError(() => of({ data: { content: [] } }))),
      this.networkService.getNetworkUsers({ size: 30 }).pipe(catchError(() => of({ data: { content: [] } }))),
      this.opportunityService.getOpportunities(undefined, 0, 30).pipe(catchError(() => of({ data: { content: [] } }))),
      this.techEventService.getEvents(undefined, 0, 30).pipe(catchError(() => of({ data: { content: [] } }))),
      this.companyService.getCompanies(0, 30).pipe(catchError(() => of({ data: { content: [] } })))
    ]).pipe(
      map(([projectsRes, usersRes, oppsRes, eventsRes, companiesRes]) => {
        const rawProjects: Project[] = projectsRes?.data?.content || projectsRes?.data || [];
        const rawUsers: UserNetwork[] = usersRes?.data?.content || usersRes?.data || [];
        const rawOpps: Opportunity[] = oppsRes?.data?.content || oppsRes?.data || [];
        const rawEvents: TechEvent[] = eventsRes?.data?.content || eventsRes?.data || [];
        const rawCompanies: Company[] = companiesRes?.data?.content || companiesRes?.data || [];

        const dataset: CachedSearchDataset = {
          rawProjects,
          rawUsers,
          rawOpps,
          rawEvents,
          rawCompanies,
          timestamp: Date.now()
        };

        this.cachedData = dataset;
        this.saveToStorage(dataset);
        this.inFlightLoad$ = null;
        return dataset;
      }),
      catchError(err => {
        this.inFlightLoad$ = null;
        throw err;
      }),
      shareReplay(1)
    );

    return this.inFlightLoad$;
  }

  private emptyResult(query: string): GlobalSearchResults {
    return {
      query,
      suggestedCorrection: null,
      projects: [],
      developers: [],
      opportunities: [],
      events: [],
      companies: [],
      technologies: [],
      totalMatches: 0
    };
  }

  /**
   * Filtrage direct et synchrone en mémoire (temps d'exécution < 1ms, 0ms de réseau).
   */
  searchSync(rawQuery: string): GlobalSearchResults | null {
    if (!this.cachedData) return null;
    const trimmed = rawQuery ? rawQuery.trim() : '';
    if (!trimmed || trimmed.length < 1) {
      return this.emptyResult('');
    }

    const normQuery = this.normalizeText(trimmed);
    const terms = normQuery.split(/\s+/).filter(t => t.length > 0);

    return this.filterResults(
      rawQuery,
      trimmed,
      terms,
      this.cachedData.rawProjects,
      this.cachedData.rawUsers,
      this.cachedData.rawOpps,
      this.cachedData.rawEvents,
      this.cachedData.rawCompanies
    );
  }

  search(rawQuery: string): Observable<GlobalSearchResults> {
    const sync = this.searchSync(rawQuery);
    if (sync) {
      return of(sync);
    }

    const trimmed = rawQuery ? rawQuery.trim() : '';
    if (!trimmed || trimmed.length < 1) {
      return of(this.emptyResult(''));
    }

    return this.loadDataset().pipe(
      map(dataset => {
        const normQuery = this.normalizeText(trimmed);
        const terms = normQuery.split(/\s+/).filter(t => t.length > 0);
        return this.filterResults(
          rawQuery,
          trimmed,
          terms,
          dataset.rawProjects,
          dataset.rawUsers,
          dataset.rawOpps,
          dataset.rawEvents,
          dataset.rawCompanies
        );
      })
    );
  }

  private normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_']/g, ' ')
      .trim();
  }

  private compactText(text: string): string {
    return this.normalizeText(text).replace(/\s+/g, '');
  }

  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const temp = dp[j];
        if (a[i - 1] === b[j - 1]) {
          dp[j] = prev;
        } else {
          dp[j] = Math.min(prev, dp[j], dp[j - 1]) + 1;
        }
        prev = temp;
      }
    }
    return dp[b.length];
  }

  // Fuzzy matching tolérant aux accents, tirets manquants ("ecommerce" -> "e-commerce") et fautes ("ecomrce", "algerie", "reac")
  private matchesFuzzy(target: string | null | undefined, queryTerms: string[]): boolean {
    if (!target) return false;
    const normTarget = this.normalizeText(target);
    const compactTarget = this.compactText(target);
    const targetWords = normTarget.split(/\s+/).filter(Boolean);

    return queryTerms.some(term => {
      const compactTerm = term.replace(/\s+/g, '');
      if (normTarget.includes(term) || compactTarget.includes(compactTerm)) {
        return true;
      }

      if (compactTerm.length >= 4) {
        // Tolérance préfixe / troncature ("reac" -> "react", "hachim" -> "hachimou")
        if (compactTarget.includes(compactTerm.slice(0, -1))) {
          return true;
        }

        // Tolérance fautes de frappe par mot (Levenshtein)
        const maxDist = compactTerm.length >= 7 ? 2 : 1;
        if (compactTarget.length >= 4 && Math.abs(compactTarget.length - compactTerm.length) <= maxDist) {
          if (this.levenshtein(compactTarget, compactTerm) <= maxDist) {
            return true;
          }
        }

        for (const word of targetWords) {
          if (word.length >= 4 && Math.abs(word.length - compactTerm.length) <= maxDist) {
            if (this.levenshtein(word, compactTerm) <= maxDist) {
              return true;
            }
          }
        }

        // Pairwise check ("e" + "commerce" -> "ecommerce" vs "ecomrce")
        for (let i = 0; i < targetWords.length - 1; i++) {
          const joined = targetWords[i] + targetWords[i + 1];
          if (joined.length >= 5 && Math.abs(joined.length - compactTerm.length) <= 2) {
            if (this.levenshtein(joined, compactTerm) <= 2) {
              return true;
            }
          }
        }
      }

      return false;
    });
  }

  private filterResults(
    rawQuery: string,
    trimmed: string,
    terms: string[],
    rawProjects: Project[],
    rawUsers: UserNetwork[],
    rawOpps: Opportunity[],
    rawEvents: TechEvent[],
    rawCompanies: Company[]
  ): GlobalSearchResults {
    // 1. Filtrage Projets
    const matchingProjects: SearchResultProject[] = rawProjects
      .filter(p => {
        const inTitle = this.matchesFuzzy(p.title, terms);
        const inDesc = this.matchesFuzzy(p.description, terms);
        const inStack = (p.stack || []).some(s => this.matchesFuzzy(s, terms));
        const inAuthor = this.matchesFuzzy(p.author?.profile?.fullName || p.author?.email, terms);
        const inCountry = this.matchesFuzzy(p.author?.profile?.country, terms);
        const inType = this.matchesFuzzy(p.projectType, terms);
        const inCompany = this.matchesFuzzy(p.companyName, terms);
        return inTitle || inDesc || inStack || inAuthor || inCountry || inType || inCompany;
      })
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        category: p.projectType || 'Projet',
        authorName: p.author?.profile?.fullName || p.author?.email || 'Développeur',
        country: p.author?.profile?.country || '',
        stack: (p.stack || []).slice(0, 3),
        price: p.price,
        currency: p.currency,
        matchScore: p.matchPercentage || 80
      }));

    // 2. Filtrage Développeurs
    const matchingDevs: SearchResultDeveloper[] = rawUsers
      .filter(u => {
        const inName = this.matchesFuzzy(u.fullName || u.email, terms);
        const inTitle = this.matchesFuzzy(u.title, terms);
        const inCountry = this.matchesFuzzy(u.country, terms);
        const inCity = this.matchesFuzzy(u.city, terms);
        const inSkills = (u.skills || []).some(s => this.matchesFuzzy(s, terms));
        return inName || inTitle || inCountry || inCity || inSkills;
      })
      .slice(0, 4)
      .map(u => ({
        id: u.id,
        fullName: u.fullName || u.email,
        title: u.title || 'Développeur',
        country: u.country || '',
        city: u.city || '',
        avatarUrl: u.avatarUrl,
        skills: (u.skills || []).slice(0, 3),
        reputationScore: u.reputationScore || 0
      }));

    // 3. Filtrage Opportunités
    const matchingOpps: SearchResultOpportunity[] = rawOpps
      .filter(o => {
        const inTitle = this.matchesFuzzy(o.title, terms);
        const inDesc = this.matchesFuzzy(o.description, terms);
        const inLocation = this.matchesFuzzy(o.location, terms);
        const inStack = (o.stack || []).some(s => this.matchesFuzzy(s, terms));
        return inTitle || inDesc || inLocation || inStack;
      })
      .slice(0, 3)
      .map(o => ({
        id: o.id,
        title: o.title,
        type: o.type,
        location: o.location,
        stack: (o.stack || []).slice(0, 3)
      }));

    // 4. Filtrage Événements & Hackathons
    const matchingEvents: SearchResultEvent[] = rawEvents
      .filter(ev => {
        const inTitle = this.matchesFuzzy(ev.title, terms);
        const inDesc = this.matchesFuzzy(ev.description, terms);
        const inLocation = this.matchesFuzzy(ev.location, terms);
        const inTags = (ev.tags || []).some(t => this.matchesFuzzy(t, terms));
        return inTitle || inDesc || inLocation || inTags;
      })
      .slice(0, 3)
      .map(ev => ({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        location: ev.location,
        startDate: ev.startDate,
        tags: (ev.tags || []).slice(0, 3)
      }));

    // 5. Filtrage Entreprises & Recruteurs
    const matchingCompanies: SearchResultCompany[] = rawCompanies
      .filter(c => {
        const inName = this.matchesFuzzy(c.name, terms);
        const inDesc = this.matchesFuzzy(c.description || c.tagline, terms);
        const inSector = this.matchesFuzzy(c.sector, terms);
        const inCountry = this.matchesFuzzy(c.country, terms);
        const inCity = this.matchesFuzzy(c.city, terms);
        return inName || inDesc || inSector || inCountry || inCity;
      })
      .slice(0, 4)
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logoUrl: c.logoUrl,
        country: c.country,
        city: c.city,
        sector: c.sector,
        companyLevel: c.companyLevel,
        verified: c.verified
      }));

    // 6. Technologies & Domaines découverts
    const baseTech = [
      'React', 'Angular', 'Vue.js', 'Spring Boot', 'FastAPI', 'Node.js', 'Python',
      'Docker', 'PostgreSQL', 'MongoDB', 'Flutter', 'Next.js', 'TypeScript', 'Java',
      'TailwindCSS', 'Redis', 'C#', 'ASP.NET', 'SqlServer', 'Bootstrap', 'E-Commerce',
      'FinTech', 'IA & ML', 'Kubernetes'
    ];
    const dynamicSet = new Map<string, string>();
    for (const item of baseTech) {
      dynamicSet.set(this.compactText(item), item);
    }
    rawProjects.forEach(p => (p.stack || []).forEach(s => dynamicSet.set(this.compactText(s), s)));
    rawUsers.forEach(u => (u.skills || []).forEach(s => dynamicSet.set(this.compactText(s), s)));
    rawEvents.forEach(e => (e.tags || []).forEach(t => dynamicSet.set(this.compactText(t), t)));
    rawCompanies.forEach(c => {
      if (c.sector) dynamicSet.set(this.compactText(c.sector), c.sector);
    });

    const allKnownTech = Array.from(dynamicSet.values());
    const matchingTech = allKnownTech.filter(tech => this.matchesFuzzy(tech, terms)).slice(0, 5);

    // Détecter une suggestion orthographique IA
    let suggestedCorrection: string | null = null;
    if (terms.length === 1 && terms[0].length >= 4 && matchingTech.length > 0) {
      const topTech = matchingTech[0];
      const compactTop = this.compactText(topTech);
      const compactRaw = this.compactText(trimmed);
      if (compactTop !== compactRaw && !compactTop.startsWith(compactRaw)) {
        suggestedCorrection = topTech;
      }
    }

    const totalMatches = matchingProjects.length + matchingDevs.length + matchingOpps.length + matchingEvents.length + matchingCompanies.length + matchingTech.length;

    return {
      query: rawQuery,
      suggestedCorrection,
      projects: matchingProjects,
      developers: matchingDevs,
      opportunities: matchingOpps,
      events: matchingEvents,
      companies: matchingCompanies,
      technologies: matchingTech,
      totalMatches
    };
  }
}
