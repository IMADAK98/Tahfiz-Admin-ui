import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IdentifyApiService } from '../../core/api/identify-api.service';
import {
  ActivateStudentResult,
  IdentifiedStudent,
  RegisterTokenValidation,
} from '../../core/api/models/identify.model';
import { coerceId } from './dto/identify-form.dto';

@Injectable({ providedIn: 'root' })
export class IdentifyService {
  private readonly api = inject(IdentifyApiService);

  validateToken(token: string): Observable<RegisterTokenValidation> {
    return this.api.validateRegisterToken(token);
  }

  lookup(opts: {
    usePassport: boolean;
    identification: string;
    passportNumber: string;
  }): Observable<IdentifiedStudent | null> {
    if (opts.usePassport) {
      return this.api.findByIdentification({ passportNumber: opts.passportNumber });
    }
    return this.api.findByIdentification({ identification: opts.identification });
  }

  /**
   * Activate / re-enroll returning student for the token term.
   * Coerces id string→number before POST.
   */
  activateReturning(token: string, studentId: number | string): Observable<ActivateStudentResult | null> {
    const id = coerceId(studentId);
    if (id === null) {
      throw new Error('Invalid student id');
    }
    return this.api.activateStudent({ token, studentId: id });
  }
}
