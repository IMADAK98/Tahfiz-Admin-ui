import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { CenterApiService } from '../../core/api/center-api.service';
import { HalqaApiService } from '../../core/api/halqa-api.service';
import { HalqaListItem } from '../../core/api/models/halqa.model';
import { ActiveStudent } from '../../core/api/models/student.model';
import { ActiveTeacher } from '../../core/api/models/teacher.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { TermsService } from '../terms/terms.service';
import {
  CreateHalaqaFormModel,
  HalaqatFiltersModel,
  buildCreateHalaqaPayload,
  coercePersonList,
  mapHalqaApiRecord,
  validateCreateHalaqaForm,
} from './dto';

export interface HalaqatPageData {
  activeTerm: ActiveTerm | null;
  halaqat: HalqaListItem[];
}

export interface CreateHalaqaPickers {
  teachers: ActiveTeacher[];
  students: ActiveStudent[];
}

@Injectable({ providedIn: 'root' })
export class HalaqatService {
  private readonly centerApi = inject(CenterApiService);
  private readonly halqaApi = inject(HalqaApiService);
  private readonly termsService = inject(TermsService);

  /** Admin IA: active term → by-term list; center-scoped fallback only. Never by-teacher-id. */
  loadPage(centerId: number): Observable<HalaqatPageData> {
    return this.termsService.getActiveTerm(centerId).pipe(
      switchMap((activeTerm) => {
        if (!activeTerm) {
          return of({ activeTerm: null, halaqat: [] });
        }
        return this.loadHalaqatForTerm(activeTerm, centerId);
      }),
    );
  }

  /** Create pickers: available teachers and available students only. */
  loadCreatePickers(centerId: number): Observable<CreateHalaqaPickers> {
    return forkJoin({
      teachers: this.centerApi.getAvailableTeachers(centerId, { limit: 100 }),
      students: this.centerApi.getAvailableStudents(centerId),
    }).pipe(
      map(({ teachers, students }) => ({
        teachers: coercePersonList(teachers),
        students: coercePersonList(students),
      })),
    );
  }

  validateForm(form: CreateHalaqaFormModel): Record<string, string> {
    return validateCreateHalaqaForm(form);
  }

  /** Create assigns teacher + students via POST /halqa (not assign-teacher / enroll-students). */
  createHalaqa(form: CreateHalaqaFormModel, termId: number): Observable<HalqaListItem> {
    const errors = validateCreateHalaqaForm(form);
    if (Object.keys(errors).length) {
      throw new Error(Object.values(errors)[0]);
    }
    return this.halqaApi
      .createHalqa(buildCreateHalaqaPayload(form, termId))
      .pipe(map(mapHalqaApiRecord));
  }

  filterHalaqat(halaqat: HalqaListItem[], filters: HalaqatFiltersModel): HalqaListItem[] {
    const query = filters.search.trim().toLowerCase();
    return halaqat.filter((item) => {
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      if (filters.period && !item.periods.includes(filters.period)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [item.name, item.teacherName ?? '', ...item.studentNames].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  private loadHalaqatForTerm(activeTerm: ActiveTerm, centerId: number): Observable<HalaqatPageData> {
    return this.halqaApi.getByTerm(activeTerm.id).pipe(
      map((records) => ({
        activeTerm,
        halaqat: records.map(mapHalqaApiRecord),
      })),
      catchError((error: unknown) => {
        if (!(error instanceof ApiError)) {
          return throwError(() => error);
        }
        return this.halqaApi.getByCenterId(centerId).pipe(
          map((records) => ({
            activeTerm,
            halaqat: records.map(mapHalqaApiRecord),
          })),
        );
      }),
    );
  }
}
