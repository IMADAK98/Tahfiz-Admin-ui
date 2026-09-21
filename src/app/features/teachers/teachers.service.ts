import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CenterApiService } from '../../core/api/center-api.service';
import { TeacherApiService } from '../../core/api/teacher-api.service';
import { ActiveTeacher } from '../../core/api/models/teacher.model';
import {
  TeacherDetailViewModel,
  TeacherFormMode,
  TeacherFormModel,
  buildCreateManualPayload,
  buildUpdateProfilePayload,
  mapTeacherUserRecord,
  validateTeacherForm,
} from './dto';

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly centerApi = inject(CenterApiService);
  private readonly teacherApi = inject(TeacherApiService);

  loadActiveTeachers(centerId: number): Observable<ActiveTeacher[]> {
    return this.centerApi.getActiveTeachers(centerId, { limit: 100 });
  }

  fetchTeacherDetail(id: number): Observable<TeacherDetailViewModel> {
    return this.teacherApi.getByUserId(id).pipe(map(mapTeacherUserRecord));
  }

  validate(form: TeacherFormModel, mode: TeacherFormMode): Record<string, string> {
    return validateTeacherForm(form, mode);
  }

  createTeacher(form: TeacherFormModel, centerId: number): Observable<void> {
    return this.teacherApi.createManual(buildCreateManualPayload(form, centerId));
  }

  updateTeacher(profileId: number, form: TeacherFormModel): Observable<void> {
    return this.teacherApi.updateProfile(profileId, buildUpdateProfilePayload(form)).pipe(map(() => undefined));
  }

  filterTeachers(teachers: ActiveTeacher[], search: string): ActiveTeacher[] {
    const query = search.trim().toLowerCase();
    if (!query) {
      return teachers;
    }
    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(query) || (teacher.phone ?? '').toLowerCase().includes(query),
    );
  }
}
