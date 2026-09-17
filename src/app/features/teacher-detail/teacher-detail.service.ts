import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HalqaApiService } from '../../core/api/halqa-api.service';
import { TeacherApiService } from '../../core/api/teacher-api.service';
import { TeacherDetailViewModel, mapTeacherUserRecord } from '../teachers/dto';
import { AssignedHalqaViewModel, filterHalqasByTeacherId, mapAssignedHalqa } from './dto';

export interface TeacherDetailPageData {
  detail: TeacherDetailViewModel;
  halaqat: AssignedHalqaViewModel[];
}

@Injectable({ providedIn: 'root' })
export class TeacherDetailService {
  private readonly teacherApi = inject(TeacherApiService);
  private readonly halqaApi = inject(HalqaApiService);

  /**
   * `GET /halqa/by-teacher-id/{id}` is self-only for TEACHER (IDOR lock) — admins must not call
   * it with an arbitrary teacher id. Load the center's ḥalaqāt (already admin-safe, same
   * endpoint halaqat.service.ts falls back to) and filter client-side instead.
   */
  loadDetail(id: number, centerId: number): Observable<TeacherDetailPageData> {
    return forkJoin({
      teacher: this.teacherApi.getByUserId(id),
      centerHalqat: this.halqaApi.getByCenterId(centerId),
    }).pipe(
      map(({ teacher, centerHalqat }) => ({
        detail: mapTeacherUserRecord(teacher),
        halaqat: filterHalqasByTeacherId(centerHalqat, id).map(mapAssignedHalqa),
      })),
    );
  }
}
