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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent),
    canActivate: [authGuard]
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
    path: 'evaluations',
    loadComponent: () => import('./features/evaluations/evaluation-list/evaluation-list.component').then(m => m.EvaluationListComponent)
  },
  {
    path: 'evaluations/:id',
    loadComponent: () => import('./features/evaluations/evaluation-list/evaluation-list.component').then(m => m.EvaluationListComponent)
  },
  {
    path: 'network',
    loadComponent: () => import('./features/network/network.component').then(m => m.NetworkComponent)
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
