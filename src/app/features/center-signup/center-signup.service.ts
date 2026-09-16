import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SignupApiService } from '../../core/api/signup-api.service';
import {
  CenterSignupFormValues,
  buildPendingCenterPayload,
} from '../../core/signup/pending-center-payload';

@Injectable({ providedIn: 'root' })
export class CenterSignupService {
  private readonly signupApi = inject(SignupApiService);

  submitCenterSignup(form: CenterSignupFormValues): Observable<void> {
    return this.signupApi.submitPendingCenterRequest(buildPendingCenterPayload(form));
  }
}
