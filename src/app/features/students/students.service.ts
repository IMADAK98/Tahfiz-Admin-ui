import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CenterApiService } from '../../core/api/center-api.service';
import { HalqaApiService } from '../../core/api/halqa-api.service';
import { StudentRequestApiService } from '../../core/api/student-request-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ActiveHalqaOption, selectableActiveHalqas } from '../../core/api/models/halqa.model';
import {
  ActiveStudent,
  CreatedManualStudent,
  findStudentIdByEmail,
  mergeCreatedWithForm,
  RegistrationLinkResult,
} from '../../core/api/models/student.model';
import { StudentFormModel, buildCreateManualStudentPayload, validateStudentForm } from './dto';

export interface AssignableHalqasResult {
  all: ActiveHalqaOption[];
  selectable: ActiveHalqaOption[];
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly centerApi = inject(CenterApiService);
  private readonly studentRequestApi = inject(StudentRequestApiService);
  private readonly halqaApi = inject(HalqaApiService);
  private readonly auth = inject(AuthService);

  /** GET /center/{id}/active-students — map Nest `halqa`; missing until Render → unassigned. */
  loadActiveStudents(centerId: number, search = ''): Observable<ActiveStudent[]> {
    return this.centerApi.getActiveStudents(centerId, {
      page: 1,
      limit: 100,
      search: search.trim() || undefined,
    });
  }

  validate(form: StudentFormModel): Record<string, string> {
    return validateStudentForm(form);
  }

  createStudent(form: StudentFormModel): Observable<CreatedManualStudent> {
    return this.studentRequestApi
      .createManual(buildCreateManualStudentPayload(form))
      .pipe(map((created) => mergeCreatedWithForm(created, form)));
  }

  /** Prefer create `data.id`; email-match available then active students only if missing. */
  resolveCreatedStudentId(created: CreatedManualStudent): Observable<CreatedManualStudent> {
    if (created.id && created.id > 0) {
      return of(created);
    }
    const email = created.email?.trim();
    const centerId = this.auth.getClaims()?.centerId;
    if (!email || !centerId) {
      return of(created);
    }
    return this.lookupStudentIdByEmail(centerId, email).pipe(
      map((id) => (id ? { ...created, id } : created)),
    );
  }

  private lookupStudentIdByEmail(centerId: number, email: string): Observable<number | null> {
    return this.centerApi.getAvailableStudents(centerId).pipe(
      switchMap((available) => {
        const fromAvailable = findStudentIdByEmail(available, email);
        if (fromAvailable) {
          return of(fromAvailable);
        }
        return this.centerApi
          .getActiveStudents(centerId, { limit: 100 })
          .pipe(map((active) => findStudentIdByEmail(active, email)));
      }),
    );
  }

  loadAssignableHalqas(centerId: number): Observable<AssignableHalqasResult> {
    return this.centerApi
      .getActiveHalqas(centerId)
      .pipe(map((all) => ({ all, selectable: selectableActiveHalqas(all) })));
  }

  enrollStudent(halqaId: number, studentId: number): Observable<unknown> {
    return this.halqaApi.enrollStudents(halqaId, { studentsIds: [studentId] });
  }

  generateRegistrationLink(centerId: number): Observable<RegistrationLinkResult> {
    return this.centerApi.generateRegistrationLink(centerId);
  }

  /** ponytail: client filter on the loaded page (limit 100). Upgrade: debounce GET ?search=. */
  filterStudents(students: ActiveStudent[], search: string): ActiveStudent[] {
    const query = search.trim().toLowerCase();
    if (!query) {
      return students;
    }
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        (student.email ?? '').toLowerCase().includes(query) ||
        (student.phone ?? '').toLowerCase().includes(query),
    );
  }
}
