import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import { CenterApiService } from '../../core/api/center-api.service';
import { HalqaByTermItem, WeeklyAttendanceTable } from '../../core/api/models/attendance.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { AuthService } from '../../core/auth/auth.service';
import { HalqaSelectOption } from './dto/attendance-report-filters.dto';

/** Thin UI orchestration — HttpClient stays in core/api. */
@Injectable({ providedIn: 'root' })
export class AttendanceReportService {
  private readonly attendanceApi = inject(AttendanceApiService);
  private readonly centerApi = inject(CenterApiService);
  private readonly auth = inject(AuthService);

  resolveActiveTerm(): Observable<ActiveTerm | null> {
    const centerId = this.auth.getClaims()?.centerId;
    if (centerId == null) {
      return of(null);
    }
    return this.centerApi.getActiveTerm(centerId);
  }

  loadHalqaOptions(termId: number): Observable<HalqaSelectOption[]> {
    return this.attendanceApi.getHalqasByTerm(termId).pipe(
      map((list) =>
        (list ?? []).map((h: HalqaByTermItem) => ({
          id: Number(h.id),
          name: h.name,
        })),
      ),
      catchError(() => of([])),
    );
  }

  loadWeeklyTable(halqaId: number, weekStartDate: string): Observable<WeeklyAttendanceTable> {
    return this.attendanceApi.getWeeklyTable(halqaId, weekStartDate);
  }

  bootstrapHalqas(): Observable<{ term: ActiveTerm | null; halqas: HalqaSelectOption[] }> {
    return this.resolveActiveTerm().pipe(
      switchMap((term) => {
        if (!term) {
          return of({ term: null, halqas: [] as HalqaSelectOption[] });
        }
        return this.loadHalqaOptions(term.id).pipe(map((halqas) => ({ term, halqas })));
      }),
    );
  }
}
