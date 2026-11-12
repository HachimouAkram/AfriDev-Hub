import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour les routes réservées aux développeurs (ex: mes projets github).
 * Redirige un recruteur vers son espace recruteur dédié.
 */
export const developerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = authService.currentUser()?.role;
  if (role === 'RECRUITER') {
    return router.createUrlTree(['/dashboard/recruiter']);
  }

  return true;
};

