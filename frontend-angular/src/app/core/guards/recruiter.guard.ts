import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour les routes réservées aux recruteurs (dashboard recruteur).
 * Redirige un dev vers son dashboard développeur classique.
 */
export const recruiterGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = authService.currentUser()?.role;
  if (role === 'RECRUITER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

