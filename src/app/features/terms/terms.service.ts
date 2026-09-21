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
   * ponytail: best documented path is PUT /term/{id} (dates/holidays only).
   * OpenAPI UpdateTermDto omits status — COMPLETED transition TBD; try endDate=today then surface API message.
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
