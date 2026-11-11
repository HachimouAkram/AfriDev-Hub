import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NetworkService, UserNetwork, NetworkSuggestion } from '../../core/services/network.service';
import { FollowService } from '../../core/services/follow.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './network.component.html',
  styleUrl: './network.component.css'
})
export class NetworkComponent implements OnInit {
  private networkService = inject(NetworkService);
  private followService = inject(FollowService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);

  users: UserNetwork[] = [];
  suggestions: NetworkSuggestion[] = [];

  getAvatarUrl(url: string | undefined | null): string {
    return this.profileService.getFullAvatarUrl(url);
  }

  activeTab: 'ALL' | 'DEVELOPER' | 'RECRUITER' | 'SUGGESTIONS' = 'ALL';
  currentSort: 'SUGGESTED' | 'POPULAR' | 'SAME_COUNTRY' | 'RECENT' = 'SUGGESTED';
  searchQuery = '';
  selectedSkill = '';
  selectedCountry = '';

  isLoading = true;
  isLoadingMore = false;
  hasMoreUsers = true;
  totalUsers = 0;
  page = 0;
  readonly pageSize = 20;
  isLoadingSuggestions = false;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      const skill = params.get('skill') || params.get('tech');
      if (q !== null) {
        this.searchQuery = q;
      }
      if (skill !== null) {
        this.selectedSkill = skill;
      }
      this.loadNetworkUsers();
    });
    if (this.isLoggedIn()) {
      this.loadSuggestions();
    }
  }

  setSort(sort: 'SUGGESTED' | 'POPULAR' | 'SAME_COUNTRY' | 'RECENT'): void {
    if (this.currentSort === sort) return;
    this.currentSort = sort;
    this.loadNetworkUsers();
  }

  isMatchedSkill(user: UserNetwork, skill: string): boolean {
    if (!user.matchedSkills || user.matchedSkills.length === 0) return false;
    return user.matchedSkills.some(s => s.toLowerCase() === skill.toLowerCase());
  }

  loadNetworkUsers(): void {
    this.isLoading = true;
    this.page = 0;
    this.hasMoreUsers = true;
    const roleParam = this.activeTab === 'SUGGESTIONS' ? 'ALL' : this.activeTab;

    this.networkService.getNetworkUsers({
      role: roleParam,
      query: this.searchQuery,
      skill: this.selectedSkill,
      country: this.selectedCountry,
      sort: this.currentSort,
      page: 0,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const fetched: UserNetwork[] = res.data?.content || (Array.isArray(res.data) ? res.data : []);
          this.totalUsers = res.data?.totalElements || fetched.length;
          this.hasMoreUsers = !res.data?.last && fetched.length >= this.pageSize;
          this.users = fetched;
        }
      },
      error: () => {
        this.isLoading = false;
        this.users = [];
      }
    });
  }

  loadMoreUsers(): void {
    if (this.isLoadingMore || !this.hasMoreUsers || this.isLoading || this.activeTab === 'SUGGESTIONS') return;
    this.isLoadingMore = true;
    const nextPage = this.page + 1;
    const roleParam = this.activeTab;

    this.networkService.getNetworkUsers({
      role: roleParam,
      query: this.searchQuery,
      skill: this.selectedSkill,
      country: this.selectedCountry,
      sort: this.currentSort,
      page: nextPage,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.isLoadingMore = false;
        if (res.success && res.data) {
          const newItems: UserNetwork[] = res.data?.content || (Array.isArray(res.data) ? res.data : []);
          const isLast = res.data?.last || newItems.length < this.pageSize;
          if (newItems.length > 0) {
            this.page = nextPage;
            const existingIds = new Set(this.users.map(u => u.id));
            const toAdd = newItems.filter(u => !existingIds.has(u.id));
            this.users = [...this.users, ...toAdd];
          }
          if (isLast || newItems.length < this.pageSize || (this.totalUsers > 0 && this.users.length >= this.totalUsers)) {
            this.hasMoreUsers = false;
          }
        }
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isLoadingMore || !this.hasMoreUsers || this.isLoading || this.activeTab === 'SUGGESTIONS') return;
    const threshold = 400;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;
    if (position >= height - threshold) {
      this.loadMoreUsers();
    }
  }

  loadSuggestions(): void {
    this.isLoadingSuggestions = true;
    this.networkService.getNetworkSuggestions(6).subscribe({
      next: (res) => {
        this.isLoadingSuggestions = false;
        if (res.success && res.data) {
          this.suggestions = res.data;
        }
      },
      error: () => {
        this.isLoadingSuggestions = false;
      }
    });
  }

  setTab(tab: 'ALL' | 'DEVELOPER' | 'RECRUITER' | 'SUGGESTIONS'): void {
    this.activeTab = tab;
    if (tab !== 'SUGGESTIONS') {
      this.loadNetworkUsers();
    }
  }

  onSearchChange(): void {
    if (this.activeTab !== 'SUGGESTIONS') {
      this.loadNetworkUsers();
    }
  }

  toggleFollow(user: UserNetwork): void {
    if (!this.isLoggedIn()) return;

    if (user.isFollowedByCurrentUser) {
      this.followService.unfollowUser(user.id).subscribe({
        next: (res) => {
          if (res.success) {
            user.isFollowedByCurrentUser = false;
            user.followersCount = Math.max(0, user.followersCount - 1);
          }
        }
      });
    } else {
      this.followService.followUser(user.id).subscribe({
        next: (res) => {
          if (res.success) {
            user.isFollowedByCurrentUser = true;
            user.followersCount += 1;
          }
        }
      });
    }
  }

  toggleFollowSuggestion(sug: NetworkSuggestion): void {
    this.toggleFollow(sug.user);
  }

  cleanText(text?: string): string {
    if (!text) return '';
    return text
      .replace(/S\?\?n\?\?gal/gi, 'Sénégal')
      .replace(/C\?\?te d'Ivoire/gi, "Côte d'Ivoire")
      .replace(/\?\?/g, 'é');
  }
}
