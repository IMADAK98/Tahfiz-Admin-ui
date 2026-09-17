import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentSignupApiService } from '../../core/api/student-signup-api.service';
import {
  PendingStudentRequestResult,
  RegisterTokenValidation,
} from '../../core/api/models/student-signup.model';
import {
  StudentSignupFormValues,
  buildPendingStudentPayload,
} from './dto/student-signup-form.dto';

/** Thin UI orchestration — HttpClient stays in core/api. */
@Injectable({ providedIn: 'root' })
export class StudentSignupService {
  private readonly api = inject(StudentSignupApiService);

  validateToken(token: string): Observable<RegisterTokenValidation> {
    return this.api.validateRegisterToken(token);
  }

  submit(form: StudentSignupFormValues): Observable<PendingStudentRequestResult | null> {
    return this.api.submitPendingStudentRequest(buildPendingStudentPayload(form));
  }
}
