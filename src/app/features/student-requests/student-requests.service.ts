import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentRequestApiService } from '../../core/api/student-request-api.service';
import { mapStudentRequest, StudentRequestViewModel } from './dto';

@Injectable({ providedIn: 'root' })
export class StudentRequestsService {
  private readonly requestApi = inject(StudentRequestApiService);

  /** GET /admin/student-requests summary says pending-only; filter defensively anyway. */
  loadPending(): Observable<StudentRequestViewModel[]> {
    return this.requestApi
      .list()
      .pipe(map((records) => records.filter((record) => record.status === 'PENDING').map(mapStudentRequest)));
  }

  approve(id: number): Observable<void> {
    return this.requestApi.approve(id);
  }

  reject(id: number, reason: string): Observable<void> {
    return this.requestApi.reject(id, { rejectionReason: reason.trim() });
  }
}
