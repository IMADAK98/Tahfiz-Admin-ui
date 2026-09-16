import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
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

  loadPage(centerId: number): Observable<HalaqatPageData> {
    return this.termsService.getActiveTerm(centerId).pipe(
      switchMap((activeTerm) => {
        if (!activeTerm) {
          return of({ activeTerm: null, halaqat: [] });
        }
        return this.halqaApi.getByTerm(activeTerm.id).pipe(
          map((records) => ({
            activeTerm,
            halaqat: records.map(mapHalqaApiRecord),
          })),
        );
      }),
    );
  }

  loadCreatePickers(centerId: number): Observable<CreateHalaqaPickers> {
    return forkJoin({
      teachers: this.centerApi.getAvailableTeachers(centerId, { limit: 100 }),
      students: this.centerApi.getAvailableStudents(centerId),
    });
  }

  validateForm(form: CreateHalaqaFormModel): string | null {
    return validateCreateHalaqaForm(form);
  }

  createHalaqa(form: CreateHalaqaFormModel, termId: number): Observable<HalqaListItem> {
    const validationError = validateCreateHalaqaForm(form);
    if (validationError) {
      throw new Error(validationError);
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
}
