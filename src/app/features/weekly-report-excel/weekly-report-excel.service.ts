import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { AttendanceApiService } from '../../core/api/attendance-api.service';
import { HalqaApiService } from '../../core/api/halqa-api.service';
import { HalqaApiRecord } from '../../core/api/models/halqa.model';
import { ProgressReportResponse } from '../../core/api/models/progress.model';
import { ProgressApiService } from '../../core/api/progress-api.service';
import { normalizeCenterWeeklyTable } from '../attendance-report/dto/center-weekly-table.mapper';
import { addDays } from '../attendance-report/week-date.util';
import type { WeeklyReportPercents, WeeklyReportSourceWeek } from './weekly-report-workbook';

export class WeeklyReportExportEmpty extends Error {
  constructor() {
    super('empty');
    this.name = 'WeeklyReportExportEmpty';
  }
}

export interface WeeklyReportExportRequest {
  termId: number;
  termStart: string;
  termEnd: string;
  /** Null exports every ḥalaqa in the term (center weekly table). */
  halqaId: number | null;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class WeeklyReportExcelService {
  private readonly attendanceApi = inject(AttendanceApiService);
  private readonly progressApi = inject(ProgressApiService);
  private readonly halqaApi = inject(HalqaApiService);

  /** One sheet per term week, plus «للفصل الدراسي» when the term has a date range. */
  exportWorkbook(request: WeeklyReportExportRequest): Observable<void> {
    return from(import('./weekly-report-workbook')).pipe(
      switchMap((excel) => this.exportWithBuilder(request, excel)),
    );
  }

  private exportWithBuilder(
    request: WeeklyReportExportRequest,
    excel: typeof import('./weekly-report-workbook'),
  ): Observable<void> {
    const weeks = excel.termSundayWeeks(request.termStart, request.termEnd);
    if (!weeks.length) {
      return throwError(() => new WeeklyReportExportEmpty());
    }
    return this.halqaApi.getByTerm(request.termId).pipe(
      catchError(() => of([] as HalqaApiRecord[])),
      switchMap((records) =>
        this.loadAttendance(weeks, request).pipe(
          switchMap((sourceWeeks) => {
            const halqaIds = [
              ...new Set(
                sourceWeeks.flatMap((week) => week.students.map((student) => student.halqaId)).filter((id) => id > 0),
              ),
            ];
            return this.loadProgress(halqaIds, weeks, request, excel.percentOrNull).pipe(
              switchMap((progress) =>
                from(this.write(excel, sourceWeeks, progress, teacherMap(records), request.filename)),
              ),
            );
          }),
        ),
      ),
    );
  }

  private loadAttendance(
    weeks: string[],
    request: WeeklyReportExportRequest,
  ): Observable<WeeklyReportSourceWeek[]> {
    return from(weeks).pipe(
      mergeMap(
        (weekStart) =>
          this.attendanceApi.getCenterWeeklyTable(weekStart, request.halqaId, request.termId).pipe(
            map((raw) => sourceWeek(weekStart, normalizeCenterWeeklyTable(raw))),
          ),
        4,
      ),
      toArray(),
      map((loaded) => loaded.sort((a, b) => a.weekStart.localeCompare(b.weekStart))),
    );
  }

  private loadProgress(
    halqaIds: number[],
    weeks: string[],
    request: WeeklyReportExportRequest,
    percentOrNull: (value: unknown) => number | null,
  ): Observable<WeeklyReportPercents[]> {
    const jobs: Array<{ weekStart: string | null; halqaId: number; startingDate: string; endingDate: string }> = [];
    for (const halqaId of halqaIds) {
      for (const weekStart of weeks) {
        jobs.push({
          weekStart,
          halqaId,
          startingDate: weekStart,
          endingDate: addDays(weekStart, 4),
        });
      }
      jobs.push({
        weekStart: null,
        halqaId,
        startingDate: request.termStart,
        endingDate: request.termEnd,
      });
    }
    if (!jobs.length) {
      return of([]);
    }
    return from(jobs).pipe(
      mergeMap(
        (job) =>
          this.progressApi
            .getProgressReport({
              halqaId: job.halqaId,
              period: 'week',
              startingDate: job.startingDate,
              endingDate: job.endingDate,
              termId: request.termId,
            })
            .pipe(
              map((report) => percentsFromReport(job.weekStart, job.halqaId, report, percentOrNull)),
              catchError(() => of([] as WeeklyReportPercents[])),
            ),
        4,
      ),
      toArray(),
      map((batches) => batches.flat()),
    );
  }

  private async write(
    excel: typeof import('./weekly-report-workbook'),
    weeks: WeeklyReportSourceWeek[],
    progress: WeeklyReportPercents[],
    teacherByHalqaId: Map<number, string | null>,
    filename: string,
  ): Promise<void> {
    const sheets = excel.assembleWeeklyReport({
      weeks,
      progress,
      teacherByHalqaId,
      includeTermSheet: true,
    });
    const studentCount = sheets.reduce((sum, sheet) => sum + sheet.students.length, 0);
    if (!studentCount) {
      throw new WeeklyReportExportEmpty();
    }
    const workbook = excel.buildWeeklyReportWorkbook(sheets);
    await excel.downloadWeeklyReportWorkbook(workbook, filename);
  }
}

function sourceWeek(weekStart: string, table: ReturnType<typeof normalizeCenterWeeklyTable>): WeeklyReportSourceWeek {
  const holidays = new Set(table.columns.filter((column) => column.isHoliday).map((column) => column.date.slice(0, 10)));
  return {
    weekStart,
    students: table.students.flatMap((row) => {
      const halqaId = row.halqa?.id || table.halqa?.id || 0;
      const halqaName = row.halqa?.name || table.halqa?.name || '—';
      if (!row.student?.id) {
        return [];
      }
      return [
        {
          studentId: row.student.id,
          studentName: row.student.name,
          halqaId,
          halqaName,
          days: row.days.map((day) => {
            const date = day.date.slice(0, 10);
            return {
              date,
              status: day.status ?? null,
              isHoliday: !!day.isHoliday || holidays.has(date) || day.status === 'HOLIDAY',
            };
          }),
        },
      ];
    }),
  };
}

function percentsFromReport(
  weekStart: string | null,
  halqaId: number,
  report: ProgressReportResponse,
  percentOrNull: (value: unknown) => number | null,
): WeeklyReportPercents[] {
  return (report.students ?? []).flatMap((student) => {
    const studentId = student.studentId ?? student.student?.id ?? 0;
    if (!studentId) {
      return [];
    }
    const byType = new Map(
      (student.progress ?? []).map((item) => [String(item.planItemType).toUpperCase(), item.totalPercentage]),
    );
    return [
      {
        weekStart,
        halqaId,
        studentId,
        hifz: percentOrNull(byType.has('HIFZ') ? byType.get('HIFZ') : null),
        tath: percentOrNull(byType.has('TATHBEET') ? byType.get('TATHBEET') : null),
        mur: percentOrNull(byType.has('MURAJAA') ? byType.get('MURAJAA') : null),
      },
    ];
  });
}

function teacherMap(records: HalqaApiRecord[]): Map<number, string | null> {
  const map = new Map<number, string | null>();
  for (const record of records) {
    const id = typeof record.id === 'number' ? record.id : Number(record.id);
    if (!Number.isInteger(id) || id <= 0) {
      continue;
    }
    const teacher = record.teacher ?? record.teachers?.[0] ?? null;
    const name = teacher?.name?.trim();
    map.set(id, name || null);
  }
  return map;
}
