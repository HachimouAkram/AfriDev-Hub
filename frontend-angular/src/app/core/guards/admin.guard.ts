import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard de sécurité pour les sections Administrateur et Super Administrateur.
 * Bloque l'accès à toute personne ne disposant pas du rôle SUPER_ADMIN ou ADMIN.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const role = authService.currentUser()?.role;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return true;
  }

  // Redirection sécurisée vers le tableau de bord si le profil n'a pas les droits
  return router.createUrlTree(['/dashboard']);
};
