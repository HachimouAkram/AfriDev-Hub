import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeaderboardService, LeaderboardResponse, LeaderboardEntry } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);
  isUpdatingFromDb = signal<boolean>(false);
  isCached = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  data = signal<LeaderboardResponse | null>(null);

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(query?: string): void {
    const cached = this.leaderboardService.getCached(query);
    if (cached) {
      // Afficher immédiatement les résultats enregistrés en cache sans faire attendre l'utilisateur
      this.data.set(cached);
      this.isLoading.set(false);
      this.isUpdatingFromDb.set(true);
      this.isCached.set(true);
    } else {
      this.isLoading.set(true);
      this.isUpdatingFromDb.set(false);
      this.isCached.set(false);
    }
    this.errorMessage.set(null);

    // Rechargement en arrière-plan depuis le backend / base de données pour rafraîchir et synchroniser
    this.leaderboardService.getLeaderboard(query).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.data.set(res.data);
          this.leaderboardService.saveCache(query, res.data);
          this.isCached.set(!!res.data.fromCache);
        } else if (!cached) {
          this.errorMessage.set(res.error?.message || 'Impossible de charger le classement.');
        }
        this.isLoading.set(false);
        this.isUpdatingFromDb.set(false);
      },
      error: (err) => {
        if (!cached) {
          this.errorMessage.set('Erreur de connexion au serveur de classement.');
        }
        this.isLoading.set(false);
        this.isUpdatingFromDb.set(false);
      }
    });
  }

  onSearch(): void {
    const q = this.searchQuery();
    this.loadLeaderboard(q);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadLeaderboard();
  }

  getFlag(country?: string): string {
    return this.leaderboardService.getCountryFlag(country);
  }

  getFlagUrl(country?: string): string | null {
    return this.leaderboardService.getCountryFlagUrl(country);
  }

  getInitials(name?: string): string {
    if (!name) return 'D';
    return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  getLevelColor(levelNumber?: number): string {
    switch (levelNumber) {
      case 5: return '#f59e0b'; // Leader (gold/amber)
      case 4: return '#f97316'; // Tech (orange)
      case 3: return '#a855f7'; // Expert (purple)
      case 2: return '#3b82f6'; // Senior (blue)
      default: return '#10b981'; // Junior (emerald)
    }
  }

  getLevelBadge(levelNumber?: number): string {
    switch (levelNumber) {
      case 5: return '👑';
      case 4: return '🟠';
      case 3: return '🟣';
      case 2: return '🔵';
      default: return '🟢';
    }
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    if (rank <= 5) return 'rank-top5';
    return 'rank-standard';
  }
}
