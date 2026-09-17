import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ProgressApiService } from '../../core/api/progress-api.service';
import { CenterApiService } from '../../core/api/center-api.service';
import {
  HalqaByTermItem,
  ProgressPeriod,
  ProgressReportResponse,
} from '../../core/api/models/progress.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import { AuthService } from '../../core/auth/auth.service';
import { HalqaSelectOption } from './dto/progress-report-filters.dto';
import { addDays, parseIsoDate, toIsoDate } from './week-date.util';

/** Thin UI orchestration — HttpClient stays in core/api. */
@Injectable({ providedIn: 'root' })
export class ProgressReportService {
  private readonly progressApi = inject(ProgressApiService);
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
    return this.progressApi.getHalqasByTerm(termId).pipe(
      map((list) =>
        (list ?? []).map((h: HalqaByTermItem) => ({
          id: Number(h.id),
          name: h.name,
        })),
      ),
      catchError(() => of([])),
    );
  }

  /**
   * Resolve startingDate/endingDate for Nest from UI period context.
   * Week = Sunday → Thursday (attendance work week).
   * Month context is YYYY-MM.
   */
  resolveRange(
    period: ProgressPeriod,
    dateContext: string,
  ): { startingDate: string; endingDate: string } {
    if (period === 'day') {
      return { startingDate: dateContext, endingDate: dateContext };
    }
    if (period === 'week') {
      return { startingDate: dateContext, endingDate: addDays(dateContext, 4) };
    }
    // month: YYYY-MM
    const [yStr, mStr] = dateContext.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { startingDate: toIsoDate(start), endingDate: toIsoDate(end) };
  }

  loadProgress(
    halqaId: number,
    period: ProgressPeriod,
    dateContext: string,
  ): Observable<ProgressReportResponse> {
    const range = this.resolveRange(period, dateContext);
    return this.progressApi.getProgressReport({
      halqaId,
      period,
      startingDate: range.startingDate,
      endingDate: range.endingDate,
    });
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

/** Month input value YYYY-MM from a Date. */
export function toYearMonth(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatDayLabelAr(iso: string): string {
  const d = parseIsoDate(iso);
  const MONTH_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  return `${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthLabelAr(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  const MONTH_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const mi = Number(mStr) - 1;
  return `${MONTH_AR[mi] ?? mStr} ${yStr}`;
}
