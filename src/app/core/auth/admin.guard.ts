import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ADMIN_ROLES, isAccessTokenValid, isAdminRole } from './auth-role.helpers';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const accessToken = auth.getAccessToken();
  if (!isAccessTokenValid(accessToken)) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  const claims = auth.getClaims();
  if (!isAdminRole(claims?.role)) {
    if (claims?.role === 'TEACHER') {
      return router.createUrlTree(['/login'], { queryParams: { reason: 'teacher' } });
    }

    return router.createUrlTree(['/login'], { queryParams: { reason: 'denied' } });
  }

  return true;
};

/** ponytail: exported for self-check only */
export const ADMIN_ROLE_SET = new Set<string>(ADMIN_ROLES);
