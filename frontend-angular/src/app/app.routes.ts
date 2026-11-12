import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { recruiterGuard } from './core/guards/recruiter.guard';
import { developerGuard } from './core/guards/developer.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [developerGuard],
        loadComponent: () => import('./features/dashboard/pages/dashboard-overview/dashboard-overview.component').then(m => m.DashboardOverviewComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/dashboard/pages/dashboard-applications/dashboard-applications.component').then(m => m.DashboardApplicationsComponent)
      },
      {
        path: 'offers',
        loadComponent: () => import('./features/dashboard/pages/dashboard-offers/dashboard-offers.component').then(m => m.DashboardOffersComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'projects',
        canActivate: [developerGuard],
        loadComponent: () => import('./features/dashboard/pages/dashboard-projects/dashboard-projects.component').then(m => m.DashboardProjectsComponent)
      },
      {
        path: 'resources',
        loadComponent: () => import('./features/dashboard/pages/dashboard-resources/dashboard-resources.component').then(m => m.DashboardResourcesComponent)
      },
      {
        path: 'evaluations',
        loadComponent: () => import('./features/evaluations/evaluation-list/evaluation-list.component').then(m => m.EvaluationListComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./features/dashboard/pages/dashboard-events/dashboard-events.component').then(m => m.DashboardEventsComponent)
      },
      {
        path: 'profile',
        canActivate: [developerGuard],
        loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'aide',
        loadComponent: () => import('./features/help/help-feed/help-feed.component').then(m => m.HelpFeedComponent)
      },
      {
        path: 'aide/creer',
        loadComponent: () => import('./features/help/create-help-post/create-help-post.component').then(m => m.CreateHelpPostComponent)
      },
      {
        path: 'aide/:id',
        loadComponent: () => import('./features/help/help-post-detail/help-post-detail.component').then(m => m.HelpPostDetailComponent)
      },
      {
        path: 'mentors',
        loadComponent: () => import('./features/mentors/mentor-list/mentor-list.component').then(m => m.MentorListComponent)
      },
      {
        path: 'groupes',
        loadComponent: () => import('./features/groups/group-list/group-list.component').then(m => m.GroupListComponent)
      },
      {
        path: 'groupes/creer',
        loadComponent: () => import('./features/groups/create-group/create-group.component').then(m => m.CreateGroupComponent)
      },
      {
        path: 'groupes/:slug',
        loadComponent: () => import('./features/groups/group-page/group-page.component').then(m => m.GroupPageComponent)
      },
      // Espace Cockpit Recruteur
      {
        path: 'recruiter',
        canActivate: [recruiterGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-overview.component').then(m => m.RecruiterOverviewComponent)
          },
          {
            path: 'offers',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-opportunities.component').then(m => m.RecruiterOpportunitiesComponent)
          },
          {
            path: 'applications',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent)
          },
          {
            path: 'events',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-events.component').then(m => m.RecruiterEventsComponent)
          },
          {
            path: 'resources',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-resources.component').then(m => m.RecruiterResourcesComponent)
          },
          {
            path: 'team',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-team.component').then(m => m.RecruiterTeamComponent)
          },
          {
            path: 'activity-log',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-activity-log.component').then(m => m.RecruiterActivityLogComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/dashboard/recruiter/recruiter-company-profile.component').then(m => m.RecruiterCompanyProfileComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'messages',
    redirectTo: 'dashboard/messages',
    pathMatch: 'full'
  },
  {
    path: 'evaluations',
    redirectTo: 'dashboard/evaluations',
    pathMatch: 'full'
  },
  {
    path: 'evaluations/:id',
    redirectTo: 'dashboard/evaluations',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    redirectTo: 'dashboard/profile',
    pathMatch: 'full'
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./features/ai-assistant/ai-assistant-page.component').then(m => m.AiAssistantPageComponent)
  },
  {
    path: 'opportunities',
    loadComponent: () => import('./features/opportunities/opportunity-list/opportunity-list.component').then(m => m.OpportunityListComponent)
  },
  {
    path: 'network',
    loadComponent: () => import('./features/network/network.component').then(m => m.NetworkComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent)
  },
  {
    path: 'communautes',
    loadComponent: () => import('./features/groups/public-groups/public-groups.component').then(m => m.PublicGroupsComponent)
  },
  {
    path: 'communautes/:slug',
    loadComponent: () => import('./features/groups/public-group-detail/public-group-detail.component').then(m => m.PublicGroupDetailComponent)
  },
  {
    path: 'resources',
    loadComponent: () => import('./features/resources/resource-list/resource-list.component').then(m => m.ResourceListComponent)
  },
  {
    path: 'formations',
    redirectTo: 'resources',
    pathMatch: 'full'
  },
  {
    path: 'groupes',
    redirectTo: 'communautes',
    pathMatch: 'full'
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
  {
    path: 'leaderboard/companies',
    loadComponent: () => import('./features/leaderboard/company-leaderboard/company-leaderboard.component').then(m => m.CompanyLeaderboardComponent)
  },
  {
    path: 'classement/entreprises',
    redirectTo: 'leaderboard/companies',
    pathMatch: 'full'
  },
  {
    path: 'company/:slug',
    loadComponent: () => import('./features/companies/company-public-page/company-public-page.component').then(m => m.CompanyPublicPageComponent)
  },
  {
    path: 'entreprise/:slug',
    redirectTo: 'company/:slug',
    pathMatch: 'prefix'
  },
  {
    path: 'classement',
    redirectTo: 'leaderboard',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/dashboard/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/pages/admin-overview/admin-overview.component').then(m => m.AdminOverviewComponent)
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/admin/pages/admin-overview/admin-overview.component').then(m => m.AdminOverviewComponent)
      },
      {
        path: 'adoption',
        loadComponent: () => import('./features/admin/pages/admin-adoption/admin-adoption.component').then(m => m.AdminAdoptionComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'moderation',
        loadComponent: () => import('./features/admin/pages/admin-moderation/admin-moderation.component').then(m => m.AdminModerationComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/admin/pages/admin-audit/admin-audit.component').then(m => m.AdminAuditComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
