import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { canAccessAdmin, isAccessTokenValid, isTeacherRole } from './auth-role.helpers';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isAccessTokenValid(auth.getAccessToken())) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  const claims = auth.getClaims();

  if (isTeacherRole(claims?.role)) {
    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'teacher' },
    });
  }

  if (canAccessAdmin(claims)) {
    return true;
  }

  auth.clearSession();
  return router.createUrlTree(['/login'], {
    queryParams: { reason: 'denied' },
  });
};
