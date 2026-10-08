import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { CenterApiService } from '../../core/api/center-api.service';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermApiService } from '../../core/api/term-api.service';
import {
  CreateTermFormModel,
  buildCreateTermPayload,
  validateCreateTermForm,
} from './dto';

@Injectable({ providedIn: 'root' })
export class TermsService {
  private readonly centerApi = inject(CenterApiService);
  private readonly termApi = inject(TermApiService);

  getActiveTerm(centerId: number): Observable<ActiveTerm | null> {
    return this.centerApi.getActiveTerm(centerId);
  }

  getTermsByCenterId(centerId: number): Observable<ActiveTerm[]> {
    return this.termApi.getTermsByCenterId(centerId);
  }

  validateForm(form: CreateTermFormModel): Record<string, string> {
    return validateCreateTermForm(form);
  }

  createTerm(form: CreateTermFormModel, centerId: number): Observable<ActiveTerm> {
    const errors = validateCreateTermForm(form);
    if (Object.keys(errors).length) {
      throw new Error(Object.values(errors)[0]);
    }
    return this.termApi.createTerm(buildCreateTermPayload(form, centerId));
  }

  /**
   * PUT /term/{id} `{ endDate: today }` only. Nest UpdateTermDto has no status.
   * TermLifecycleService marks COMPLETED only when endDate < today, and PUT
   * rejects an earlier end date, so this 200 leaves the term ACTIVE for the
   * rest of the UTC day. Callers must reread GET /center/:id/active-term.
   */
  endActiveTerm(termId: number): Observable<ActiveTerm> {
    const today = new Date().toISOString().slice(0, 10);
    return this.termApi.updateTerm(termId, { endDate: today }).pipe(
      catchError((error: unknown) => {
        if (error instanceof ApiError) {
          return throwError(() => error);
        }
        return throwError(
          () =>
            new ApiError(
              'مسار إنهاء الدورة غير متوفر — UpdateTermDto لا يتضمن status',
              501,
            ),
        );
      }),
    );
  }
}
