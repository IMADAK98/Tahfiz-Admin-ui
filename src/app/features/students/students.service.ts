import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CenterApiService } from '../../core/api/center-api.service';
import { StudentRequestApiService } from '../../core/api/student-request-api.service';
import { ActiveStudent, RegistrationLinkResult } from '../../core/api/models/student.model';
import { StudentFormModel, buildCreateManualStudentPayload, validateStudentForm } from './dto';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly centerApi = inject(CenterApiService);
  private readonly studentRequestApi = inject(StudentRequestApiService);

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

  createStudent(form: StudentFormModel): Observable<void> {
    return this.studentRequestApi.createManual(buildCreateManualStudentPayload(form));
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
