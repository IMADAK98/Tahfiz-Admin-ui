import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CenterApiService } from '../../core/api/center-api.service';
import { ActiveTerm, UpdateTermPayload } from '../../core/api/models/term.model';
import { TermApiService } from '../../core/api/term-api.service';
import { CreateTermFormModel, buildCreateTermPayload, validateCreateTermForm } from './dto';

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

  /** PUT /term/{id}. Caller refetches the active term after success. */
  updateTerm(termId: number, payload: UpdateTermPayload): Observable<ActiveTerm> {
    return this.termApi.updateTerm(termId, payload);
  }

  /** POST /term/{id}/end. Caller refetches GET /center/:id/active-term after success. */
  endActiveTerm(termId: number): Observable<void> {
    return this.termApi.endTerm(termId);
  }
}
