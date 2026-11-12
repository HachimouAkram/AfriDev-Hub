import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommunityGroupService, Group } from '../../../core/services/community-group.service';
import { AuthService } from '../../../core/services/auth.service';

interface FilterCategory {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-public-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-groups.component.html',
  styleUrls: ['./public-groups.component.css']
})
export class PublicGroupsComponent implements OnInit {
  public authService = inject(AuthService);
  private groupService = inject(CommunityGroupService);
  private router = inject(Router);

  // Toutes les communautés
  groups: Group[] = [];
  filteredGroups: Group[] = [];

  // Communautés de l'utilisateur connecté
  myGroups: Group[] = [];
  myCreatedGroups: Group[] = [];
  myJoinedGroups: Group[] = [];
  myGroupIds = new Set<string>();
  myGroupsActiveTab: 'all' | 'created' | 'joined' = 'all';

  // Communautés recommandées
  recommendedGroups: Group[] = [];

  isLoading = false;
  successToast: string | null = null;
  isJoiningId: string | null = null;

  searchQuery = '';
  activeCategory = 'ALL';
  selectedCountry = 'ALL';
  selectedAccess = 'ALL';

  categories: FilterCategory[] = [
    { key: 'ALL', label: 'Toutes les communautés', icon: 'ri-apps-2-line' },
    { key: 'Angular', label: 'Angular & Frontend', icon: 'ri-layout-masonry-line' },
    { key: 'Spring', label: 'Spring & Java', icon: 'ri-server-line' },
    { key: 'Python', label: 'Python & Data', icon: 'ri-brain-line' },
    { key: 'Mobile', label: 'Mobile & Flutter', icon: 'ri-smartphone-line' },
    { key: 'DevOps', label: 'Cloud & DevOps', icon: 'ri-git-branch-line' },
    { key: 'Securite', label: 'Cybersécurité', icon: 'ri-shield-keyhole-line' },
    { key: 'OpenSource', label: 'Open Source', icon: 'ri-code-box-line' }
  ];

  countries: string[] = [
    'ALL',
    'Sénégal',
    'Côte d\'Ivoire',
    'Cameroun',
    'Nigeria',
    'Kenya',
    'RDC',
    'Bénin',
    'Togo',
    'Maroc',
    'Ghana',
    'Rwanda',
    'Tunisie'
  ];

  ngOnInit(): void {
    this.loadGroups();
  }

  isOwnerOrCreator(group: Group): boolean {
    const current = this.authService.currentUser();
    if (!current) return false;
    return group.userRole === 'OWNER' ||
           group.owner?.id === current.id ||
           group.owner?.email === current.email;
  }

  loadGroups(): void {
    this.isLoading = true;
    const countryParam = this.selectedCountry === 'ALL' ? undefined : this.selectedCountry;
    const tagParam = this.activeCategory === 'ALL' ? undefined : this.activeCategory;

    // 1. Récupération des communautés publiques
    this.groupService.searchGroups(countryParam, tagParam, this.searchQuery, 0, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.groups = res.data.content || [];
          this.applyClientFilters();
        } else {
          this.groups = [];
          this.filteredGroups = [];
        }

        // 2. Si connecté, récupérer "Mes Groupes" et calculer les recommandations
        if (this.authService.isLoggedIn()) {
          this.loadUserCommunitiesAndRecommendations();
        } else {
          this.myGroups = [];
          this.myCreatedGroups = [];
          this.myJoinedGroups = [];
          this.myGroupIds.clear();
          this.recommendedGroups = [];
        }
      },
      error: () => {
        this.isLoading = false;
        this.groups = [];
        this.filteredGroups = [];
      }
    });
  }

  loadUserCommunitiesAndRecommendations(): void {
    this.groupService.getMyGroups(0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list: Group[] = res.data.content || [];
          this.myGroups = list;
          this.myGroupIds = new Set(list.map(g => g.id));
          this.myCreatedGroups = list.filter(g => this.isOwnerOrCreator(g));
          this.myJoinedGroups = list.filter(g => !this.isOwnerOrCreator(g));

          // Synchroniser le statut membre sur la liste globale
          this.groups.forEach(g => {
            if (this.myGroupIds.has(g.id)) {
              g.isMember = true;
            }
          });
        }
        this.computeRecommendations();
      },
      error: () => {
        this.computeRecommendations();
      }
    });
  }

  computeRecommendations(): void {
    const current = this.authService.currentUser();
    if (!current) {
      this.recommendedGroups = [];
      return;
    }

    const userSkills = (current.profile?.skills || []).map(s => s.toLowerCase());
    const userCountry = (current.profile?.country || '').toLowerCase();

    // Filtre des communautés non encore rejointes par l'utilisateur
    const candidates = this.groups.filter(g => !this.myGroupIds.has(g.id) && !g.isMember);

    candidates.forEach(g => {
      const gTags = (g.tags || []).map(t => t.toLowerCase());
      const matched = (g.tags || []).filter(t =>
        userSkills.some(s => s === t.toLowerCase() || t.toLowerCase().includes(s) || s.includes(t.toLowerCase()))
      );

      const sameCountry = g.country && userCountry && g.country.toLowerCase() === userCountry;

      let score = 40;
      const reasons: string[] = [];

      if (matched.length > 0) {
        score += matched.length * 20;
        reasons.push(`Correspond à votre stack (${matched.slice(0, 2).join(', ')})`);
      }

      if (sameCountry) {
        score += 25;
        reasons.push(`Collectif actif au ${g.country}`);
      }

      const count = g.memberCount || 0;
      if (count >= 2) {
        score += 15;
        reasons.push(`Communauté dynamique (${count} membres)`);
      }

      g.matchPercentage = Math.min(99, Math.round(score));
      if (!g.suggestionReason) {
        g.suggestionReason = reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : 'Communauté recommandée par les pairs';
      }
    });

    // Trier par pourcentage de pertinence et prendre les meilleurs
    candidates.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    this.recommendedGroups = candidates.slice(0, 4);
  }

  isSkillMatched(tag: string): boolean {
    const current = this.authService.currentUser();
    if (!current || !current.profile?.skills) return false;
    const tagLower = tag.toLowerCase();
    return current.profile.skills.some(s => s.toLowerCase() === tagLower || tagLower.includes(s.toLowerCase()));
  }

  setCategory(key: string): void {
    this.activeCategory = key;
    this.loadGroups();
  }

  setCountry(country: string): void {
    this.selectedCountry = country;
    this.loadGroups();
  }

  setAccess(access: string): void {
    this.selectedAccess = access;
    this.applyClientFilters();
  }

  setMyGroupsTab(tab: 'all' | 'created' | 'joined'): void {
    this.myGroupsActiveTab = tab;
  }

  get displayedMyGroups(): Group[] {
    if (this.myGroupsActiveTab === 'created') return this.myCreatedGroups;
    if (this.myGroupsActiveTab === 'joined') return this.myJoinedGroups;
    return this.myGroups;
  }

  onSearchChange(): void {
    this.loadGroups();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadGroups();
  }

  applyClientFilters(): void {
    let list = [...this.groups];
    if (this.selectedAccess && this.selectedAccess !== 'ALL') {
      list = list.filter(g => g.accessType === this.selectedAccess);
    }
    this.filteredGroups = list;
  }

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'C';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return 'Accès libre';
      case 'OUVERT': return 'Sur demande';
      case 'PRIVE': return 'Privé';
      default: return 'Public';
    }
  }

  handleJoin(group: Group, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/register'], {
        queryParams: { returnUrl: `/dashboard/groupes/${group.slug}` }
      });
      return;
    }

    if (group.isMember) {
      this.router.navigate(['/dashboard/groupes', group.slug]);
      return;
    }

    this.isJoiningId = group.id;
    this.groupService.joinGroup(group.id).subscribe({
      next: (res) => {
        this.isJoiningId = null;
        if (res.success) {
          group.isMember = true;
          group.memberCount = (group.memberCount || 0) + 1;
          this.myGroupIds.add(group.id);
          this.loadUserCommunitiesAndRecommendations();
          this.showToast(group.accessType === 'OUVERT' ? 'Demande envoyée aux modérateurs !' : 'Bienvenue dans la communauté !');
        }
      },
      error: () => {
        this.isJoiningId = null;
        this.showToast('Erreur lors de l\'adhésion');
      }
    });
  }

  private showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => {
      this.successToast = null;
    }, 4000);
  }
}
