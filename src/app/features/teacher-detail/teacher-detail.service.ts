import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeacherApiService } from '../../core/api/teacher-api.service';
import { TeacherDetailViewModel, mapTeacherUserRecord } from '../teachers/dto';
import { AssignedHalqaViewModel, mapAssignedHalqa } from './dto';

export interface TeacherDetailPageData {
  detail: TeacherDetailViewModel;
  halaqat: AssignedHalqaViewModel[];
}

@Injectable({ providedIn: 'root' })
export class TeacherDetailService {
  private readonly teacherApi = inject(TeacherApiService);

  loadDetail(id: number): Observable<TeacherDetailPageData> {
    return forkJoin({
      teacher: this.teacherApi.getByUserId(id),
      halaqat: this.teacherApi.getHalqasByTeacherId(id),
    }).pipe(
      map(({ teacher, halaqat }) => ({
        detail: mapTeacherUserRecord(teacher),
        halaqat: halaqat.map(mapAssignedHalqa),
      })),
    );
  }
}
