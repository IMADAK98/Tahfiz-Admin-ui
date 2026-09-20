import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeacherRequestApiService } from '../../core/api/teacher-request-api.service';
import { mapTeacherRequest, TeacherRequestViewModel } from './dto';

@Injectable({ providedIn: 'root' })
export class TeacherRequestsService {
  private readonly requestApi = inject(TeacherRequestApiService);

  /** GET /admin/teacher-requests is already pending-only — rows often omit `status`. */
  loadPending(): Observable<TeacherRequestViewModel[]> {
    return this.requestApi.list().pipe(map((records) => records.map(mapTeacherRequest)));
  }

  approve(id: number): Observable<void> {
    return this.requestApi.approve(id);
  }

  reject(id: number, reason: string): Observable<void> {
    return this.requestApi.reject(id, { rejectionReason: reason.trim() });
  }
}
