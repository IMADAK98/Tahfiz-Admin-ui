import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SignupApiService } from '../../core/api/signup-api.service';
import {
  CenterSignupFormModel,
  buildPendingCenterPayload,
} from './dto/center-signup-form.model';

@Injectable({ providedIn: 'root' })
export class CenterSignupService {
  private readonly signupApi = inject(SignupApiService);

  submitCenterSignup(form: CenterSignupFormModel): Observable<void> {
    return this.signupApi.submitPendingCenterRequest(buildPendingCenterPayload(form));
  }
}
