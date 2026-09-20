import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { HalqaApiService } from '../../core/api/halqa-api.service';
import { QuranApiService } from '../../core/api/quran-api.service';
import { StudyPlanApiService } from '../../core/api/study-plan-api.service';
import { CenterApiService } from '../../core/api/center-api.service';
import { ActiveStudent } from '../../core/api/models/student.model';
import { ActiveTeacher } from '../../core/api/models/teacher.model';
import { HalqaApiRecord } from '../../core/api/models/halqa.model';
import { CreateStudyPlanPayload } from '../../core/api/models/study-plan.model';
import { coercePersonList } from '../halaqat/dto';
import {
  EditHalaqaFormModel,
  HalaqaDetailViewModel,
  HalaqaStudentViewModel,
  StudyPlanViewModel,
  buildCreatePlanItemPayload,
  buildSurahNameMap,
  buildUpdateHalqaPayload,
  buildUpdatePlanItemPayload,
  mapHalqaRoster,
  mapHalqaStudent,
  mapHalaqaDetail,
  mapStudyPlanDetails,
  rosterQueryDate,
  validateEditHalaqaForm,
} from './dto';
import { PlanItemFormModel } from './dto';

export interface HalaqaDetailPageData {
  detail: HalaqaDetailViewModel;
  students: HalaqaStudentViewModel[];
  plans: StudyPlanViewModel[];
}

@Injectable({ providedIn: 'root' })
export class HalaqaDetailService {
  private readonly halqaApi = inject(HalqaApiService);
  private readonly studyPlanApi = inject(StudyPlanApiService);
  private readonly quranApi = inject(QuranApiService);
  private readonly centerApi = inject(CenterApiService);

  loadPage(halqaId: number): Observable<HalaqaDetailPageData> {
    return forkJoin({
      record: this.halqaApi.getById(halqaId),
      surahs: this.quranApi.getSurahs().pipe(map(buildSurahNameMap)),
      planSummaries: this.halqaApi.getStudyPlans(halqaId),
    }).pipe(
      switchMap(({ record, surahs, planSummaries }) => {
        const detail = mapHalaqaDetail(record);
        const plans$ = !planSummaries.length
          ? of([] as StudyPlanViewModel[])
          : forkJoin(
              planSummaries.map((summary) =>
                this.studyPlanApi.getDetails(Number(summary.id)).pipe(
                  map((details) => mapStudyPlanDetails(details, surahs)),
                ),
              ),
            );
        return forkJoin({
          students: this.resolveRoster(halqaId, record),
          plans: plans$,
        }).pipe(map(({ students, plans }) => ({ detail, students, plans })));
      }),
    );
  }

  /** available-* → active-* fallback (TL contract). */
  loadTeacherPickers(centerId: number): Observable<ActiveTeacher[]> {
    return forkJoin({
      available: this.centerApi.getAvailableTeachers(centerId, { limit: 100 }),
      active: this.centerApi.getActiveTeachers(centerId, { limit: 100 }),
    }).pipe(
      map(({ available, active }) => coercePersonList(available.length ? available : active)),
    );
  }

  loadStudentPickers(centerId: number): Observable<ActiveStudent[]> {
    return forkJoin({
      available: this.centerApi.getAvailableStudents(centerId),
      active: this.centerApi.getActiveStudents(centerId, { limit: 200 }),
    }).pipe(
      map(({ available, active }) => coercePersonList(available.length ? available : active)),
    );
  }

  validateEditForm(form: EditHalaqaFormModel): string | null {
    return validateEditHalaqaForm(form);
  }

  updateHalqa(detail: HalaqaDetailViewModel, form: EditHalaqaFormModel): Observable<HalaqaDetailViewModel> {
    const validationError = validateEditHalaqaForm(form);
    if (validationError) {
      throw new Error(validationError);
    }
    return this.halqaApi
      .updateHalqa(detail.id, buildUpdateHalqaPayload(detail, form))
      .pipe(map(mapHalaqaDetail));
  }

  deleteHalqa(halqaId: number): Observable<unknown> {
    return this.halqaApi.deleteHalqa(halqaId);
  }

  enrollStudents(halqaId: number, studentIds: number[]): Observable<unknown> {
    return this.halqaApi.enrollStudents(halqaId, { studentsIds: studentIds });
  }

  unenrollStudent(halqaId: number, studentId: number): Observable<unknown> {
    return this.halqaApi.unenrollStudent(halqaId, studentId);
  }

  createPlan(payload: CreateStudyPlanPayload): Observable<unknown> {
    return this.studyPlanApi.create(payload);
  }

  updatePlanName(planId: number, name: string): Observable<unknown> {
    return this.studyPlanApi.update(planId, { name });
  }

  deletePlan(planId: number): Observable<unknown> {
    return this.studyPlanApi.delete(planId);
  }

  assignStudentsToPlan(planId: number, studentIds: number[]): Observable<unknown> {
    return this.studyPlanApi.assignStudents(planId, { studentIds });
  }

  unassignStudentsFromPlan(planId: number, studentIds: number[]): Observable<unknown> {
    return this.studyPlanApi.unassignStudents(planId, { studentIds });
  }

  updatePlanItem(itemId: number, form: PlanItemFormModel): Observable<unknown> {
    return this.studyPlanApi.updateItem(itemId, buildUpdatePlanItemPayload(form));
  }

  buildCreatePlanPayload(
    halqaId: number,
    name: string,
    studentIds: number[],
    items: PlanItemFormModel[],
  ): CreateStudyPlanPayload {
    return {
      name,
      halqaId,
      studentIds: studentIds.length ? studentIds : undefined,
      studyPlanItems: items.map(buildCreatePlanItemPayload),
    };
  }

  reloadPlans(halqaId: number): Observable<StudyPlanViewModel[]> {
    return forkJoin({
      surahs: this.quranApi.getSurahs().pipe(map(buildSurahNameMap)),
      planSummaries: this.halqaApi.getStudyPlans(halqaId),
    }).pipe(
      switchMap(({ surahs, planSummaries }) => {
        if (!planSummaries.length) {
          return of([] as StudyPlanViewModel[]);
        }
        return forkJoin(
          planSummaries.map((summary) =>
            this.studyPlanApi.getDetails(Number(summary.id)).pipe(
              map((details) => mapStudyPlanDetails(details, surahs)),
            ),
          ),
        );
      }),
    );
  }

  reloadStudents(halqaId: number): Observable<HalaqaStudentViewModel[]> {
    return this.halqaApi.getById(halqaId).pipe(switchMap((record) => this.resolveRoster(halqaId, record)));
  }

  /**
   * ponytail: admin roster is GET /halqa/:id enrollments. by-halqa-id?date= is term-day
   * scoped and returns [] on Fri/off days — keep it only as fallback.
   */
  private resolveRoster(
    halqaId: number,
    record: HalqaApiRecord,
  ): Observable<HalaqaStudentViewModel[]> {
    const fromDetail = mapHalqaRoster(record);
    if (fromDetail.length) {
      return of(fromDetail);
    }
    return this.halqaApi
      .getStudentsByHalqaId(halqaId, rosterQueryDate())
      .pipe(map((records) => records.map(mapHalqaStudent)));
  }
}
