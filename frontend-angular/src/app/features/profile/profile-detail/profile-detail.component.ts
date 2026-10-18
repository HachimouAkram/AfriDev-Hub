import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, Profile, User, LoginSession } from '../../../core/services/auth.service';
import { ProfileService, GitHubStats } from '../../../core/services/profile.service';
import { FollowService, FollowStats } from '../../../core/services/follow.service';
import { MessageService, DirectMessage } from '../../../core/services/message.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { EvaluationService, Evaluation, ReputationScore } from '../../../core/services/evaluation.service';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { TranslationService, Language } from '../../../core/services/translation.service';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.css'
})
export class ProfileDetailComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private followService = inject(FollowService);
  private messageService = inject(MessageService);
  private projectService = inject(ProjectService);
  private evaluationService = inject(EvaluationService);
  public themeService = inject(ThemeService);
  public translationService = inject(TranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  profile: Profile | null = null;
  targetUserId: string | null = null;
  parsedGithubStats: GitHubStats | null = null;

  currentUser = this.authService.currentUser;
  isLoggedIn = () => this.authService.isLoggedIn();
  isOwnProfile = false;

  // Activities & Reputation
  userProjects: Project[] = [];
  userEvaluations: Evaluation[] = [];
  reputationScore: ReputationScore | null = null;
  isLoadingActivities = false;
  activeTab: 'projects' | 'evaluations' | 'github' | 'security' | 'preferences' = 'projects';

  // Security & Active Sessions
  sessions: LoginSession[] = [];
  isLoadingSessions = false;
  sessionActionMessage = '';
  sessionErrorMessage = '';
  isUpdating2fa = false;

  // Follow State
  followStats: FollowStats | null = null;
  isTogglingFollow = false;

  // Followers / Following List Modal
  showFollowersModal = false;
  followModalTitle = '';
  followUserList: User[] = [];
  isLoadingFollowList = false;

  // Chat Modal State
  showChatModal = false;
  chatMessages: DirectMessage[] = [];
  newChatMessage = '';
  isSendingMessage = false;

  // Modals state
  showGithubModal = false;
  githubUsernameInput = '';
  isSyncing = false;
  syncSuccessMessage = '';
  syncErrorMessage = '';

  isVerifyingMm = false;
  mmSuccessMessage = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProfile(id);
      } else if (this.currentUser() && this.currentUser()?.profile) {
        this.profile = this.currentUser()!.profile;
        this.targetUserId = this.currentUser()!.id;
        this.isOwnProfile = true;
        this.parseGithubStats();
        this.loadFollowStats(this.targetUserId);
        this.loadActivities(this.targetUserId);
      }
    });
  }

  goBack(): void {
    // If there is history, navigate back; else fallback to network
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/network']);
    }
  }

  loadProfile(id: string): void {
    this.profileService.getProfileById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile = res.data;
          this.targetUserId = res.data.userId || (res.data as any).userId || id;
          this.isOwnProfile = (this.currentUser()?.profile?.id === this.profile?.id) ||
                             (this.currentUser()?.id === this.targetUserId);
          this.parseGithubStats();
          if (this.targetUserId) {
            this.loadFollowStats(this.targetUserId);
            this.loadActivities(this.targetUserId);
          }
        }
      }
    });
  }

  getAvatarUrl(url: string | undefined | null): string {
    return this.profileService.getFullAvatarUrl(url);
  }

  /** Safely get cvUrl from profile without 'as any' in template */
  getCvUrl(profile: any): string | null {
    return profile?.cvUrl || null;
  }

  hasCv(profile: any): boolean {
    return !!profile?.cvUrl;
  }

  onAvatarError(event: Event): void {
    if (this.profile) {
      // If image fails to load, gracefully reset so letter fallback shows
      this.profile.avatarUrl = undefined;
    }
  }

  loadActivities(userId: string): void {
    this.isLoadingActivities = true;
    
    // Load projects authored by user
    this.projectService.getProjectsByAuthor(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.userProjects = res.data.content || res.data || [];
        }
      }
    });

    // Load received evaluations
    this.evaluationService.getReceivedEvaluations(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.userEvaluations = res.data;
        }
      }
    });

    // Load reputation score
    this.evaluationService.getReputationScore(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reputationScore = res.data;
        }
        this.isLoadingActivities = false;
      },
      error: () => this.isLoadingActivities = false
    });
  }

  getProjectTypeBadge(type?: string): { label: string; class: string } {
    switch (type) {
      case 'OPEN_SOURCE':
        return { label: 'Open Source', class: 'badge-emerald' };
      case 'FOR_SALE':
        return { label: 'En Vente', class: 'badge-amber' };
      case 'SAAS':
        return { label: 'SaaS', class: 'badge-purple' };
      case 'PORTFOLIO':
        return { label: 'Portfolio', class: 'badge-blue' };
      case 'ENTERPRISE':
        return { label: 'Entreprise (NDA)', class: 'badge-slate' };
      default:
        return { label: 'Open Source', class: 'badge-emerald' };
    }
  }

  loadFollowStats(userId: string): void {
    this.followService.getStats(userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.followStats = res.data;
        }
      },
      error: () => {
        this.followStats = {
          followersCount: 0,
          followingCount: 0,
          followedByCurrentUser: false
        };
      }
    });
  }

  toggleFollow(): void {
    if (!this.targetUserId || !this.isLoggedIn()) return;

    this.isTogglingFollow = true;
    if (this.followStats?.followedByCurrentUser) {
      this.followService.unfollowUser(this.targetUserId).subscribe({
        next: (res) => {
          this.isTogglingFollow = false;
          if (res.success) this.followStats = res.data;
        },
        error: () => {
          this.isTogglingFollow = false;
          if (this.followStats) {
            this.followStats.followedByCurrentUser = false;
            this.followStats.followersCount = Math.max(0, this.followStats.followersCount - 1);
          }
        }
      });
    } else {
      this.followService.followUser(this.targetUserId).subscribe({
        next: (res) => {
          this.isTogglingFollow = false;
          if (res.success) this.followStats = res.data;
        },
        error: () => {
          this.isTogglingFollow = false;
          if (this.followStats) {
            this.followStats.followedByCurrentUser = true;
            this.followStats.followersCount += 1;
          }
        }
      });
    }
  }

  openFollowersModal(): void {
    if (!this.targetUserId) return;
    this.showFollowersModal = true;
    this.followModalTitle = `Abonnés de ${this.profile?.fullName || 'l\'utilisateur'}`;
    this.isLoadingFollowList = true;
    this.followUserList = [];
    this.followService.getFollowers(this.targetUserId).subscribe({
      next: (res) => {
        this.isLoadingFollowList = false;
        if (res.success && res.data) {
          this.followUserList = res.data;
        }
      },
      error: () => this.isLoadingFollowList = false
    });
  }

  openFollowingModal(): void {
    if (!this.targetUserId) return;
    this.showFollowersModal = true;
    this.followModalTitle = `Abonnements de ${this.profile?.fullName || 'l\'utilisateur'}`;
    this.isLoadingFollowList = true;
    this.followUserList = [];
    this.followService.getFollowing(this.targetUserId).subscribe({
      next: (res) => {
        this.isLoadingFollowList = false;
        if (res.success && res.data) {
          this.followUserList = res.data;
        }
      },
      error: () => this.isLoadingFollowList = false
    });
  }

  closeFollowModal(): void {
    this.showFollowersModal = false;
    this.followUserList = [];
  }

  openChatModal(): void {
    if (!this.targetUserId || !this.isLoggedIn()) return;
    this.router.navigate(['/messages'], { queryParams: { user: this.targetUserId } });
  }

  closeChatModal(): void {
    this.showChatModal = false;
  }

  loadConversation(): void {
    if (!this.targetUserId) return;
    this.messageService.getConversation(this.targetUserId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.chatMessages = res.data;
        }
      },
      error: () => {
        this.chatMessages = [];
      }
    });
  }

  sendChatMessage(): void {
    if (!this.targetUserId || !this.newChatMessage.trim()) return;

    this.isSendingMessage = true;
    this.messageService.sendMessage(this.targetUserId, this.newChatMessage).subscribe({
      next: (res) => {
        this.isSendingMessage = false;
        if (res.success && res.data) {
          this.chatMessages.push(res.data);
          this.newChatMessage = '';
        }
      },
      error: () => {
        this.isSendingMessage = false;
      }
    });
  }

  parseGithubStats(): void {
    if (this.profile && (this.profile as any).githubStatsJson) {
      try {
        this.parsedGithubStats = JSON.parse((this.profile as any).githubStatsJson);
      } catch {
        this.parsedGithubStats = null;
      }
    }
  }

  openGithubModal(): void {
    this.showGithubModal = true;
    this.syncSuccessMessage = '';
    this.syncErrorMessage = '';
  }

  closeGithubModal(): void {
    this.showGithubModal = false;
  }

  onSyncGithub(): void {
    if (!this.githubUsernameInput.trim()) return;

    this.isSyncing = true;
    this.syncSuccessMessage = '';
    this.syncErrorMessage = '';

    this.profileService.syncGithub(this.githubUsernameInput.trim()).subscribe({
      next: (res) => {
        this.isSyncing = false;
        if (res.success) {
          this.profile = res.data;
          this.parseGithubStats();
          this.syncSuccessMessage = 'Statistiques GitHub synchronisées avec succès ! (+15% de complétion)';
          setTimeout(() => this.closeGithubModal(), 2000);
        }
      },
      error: (err) => {
        this.isSyncing = false;
        this.syncErrorMessage = err.error?.error?.message || 'Erreur lors de la synchronisation avec GitHub.';
      }
    });
  }

  onVerifyMobileMoney(): void {
    this.isVerifyingMm = true;
    this.profileService.verifyMobileMoney().subscribe({
      next: (res) => {
        this.isVerifyingMm = false;
        if (res.success) {
          this.profile = res.data;
          this.authService.updateProfileInUser(res.data);
          this.mmSuccessMessage = 'Identité vérifiée via Mobile Money ! Badge activé sur votre profil.';
        }
      }
    });
  }

  // Edit Profile Modal State
  showEditModal = false;
  isSavingProfile = false;
  isUploadingAvatar = false;
  isUploadingCv = false;
  cvUploadSuccessMessage = '';
  cvUploadErrorMessage = '';
  editSuccessMessage = '';
  editErrorMessage = '';

  editForm = {
    fullName: '',
    title: '',
    avatarUrl: '',
    bio: '',
    country: '',
    city: '',
    skillsInput: '',
    languagesInput: '',
    yearsExperience: null as number | null,
    availability: 'OPEN',
    hourlyRate: null as number | null,
    githubUrl: '',
    linkedinUrl: '',
    zindiUrl: '',
    portfolioUrl: ''
  };

  openEditModal(): void {
    if (!this.profile) return;
    this.editForm = {
      fullName: this.profile.fullName || '',
      title: this.profile.title || '',
      avatarUrl: this.profile.avatarUrl || '',
      bio: this.profile.bio || '',
      country: this.profile.country || '',
      city: this.profile.city || '',
      skillsInput: (this.profile.skills || []).join(', '),
      languagesInput: (this.profile.languages || []).join(', '),
      yearsExperience: this.profile.yearsExperience || null,
      availability: this.profile.availability || 'OPEN',
      hourlyRate: (this.profile as any).hourlyRate || null,
      githubUrl: this.profile.githubUrl || '',
      linkedinUrl: this.profile.linkedinUrl || '',
      zindiUrl: this.profile.zindiUrl || '',
      portfolioUrl: this.profile.portfolioUrl || ''
    };
    this.editSuccessMessage = '';
    this.editErrorMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingAvatar = true;

    this.profileService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.isUploadingAvatar = false;
        if (res.success && res.data?.url) {
          const newUrl = res.data.url;
          this.editForm.avatarUrl = newUrl;
          if (this.profile) {
            this.profile.avatarUrl = newUrl;
          }
          // Direct quick-save if changed from header badge outside of modal
          if (!this.showEditModal) {
            this.profileService.updateProfile({ avatarUrl: newUrl }).subscribe({
              next: (updateRes) => {
                if (updateRes.success && updateRes.data) {
                  this.profile = updateRes.data;
                  this.authService.updateProfileInUser(updateRes.data);
                }
              }
            });
          }
        }
      },
      error: () => {
        this.isUploadingAvatar = false;
        this.editErrorMessage = 'Échec du téléversement de la photo.';
      }
    });
  }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.cvUploadErrorMessage = 'Seuls les fichiers PDF sont acceptés.';
      return;
    }

    this.isUploadingCv = true;
    this.cvUploadSuccessMessage = '';
    this.cvUploadErrorMessage = '';

    this.profileService.uploadCv(file).subscribe({
      next: (res) => {
        this.isUploadingCv = false;
        if (res.success && res.data?.url) {
          const cvUrl = res.data.url;
          // Save cv URL to profile
          this.profileService.updateProfile({ cvUrl }).subscribe({
            next: (updateRes) => {
              if (updateRes.success && updateRes.data) {
                this.profile = updateRes.data;
                this.authService.updateProfileInUser(updateRes.data);
                this.cvUploadSuccessMessage = `CV téléversé avec succès : ${file.name}`;
                setTimeout(() => this.cvUploadSuccessMessage = '', 4000);
              }
            },
            error: () => {
              this.cvUploadErrorMessage = 'Erreur lors de la sauvegarde du CV.';
            }
          });
        }
      },
      error: () => {
        this.isUploadingCv = false;
        this.cvUploadErrorMessage = 'Échec du téléversement du CV PDF.';
      }
    });
  }

  onSaveProfile(): void {
    this.isSavingProfile = true;
    this.editSuccessMessage = '';
    this.editErrorMessage = '';

    const skills = this.editForm.skillsInput
      ? this.editForm.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const languages = this.editForm.languagesInput
      ? this.editForm.languagesInput.split(',').map(l => l.trim()).filter(l => l.length > 0)
      : [];

    const payload = {
      fullName: this.editForm.fullName,
      title: this.editForm.title,
      avatarUrl: this.editForm.avatarUrl,
      bio: this.editForm.bio,
      country: this.editForm.country,
      city: this.editForm.city,
      skills: skills,
      languages: languages,
      yearsExperience: this.editForm.yearsExperience,
      availability: this.editForm.availability,
      hourlyRate: this.editForm.hourlyRate,
      githubUrl: this.editForm.githubUrl,
      linkedinUrl: this.editForm.linkedinUrl,
      zindiUrl: this.editForm.zindiUrl,
      portfolioUrl: this.editForm.portfolioUrl
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        if (res.success && res.data) {
          this.profile = res.data;
          this.authService.updateProfileInUser(res.data);
          this.editSuccessMessage = 'Profil mis à jour avec succès !';
          setTimeout(() => this.closeEditModal(), 1500);
        }
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.editErrorMessage = err.error?.error?.message || 'Erreur lors de la mise à jour du profil.';
      }
    });
  }

  // ── SÉCURITÉ & HISTORIQUE DES SESSIONS ──

  loadSessions(): void {
    if (!this.isOwnProfile) return;
    this.isLoadingSessions = true;
    this.sessionErrorMessage = '';
    this.authService.getSecuritySessions().subscribe({
      next: (res) => {
        this.isLoadingSessions = false;
        if (res.success && res.data) {
          this.sessions = res.data;
        }
      },
      error: (err) => {
        this.isLoadingSessions = false;
        this.sessionErrorMessage = 'Impossible de charger l\'historique des connexions.';
      }
    });
  }

  toggleTwoFactor(targetState: boolean): void {
    this.isUpdating2fa = true;
    this.sessionActionMessage = '';
    this.sessionErrorMessage = '';
    this.authService.toggleTwoFactor(targetState).subscribe({
      next: (res) => {
        this.isUpdating2fa = false;
        this.sessionActionMessage = targetState 
          ? '🔒 Double authentification activée avec succès ! Vos connexions sont protégées par code email.' 
          : 'Double authentification désactivée.';
        setTimeout(() => this.sessionActionMessage = '', 4500);
      },
      error: (err) => {
        this.isUpdating2fa = false;
        this.sessionErrorMessage = err.error?.error?.message || 'Erreur lors de la modification du 2FA.';
      }
    });
  }

  revokeSession(sessionId: string): void {
    if (!confirm('Voulez-vous vraiment déconnecter cet appareil ?')) return;
    this.authService.revokeSession(sessionId).subscribe({
      next: () => {
        this.sessionActionMessage = 'Session révoquée avec succès.';
        this.loadSessions();
        setTimeout(() => this.sessionActionMessage = '', 4000);
      },
      error: () => {
        this.sessionErrorMessage = 'Erreur lors de la révocation de la session.';
      }
    });
  }

  revokeOtherSessions(): void {
    if (!confirm('Voulez-vous vraiment déconnecter tous les autres appareils connectés ?')) return;
    this.authService.revokeOtherSessions().subscribe({
      next: () => {
        this.sessionActionMessage = 'Tous les autres appareils ont été déconnectés avec succès.';
        this.loadSessions();
        setTimeout(() => this.sessionActionMessage = '', 4000);
      },
      error: () => {
        this.sessionErrorMessage = 'Erreur lors de la déconnexion des autres sessions.';
      }
    });
  }

  getMediaUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return '/api/v1' + url;
  }

  // Preferences: Theme & Language management
  currentLang = this.translationService.currentLang;
  availableLanguages = this.translationService.languages;

  isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }

  selectLanguage(lang: Language): void {
    this.translationService.setLanguage(lang);
  }

  speakVoice(lang: Language, event?: Event): void {
    if (event) event.stopPropagation();
    this.translationService.speakGreeting(lang);
  }

  getLevelBadge(levelNumber?: number): string {
    switch (levelNumber) {
      case 5: return '👑';
      case 4: return '🟠';
      case 3: return '🟣';
      case 2: return '🔵';
      case 1:
      default: return '🟢';
    }
  }

  getLevelClass(levelNumber?: number): string {
    return 'level-tag-' + (levelNumber || 1);
  }

  getXpProgress(xp: number = 0): { percent: number; nextLevelXp: number; remainingXp: number; nextLevelTitle: string } {
    if (xp >= 3501) {
      return { percent: 100, nextLevelXp: 3501, remainingXp: 0, nextLevelTitle: 'Leader' };
    } else if (xp >= 1801) {
      const min = 1801, max = 3500;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 3501, remainingXp: 3501 - xp, nextLevelTitle: 'Leader' };
    } else if (xp >= 751) {
      const min = 751, max = 1800;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 1801, remainingXp: 1801 - xp, nextLevelTitle: 'Tech' };
    } else if (xp >= 251) {
      const min = 251, max = 750;
      const percent = Math.min(100, Math.max(0, Math.round(((xp - min) / (max - min)) * 100)));
      return { percent, nextLevelXp: 751, remainingXp: 751 - xp, nextLevelTitle: 'Expert' };
    } else {
      const max = 250;
      const percent = Math.min(100, Math.max(0, Math.round((xp / max) * 100)));
      return { percent, nextLevelXp: 251, remainingXp: 251 - xp, nextLevelTitle: 'Senior' };
    }
  }
}

