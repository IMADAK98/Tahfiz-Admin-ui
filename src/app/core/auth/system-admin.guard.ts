import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  isAccessTokenValid,
  isCenterAdminRole,
  isSystemAdminRole,
  isTeacherRole,
} from './auth-role.helpers';
import { AuthService } from './auth.service';
import { CENTER_ADMIN_HOME } from './redirect.helpers';

/** JWT role SYSTEM_ADMIN only — center ADMIN is redirected to `/admin`. */
export const systemAdminGuard: CanActivateFn = (_route, state) => {
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

  if (isSystemAdminRole(claims?.role)) {
    return true;
  }

  if (isCenterAdminRole(claims?.role)) {
    return router.createUrlTree([CENTER_ADMIN_HOME]);
  }

  auth.clearSession();
  return router.createUrlTree(['/login'], {
    queryParams: { reason: 'denied' },
  });
};
