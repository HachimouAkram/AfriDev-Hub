import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NetworkService, UserNetwork, NetworkSuggestion } from '../../core/services/network.service';
import { FollowService } from '../../core/services/follow.service';
import { AuthService } from '../../core/services/auth.service';

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

  users: UserNetwork[] = [];
  suggestions: NetworkSuggestion[] = [];

  activeTab: 'ALL' | 'DEVELOPER' | 'RECRUITER' | 'SUGGESTIONS' = 'ALL';
  searchQuery = '';
  selectedSkill = '';
  selectedCountry = '';

  isLoading = true;
  isLoadingSuggestions = false;

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.loadNetworkUsers();
    if (this.isLoggedIn()) {
      this.loadSuggestions();
    }
  }

  loadNetworkUsers(): void {
    this.isLoading = true;
    const roleParam = this.activeTab === 'SUGGESTIONS' ? 'ALL' : this.activeTab;

    this.networkService.getNetworkUsers({
      role: roleParam,
      query: this.searchQuery,
      skill: this.selectedSkill,
      country: this.selectedCountry
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.users = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
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
