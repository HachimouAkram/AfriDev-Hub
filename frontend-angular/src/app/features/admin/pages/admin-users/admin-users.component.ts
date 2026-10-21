import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserAdmin } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
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
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
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
        if (res.success && res.data) {
          this.users = res.data.content;
          this.userTotalPages = res.data.totalPages;
          this.userTotalElements = res.data.totalElements;
        }
      },
      error: (err) => {
        this.isLoadingUsers = false;
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

  getCountryFlag(countryName?: string): string {
    if (!countryName) return '🌍';
    return this.countryFlags[countryName] || '🌍';
  }
}
