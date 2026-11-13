import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminService, UserAdmin } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LeaderboardService } from '../../../../core/services/leaderboard.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private leaderboardService = inject(LeaderboardService);
  authService = inject(AuthService);

  users: UserAdmin[] = [];
  userSearchTerm = '';
  userCountryFilter = '';
  userRoleFilter = '';
  userStatusFilter = '';
  userPage = 0;
  userTotalPages = 1;
  userTotalElements = 0;
  isLoadingUsers = false;
  isBackgroundSyncing = false;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Modal State for sanctions
  showUserStatusModal = false;
  targetUser: UserAdmin | null = null;
  selectedUserAction: 'ACTIVE' | 'SUSPENDED' | 'BANNED' = 'SUSPENDED';
  userActionReason = '';
  isSubmittingUserAction = false;
  userActionFeedback = '';

  // Modal State for user full details
  showUserDetailModal = false;
  selectedUserDetail: UserAdmin | null = null;

  // Super Admin: Ajout d'administrateur
  showCreateAdminModal = false;
  newAdmin = {
    email: '',
    fullName: '',
    title: '',
    country: 'Sénégal',
    city: 'Dakar',
    role: 'ADMIN' as 'ADMIN' | 'SUPER_ADMIN'
  };
  isSubmittingCreateAdmin = false;
  createAdminFeedback = '';

  // Super Admin: Suppression définitive
  showDeleteUserModal = false;
  userToDelete: UserAdmin | null = null;
  isSubmittingDeleteUser = false;
  deleteUserFeedback = '';
  deleteConfirmInput = '';

  private countryFlags: { [key: string]: string } = {
    'Sénégal': '🇸🇳',
    'Senegal': '🇸🇳',
    'Côte d\'Ivoire': '🇨🇮',
    'Cote d\'Ivoire': '🇨🇮',
    'Nigeria': '🇳🇬',
    'Nigéria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Rwanda': '🇷🇼',
    'Ghana': '🇬🇭',
    'Cameroun': '🇨🇲',
    'Cameroon': '🇨🇲',
    'Bénin': '🇧🇯',
    'Benin': '🇧🇯',
    'Togo': '🇹🇬',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Guinée': '🇬🇳',
    'Guinea': '🇬🇳',
    'Maroc': '🇲🇦',
    'Morocco': '🇲🇦',
    'Tunisie': '🇹🇳',
    'Tunisia': '🇹🇳',
    'Algérie': '🇩🇿',
    'Algeria': '🇩🇿',
    'Égypte': '🇪🇬',
    'Egypt': '🇪🇬',
    'RD Congo': '🇨🇩',
    'RDC': '🇨🇩',
    'Congo': '🇨🇬',
    'Gabon': '🇬🇦',
    'Madagascar': '🇲🇬',
    'Afrique du Sud': '🇿🇦',
    'South Africa': '🇿🇦',
    'Comores': '🇰🇲'
  };

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.userPage = 0;
      this.loadUsers();
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.userSearchTerm);
  }

  loadUsers(): void {
    // Si nous avons déjà des utilisateurs en mémoire, nous rafraîchissons en arrière-plan sans bloquer l'UI
    if (this.users.length === 0) {
      this.isLoadingUsers = true;
    } else {
      this.isBackgroundSyncing = true;
    }

    this.adminService.getAdminUsers({
      search: this.userSearchTerm || undefined,
      country: this.userCountryFilter || undefined,
      role: this.userRoleFilter || undefined,
      status: this.userStatusFilter || undefined,
      page: this.userPage,
      size: 10
    }).subscribe({
      next: (res) => {
        this.isLoadingUsers = false;
        this.isBackgroundSyncing = false;
        if (res.success && res.data) {
          this.users = res.data.content;
          this.userTotalPages = res.data.totalPages;
          this.userTotalElements = res.data.totalElements;
        }
      },
      error: (err) => {
        this.isLoadingUsers = false;
        this.isBackgroundSyncing = false;
        console.error('Failed to load admin users', err);
      }
    });
  }

  onUserFilterChange(): void {
    this.userPage = 0;
    this.loadUsers();
  }


  goToUserPage(page: number): void {
    if (page >= 0 && page < this.userTotalPages) {
      this.userPage = page;
      this.loadUsers();
    }
  }

  openUserDetailModal(user: UserAdmin): void {
    this.selectedUserDetail = user;
    this.showUserDetailModal = true;
  }

  closeUserDetailModal(): void {
    this.showUserDetailModal = false;
    this.selectedUserDetail = null;
  }

  openUserStatusModal(user: UserAdmin, action: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): void {
    this.targetUser = user;
    this.selectedUserAction = action;
    this.userActionReason = '';
    this.userActionFeedback = '';
    this.showUserStatusModal = true;
  }

  closeUserStatusModal(): void {
    this.showUserStatusModal = false;
    this.targetUser = null;
    this.userActionReason = '';
    this.userActionFeedback = '';
  }

  submitUserStatusUpdate(): void {
    if (!this.targetUser) return;
    if (this.selectedUserAction !== 'ACTIVE' && !this.userActionReason.trim()) {
      this.userActionFeedback = 'Veuillez motiver cette sanction pour le registre d\'audit.';
      return;
    }

    this.isSubmittingUserAction = true;
    this.userActionFeedback = '';

    this.adminService.updateUserStatus(
      this.targetUser.id,
      this.selectedUserAction,
      this.userActionReason.trim()
    ).subscribe({
      next: (res) => {
        this.isSubmittingUserAction = false;
        if (res.success) {
          this.closeUserStatusModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.isSubmittingUserAction = false;
        this.userActionFeedback = err.error?.error?.message || err.error?.message || 'Erreur lors de la mise à jour du statut.';
      }
    });
  }

  get isSuperAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'SUPER_ADMIN';
  }

  openCreateAdminModal(): void {
    this.newAdmin = {
      email: '',
      fullName: '',
      title: '',
      country: 'Sénégal',
      city: 'Dakar',
      role: 'ADMIN'
    };
    this.createAdminFeedback = '';
    this.showCreateAdminModal = true;
  }

  closeCreateAdminModal(): void {
    this.showCreateAdminModal = false;
    this.createAdminFeedback = '';
  }

  submitCreateAdmin(): void {
    if (!this.newAdmin.email || !this.newAdmin.fullName) {
      this.createAdminFeedback = 'Veuillez renseigner le nom complet et l\'adresse email professionnelle.';
      return;
    }

    this.isSubmittingCreateAdmin = true;
    this.createAdminFeedback = '';

    this.adminService.createAdminAccount({
      email: this.newAdmin.email.trim(),
      fullName: this.newAdmin.fullName.trim(),
      title: this.newAdmin.title.trim() || undefined,
      country: this.newAdmin.country,
      city: this.newAdmin.city,
      role: this.newAdmin.role
    }).subscribe({
      next: (res) => {
        this.isSubmittingCreateAdmin = false;
        if (res.success) {
          this.closeCreateAdminModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.isSubmittingCreateAdmin = false;
        this.createAdminFeedback = err.error?.error?.message || err.error?.message || 'Erreur lors de la création de l\'administrateur.';
      }
    });
  }

  openDeleteUserModal(user: UserAdmin): void {
    this.userToDelete = user;
    this.deleteConfirmInput = '';
    this.deleteUserFeedback = '';
    this.showDeleteUserModal = true;
  }

  closeDeleteUserModal(): void {
    this.showDeleteUserModal = false;
    this.userToDelete = null;
    this.deleteConfirmInput = '';
    this.deleteUserFeedback = '';
  }

  submitDeleteUser(): void {
    if (!this.userToDelete) return;
    if (this.deleteConfirmInput.trim().toUpperCase() !== 'SUPPRIMER') {
      this.deleteUserFeedback = 'Veuillez saisir exactement le mot "SUPPRIMER" pour confirmer.';
      return;
    }

    this.isSubmittingDeleteUser = true;
    this.deleteUserFeedback = '';

    this.adminService.deleteUserPermanently(this.userToDelete.id).subscribe({
      next: (res) => {
        this.isSubmittingDeleteUser = false;
        if (res.success) {
          this.closeDeleteUserModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.isSubmittingDeleteUser = false;
        this.deleteUserFeedback = err.error?.error?.message || err.error?.message || 'Erreur lors de la suppression définitive du compte.';
      }
    });
  }

  getCountryFlag(countryName?: string): string {
    if (!countryName) return '🌍';
    return this.countryFlags[countryName] || '🌍';
  }

  getCountryFlagUrl(countryName?: string): string | null {
    return this.leaderboardService.getCountryFlagUrl(countryName);
  }
}
