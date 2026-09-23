import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IDENTIFY_ROUTE } from '../config/public-links';
import {
  INVITE_IDENTIFIED_STATE,
  inviteTokenNeedsIdentifyGate,
  readSignupIdentifyToken,
} from './invite-identify';

/** Old `/signup/student?token=` copies still open identify. New-student from identify does not loop. */
export const inviteIdentifyGuard: CanActivateFn = (route) => {
  const token = route.queryParamMap.get('token') ?? '';
  const router = inject(Router);
  const navigationToken = router.getCurrentNavigation()?.extras?.state?.[INVITE_IDENTIFIED_STATE];
  if (!inviteTokenNeedsIdentifyGate(token, readSignupIdentifyToken(), navigationToken)) {
    return true;
  }
  return router.createUrlTree([IDENTIFY_ROUTE], { queryParams: route.queryParams });
};
