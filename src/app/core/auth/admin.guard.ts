import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { canAccessAdmin, isTeacherRole } from './auth-role.helpers';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
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
    queryParams: { redirect: state.url },
  });
};
