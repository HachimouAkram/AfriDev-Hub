import { Injectable, inject } from '@angular/core';
import { ProjectService, Project } from './project.service';
import { NetworkService, UserNetwork } from './network.service';
import { OpportunityService, Opportunity } from './opportunity.service';
import { Observable, combineLatest, map, of, catchError } from 'rxjs';

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

export interface GlobalSearchResults {
  query: string;
  projects: SearchResultProject[];
  developers: SearchResultDeveloper[];
  opportunities: SearchResultOpportunity[];
  technologies: string[];
  totalMatches: number;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private projectService = inject(ProjectService);
  private networkService = inject(NetworkService);
  private opportunityService = inject(OpportunityService);

  private normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[-_]/g, ' ')
      .trim();
  }

  // Vérifie si un mot-clé correspond ou est approchant (fuzzy matching tolérant)
  private matchesFuzzy(target: string | null | undefined, queryTerms: string[]): boolean {
    if (!target) return false;
    const normTarget = this.normalizeText(target);
    return queryTerms.some(term => {
      if (normTarget.includes(term)) return true;
      // Tolérance pour fautes fréquentes : ex ecomrce -> e commerce, reac -> react
      if (term.length >= 4 && (normTarget.includes(term.slice(0, -1)) || term.includes(normTarget))) {
        return true;
      }
      return false;
    });
  }

  search(rawQuery: string): Observable<GlobalSearchResults> {
    const trimmed = rawQuery ? rawQuery.trim() : '';
    if (!trimmed || trimmed.length < 1) {
      return of({
        query: '',
        projects: [],
        developers: [],
        opportunities: [],
        technologies: [],
        totalMatches: 0
      });
    }

    const normQuery = this.normalizeText(trimmed);
    const terms = normQuery.split(/\s+/).filter(t => t.length > 0);

    return combineLatest([
      this.projectService.getProjects(0, 50).pipe(catchError(() => of({ data: { content: [] } }))),
      this.networkService.getNetworkUsers({ size: 50 }).pipe(catchError(() => of({ data: { content: [] } }))),
      this.opportunityService.getOpportunities(undefined, 0, 50).pipe(catchError(() => of({ data: { content: [] } })))
    ]).pipe(
      map(([projectsRes, usersRes, oppsRes]) => {
        const rawProjects: Project[] = projectsRes?.data?.content || projectsRes?.data || [];
        const rawUsers: UserNetwork[] = usersRes?.data?.content || usersRes?.data || [];
        const rawOpps: Opportunity[] = oppsRes?.data?.content || oppsRes?.data || [];

        // 1. Filtrage Projets
        const matchingProjects: SearchResultProject[] = rawProjects
          .filter(p => {
            const inTitle = this.matchesFuzzy(p.title, terms);
            const inDesc = this.matchesFuzzy(p.description, terms);
            const inStack = (p.stack || []).some(s => this.matchesFuzzy(s, terms));
            const inAuthor = this.matchesFuzzy(p.author?.profile?.fullName || p.author?.email, terms);
            const inCountry = this.matchesFuzzy(p.author?.profile?.country, terms);
            const inType = this.matchesFuzzy(p.projectType, terms);
            return inTitle || inDesc || inStack || inAuthor || inCountry || inType;
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

        // 4. Technologies découvertes
        const allKnownTech = ['React', 'Angular', 'Vue.js', 'Spring Boot', 'FastAPI', 'Node.js', 'Python', 'Docker', 'PostgreSQL', 'MongoDB', 'Flutter', 'Next.js', 'TypeScript', 'Java', 'TailwindCSS', 'Redis'];
        const matchingTech = allKnownTech.filter(tech => this.matchesFuzzy(tech, terms)).slice(0, 4);

        const totalMatches = matchingProjects.length + matchingDevs.length + matchingOpps.length + matchingTech.length;

        return {
          query: rawQuery,
          projects: matchingProjects,
          developers: matchingDevs,
          opportunities: matchingOpps,
          technologies: matchingTech,
          totalMatches
        };
      })
    );
  }
}
