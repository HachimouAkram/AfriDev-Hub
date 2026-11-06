import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommunityGroupService, Group, GroupPost } from '../../../core/services/community-group.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-public-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './public-group-detail.component.html',
  styleUrls: ['./public-group-detail.component.css']
})
export class PublicGroupDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  private groupService = inject(CommunityGroupService);

  group: Group | null = null;
  publicPosts: GroupPost[] = [];
  isLoading = true;
  isLoadingPosts = false;
  isJoining = false;
  successToast: string | null = null;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadGroup(slug);
    }
  }

  loadGroup(slug: string): void {
    this.isLoading = true;
    this.groupService.getGroupBySlug(slug).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.group = res.data;
          this.loadPublicFeed(this.group.id);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadPublicFeed(groupId: string): void {
    this.isLoadingPosts = true;
    this.groupService.getGroupFeed(groupId, undefined, 0, 10).subscribe({
      next: (res) => {
        this.isLoadingPosts = false;
        if (res.success && res.data) {
          this.publicPosts = (res.data.content || []).filter((p: GroupPost) => p.visibility === 'PUBLIC');
        }
      },
      error: () => {
        this.isLoadingPosts = false;
      }
    });
  }

  getInitial(name?: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'C';
  }

  getAccessLabel(type: string): string {
    switch (type) {
      case 'PUBLIC': return 'Accès Public';
      case 'OUVERT': return 'Sur Demande';
      case 'PRIVE': return 'Communauté Privée';
      default: return 'Public';
    }
  }

  handleJoin(): void {
    if (!this.group) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/register'], {
        queryParams: { returnUrl: `/dashboard/groupes/${this.group.slug}` }
      });
      return;
    }

    if (this.group.isMember) {
      this.router.navigate(['/dashboard/groupes', this.group.slug]);
      return;
    }

    this.isJoining = true;
    this.groupService.joinGroup(this.group.id).subscribe({
      next: (res) => {
        this.isJoining = false;
        if (res.success && this.group) {
          this.group.isMember = true;
          this.group.memberCount = (this.group.memberCount || 0) + 1;
          this.showToast(this.group.accessType === 'OUVERT' ? 'Demande envoyée !' : 'Bienvenue dans la communauté !');
          setTimeout(() => {
            this.router.navigate(['/dashboard/groupes', this.group?.slug]);
          }, 1200);
        }
      },
      error: () => {
        this.isJoining = false;
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

