import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
        loadComponent: () => import('./features/dashboard/pages/dashboard-projects/dashboard-projects.component').then(m => m.DashboardProjectsComponent)
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
        loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
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
    path: 'leaderboard',
    loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
  {
    path: 'classement',
    redirectTo: 'leaderboard',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
