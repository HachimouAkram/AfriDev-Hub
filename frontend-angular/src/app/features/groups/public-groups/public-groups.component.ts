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

  groups: Group[] = [];
  filteredGroups: Group[] = [];
  isLoading = false;
  successToast: string | null = null;
  isJoiningId: string | null = null;

  searchQuery = '';
  activeCategory = 'ALL';
  selectedCountry = 'ALL';

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

  loadGroups(): void {
    this.isLoading = true;
    const countryParam = this.selectedCountry === 'ALL' ? undefined : this.selectedCountry;
    const tagParam = this.activeCategory === 'ALL' ? undefined : this.activeCategory;

    this.groupService.searchGroups(countryParam, tagParam, this.searchQuery, 0, 50).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.groups = res.data.content || [];
          this.applyClientFilters();
        } else {
          this.groups = [];
          this.filteredGroups = [];
        }
      },
      error: () => {
        this.isLoading = false;
        this.groups = [];
        this.filteredGroups = [];
      }
    });
  }

  setCategory(key: string): void {
    this.activeCategory = key;
    this.loadGroups();
  }

  setCountry(country: string): void {
    this.selectedCountry = country;
    this.loadGroups();
  }

  onSearchChange(): void {
    this.loadGroups();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadGroups();
  }

  applyClientFilters(): void {
    this.filteredGroups = [...this.groups];
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
    }, 3500);
  }
}

