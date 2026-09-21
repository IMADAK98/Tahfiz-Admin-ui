import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReEnrollmentApiService } from '../../core/api/re-enrollment-api.service';
import { TermApiService } from '../../core/api/term-api.service';
import { ReEnrollmentStatus } from './enums';
import {
  mapReEnrollmentRequest,
  ReEnrollmentRequestView,
  RejectReEnrollmentFormModel,
  sortRequestsPendingFirst,
  validateRejectForm,
} from './dto';

@Injectable({ providedIn: 'root' })
export class ReEnrollmentService {
  private readonly reEnrollmentApi = inject(ReEnrollmentApiService);
  private readonly termApi = inject(TermApiService);

  loadPendingQueue(centerId: number): Observable<ReEnrollmentRequestView[]> {
    return forkJoin({
      requests: this.reEnrollmentApi.listRequests(),
      terms: this.termApi.getTermsByCenterId(centerId),
    }).pipe(
      map(({ requests, terms }) => {
        const termNames = new Map(terms.map((term) => [term.id, term.name]));
        return sortRequestsPendingFirst(
          requests
            .map((request) => mapReEnrollmentRequest(request, termNames))
            .filter((request) => request.status === ReEnrollmentStatus.Pending),
        );
      }),
    );
  }

  approveRequest(id: number): Observable<void> {
    return this.reEnrollmentApi.approveRequest(id);
  }

  rejectRequest(id: number, form: RejectReEnrollmentFormModel): Observable<void> {
    const errors = validateRejectForm(form);
    if (Object.keys(errors).length) {
      throw new Error(Object.values(errors)[0]);
    }
    return this.reEnrollmentApi.rejectRequest(id, {
      rejectionReason: form.rejectionReason.trim(),
    });
  }
}
