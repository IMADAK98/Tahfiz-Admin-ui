import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentRequestApiService } from '../../core/api/student-request-api.service';
import { mapStudentRequest, StudentRequestViewModel } from './dto';

@Injectable({ providedIn: 'root' })
export class StudentRequestsService {
  private readonly requestApi = inject(StudentRequestApiService);

  /** GET /admin/student-requests is already pending-only — rows often omit `status`. */
  loadPending(): Observable<StudentRequestViewModel[]> {
    return this.requestApi.list().pipe(map((records) => records.map(mapStudentRequest)));
  }

  approve(id: number): Observable<void> {
    return this.requestApi.approve(id);
  }

  reject(id: number, reason: string): Observable<void> {
    return this.requestApi.reject(id, { rejectionReason: reason.trim() });
  }
}
