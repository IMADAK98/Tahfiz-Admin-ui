import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { map } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { TranslateService } from '@ngx-translate/core';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { ReportTermPickerComponent } from '../report-term/report-term-picker';
import { REPORT_TERM_QUERY_PARAM, ReportTermSelection } from '../report-term/dto/report-term.dto';
import { isCompletedTerm } from '../report-term/enums/report-term-status-label';
import {
  attendanceAllLabel,
  attendanceHalqaAfterTermChange,
  attendanceWeekForTerm,
  explicitTermFailureMessage,
  parseReportTermQuery,
  pickerTerms,
  reportTermBlockedReason,
  resolveReportTerm,
  selectedTerm,
  termHeading,
  termStatusLabel,
} from '../report-term/report-term-context';
import { ReportTermService } from '../report-term/report-term.service';
import { buildAttendanceWeeklyCsv, downloadCsv } from './attendance-report-csv';
import { AttendanceReportService } from './attendance-report.service';
import {
  ALL_ACTIVE_HALAQAT,
  AttendanceDayHeaderVm,
  AttendanceRowVm,
  HalqaFilterOption,
} from './dto/attendance-report-filters.dto';
import { CenterWeeklyTable, formatStudentCountAr, withAllActiveHalqaOption } from './dto/center-weekly-table.mapper';
import { isMarkedAttendanceStatus, mapAttendanceStatus } from './enums/attendance-status.enum';
import {
  addDays,
  dayOfMonthFromIso,
  dowArFromIso,
  formatWeekLabelAr,
  startOfWeekSunday,
  toIsoDate,
} from './week-date.util';

@Component({
  selector: 'app-attendance-report',
  imports: [ReactiveFormsModule, Button, InputText, Select, ReportTermPickerComponent],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.scss',
})
export class AttendanceReportComponent {
  private readonly report = inject(AttendanceReportService);
  private readonly terms = inject(ReportTermService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private loadGeneration = 0;
  private termApplyGeneration = 0;
  private appliedTermId: number | undefined;

  protected readonly loading = signal(false);
  protected readonly halqaFilterReady = signal(false);
  protected readonly filterError = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly blockedReason = signal<string | null>(null);
  protected readonly termHeading = signal<string | null>(null);
  protected readonly termReadOnly = signal(false);
  protected readonly termOptions = signal<ReturnType<typeof pickerTerms>>([]);
  protected readonly selectedTermId = signal<number | null>(null);
  protected readonly selection = signal<ReportTermSelection>({ state: 'no-active' });
  protected readonly halqaOptions = signal<HalqaFilterOption[]>(withAllActiveHalqaOption([]));
  protected readonly termHalqaIds = signal<number[]>([]);
  protected readonly selectedHalqaValue = signal(ALL_ACTIVE_HALAQAT);
  protected readonly weekStartDate = signal(toIsoDate(startOfWeekSunday()));
  protected readonly studentQuery = signal('');
  protected readonly table = signal<CenterWeeklyTable | null>(null);
  protected readonly tableTermId = signal<number | null>(null);
  protected readonly halqaControl = new FormControl(ALL_ACTIVE_HALAQAT, { nonNullable: true });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.halqaControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.onHalqaChange(value));
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((query) => this.studentQuery.set(query));
    this.terms
      .changes(
        this.route.queryParamMap.pipe(
          map((params) => parseReportTermQuery(params.get(REPORT_TERM_QUERY_PARAM))),
        ),
      )
      .pipe(takeUntilDestroyed())
      .subscribe((catalog) =>
        this.applyTerm(this.route.snapshot.queryParamMap.get(REPORT_TERM_QUERY_PARAM), catalog),
      );
  }

  protected readonly listFailed = computed(() => {
    const state = this.selection().state;
    return state === 'list-failed' || state === 'explicit-unresolved';
  });

  protected readonly weekLabel = computed(() => formatWeekLabelAr(this.weekStartDate()));

  protected readonly scopeLabel = computed(() => {
    const value = this.selectedHalqaValue();
    if (value === ALL_ACTIVE_HALAQAT) {
      return attendanceAllLabel(selectedTerm(this.selection()));
    }
    return this.halqaOptions().find((option) => option.value === value)?.name ?? attendanceAllLabel(selectedTerm(this.selection()));
  });

  protected readonly dayHeaders = computed<AttendanceDayHeaderVm[]>(() => {
    const cols = this.table()?.columns ?? [];
    return cols.map((column) => ({
      date: column.date,
      dayOfWeekEn: column.dayOfWeek,
      dowAr: dowArFromIso(column.date),
      dayOfMonth: dayOfMonthFromIso(column.date),
      isHoliday: !!column.isHoliday,
      holidayHint: column.isHoliday ? 'عطلة' : null,
    }));
  });

  protected readonly allRows = computed<AttendanceRowVm[]>(() => {
    const termId = selectedTerm(this.selection())?.id ?? null;
    if (this.tableTermId() !== termId) {
      return [];
    }
    return this.toRows(this.table());
  });

  protected readonly rows = computed<AttendanceRowVm[]>(() => {
    const query = this.studentQuery().trim().toLowerCase();
    const all = this.allRows();
    if (!query) {
      return all;
    }
    return all.filter((row) => row.studentName.toLowerCase().includes(query));
  });

  /** Rows exist, but every visible cell is still unmarked. */
  protected readonly showEmptyMarks = computed(() => {
    if (this.loading() || !this.table() || !this.rows().length) {
      return false;
    }
    return !this.rows().some((row) => row.cells.some((cell) => isMarkedAttendanceStatus(cell.statusRaw)));
  });

  protected readonly studentCountLabel = computed(() => formatStudentCountAr(this.rows().length));

  protected readonly showNoSearchHits = computed(() => {
    return (
      !this.loading() &&
      !this.blockedReason() &&
      !!this.table() &&
      !this.errorMessage() &&
      !!this.studentQuery().trim() &&
      this.allRows().length > 0 &&
      this.rows().length === 0
    );
  });

  protected readonly showNoActiveHalqas = computed(() => {
    return (
      this.halqaFilterReady() &&
      !this.loading() &&
      !this.blockedReason() &&
      !this.filterError() &&
      !this.errorMessage() &&
      !!this.table() &&
      this.termHalqaIds().length === 0 &&
      this.allRows().length === 0 &&
      !this.studentQuery().trim()
    );
  });

  protected readonly showNoStudents = computed(() => {
    return (
      this.halqaFilterReady() &&
      !this.loading() &&
      !this.blockedReason() &&
      !this.errorMessage() &&
      !!this.table() &&
      this.termHalqaIds().length > 0 &&
      this.allRows().length === 0 &&
      !this.studentQuery().trim()
    );
  });

  retryTermList(): void {
    this.terms.retryList();
  }

  onTermSelected(termId: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [REPORT_TERM_QUERY_PARAM]: String(termId) },
      queryParamsHandling: 'merge',
    });
  }

  onHalqaChange(value: string): void {
    this.selectedHalqaValue.set(value);
    this.reloadTable();
  }

  prevWeek(): void {
    this.weekStartDate.set(addDays(this.weekStartDate(), -7));
    this.reloadTable();
  }

  nextWeek(): void {
    this.weekStartDate.set(addDays(this.weekStartDate(), 7));
    this.reloadTable();
  }

  exportCsv(): void {
    const term = selectedTerm(this.selection());
    const headers = this.dayHeaders();
    const dataRows = this.rows();
    if (!term || this.tableTermId() !== term.id || !headers.length || !dataRows.length) {
      this.toast.notifyWarnBody(this.translate.instant('attendanceReport.exportEmpty'));
      return;
    }
    const csv = buildAttendanceWeeklyCsv(headers, dataRows, {
      halqaName: this.scopeLabel(),
      weekLabel: this.weekLabel(),
      termName: term.name,
      termStatusLabel: termStatusLabel(term) ?? undefined,
      termStart: term.startDate,
      termEnd: term.endDate,
    });
    const slug =
      this.selectedHalqaValue() === ALL_ACTIVE_HALAQAT
        ? 'all-in-term'
        : this.scopeLabel().replace(/\s+/g, '-');
    downloadCsv(`attendance-${slug}-${this.weekStartDate()}-term-${term.id}.csv`, csv);
    this.toast.show('success', this.translate.instant('attendanceReport.exportOk'));
  }

  private applyTerm(raw: string | null, catalog: Parameters<typeof resolveReportTerm>[1]): void {
    const selection = resolveReportTerm(parseReportTermQuery(raw), catalog);
    const term = selectedTerm(selection);
    this.selection.set(selection);
    this.termOptions.set(pickerTerms(catalog));
    this.selectedTermId.set(term?.id ?? null);
    this.termHeading.set(termHeading(term));
    this.termReadOnly.set(isCompletedTerm(term?.status));
    this.blockedReason.set(reportTermBlockedReason(selection, catalog.listErrorMessage));
    if (this.syncTermUrl(raw, selection)) {
      return;
    }
    if (!term) {
      this.clearReport();
      return;
    }
    if (this.appliedTermId !== term.id) {
      const nextWeek = attendanceWeekForTerm(this.weekStartDate(), term);
      if (nextWeek !== this.weekStartDate()) {
        this.weekStartDate.set(nextWeek);
      }
    }
    const generation = ++this.termApplyGeneration;
    this.appliedTermId = term.id;
    this.halqaFilterReady.set(false);
    this.filterError.set(null);
    this.errorMessage.set(null);
    this.report.loadHalqaFilterOptions(term.id, attendanceAllLabel(term)).subscribe({
      next: (options) => {
        if (generation !== this.termApplyGeneration) {
          return;
        }
        const ids = options.flatMap((option) => {
          const id = Number(option.value);
          return option.value !== ALL_ACTIVE_HALAQAT && Number.isInteger(id) ? [id] : [];
        });
        this.halqaOptions.set(options);
        this.termHalqaIds.set(ids);
        const next = attendanceHalqaAfterTermChange(this.selectedHalqaValue(), ids);
        this.halqaControl.setValue(next, { emitEvent: false });
        this.selectedHalqaValue.set(next);
        this.halqaFilterReady.set(true);
        this.reloadTable();
      },
      error: (err: unknown) => {
        if (generation !== this.termApplyGeneration) {
          return;
        }
        this.halqaFilterReady.set(true);
        this.halqaOptions.set(withAllActiveHalqaOption([], attendanceAllLabel(term)));
        this.termHalqaIds.set([]);
        this.table.set(null);
        this.tableTermId.set(null);
        this.loading.set(false);
        const detail = err instanceof ApiError ? err.message : 'تعذر تحميل الحلقات';
        const message = explicitTermFailureMessage(selection, detail);
        this.filterError.set(message);
        this.toast.notifyErrorBody(message);
      },
    });
  }

  private syncTermUrl(raw: string | null, selection: ReportTermSelection): boolean {
    const term = selectedTerm(selection);
    if (!term) {
      return false;
    }
    const next = String(term.id);
    if (raw === next) {
      return false;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [REPORT_TERM_QUERY_PARAM]: next },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    return true;
  }

  private clearReport(): void {
    this.table.set(null);
    this.tableTermId.set(null);
    this.halqaOptions.set(withAllActiveHalqaOption([]));
    this.termHalqaIds.set([]);
    this.halqaControl.setValue(ALL_ACTIVE_HALAQAT, { emitEvent: false });
    this.selectedHalqaValue.set(ALL_ACTIVE_HALAQAT);
    this.loading.set(false);
    this.halqaFilterReady.set(true);
    this.errorMessage.set(null);
    this.filterError.set(null);
  }

  private reloadTable(): void {
    const selection = this.selection();
    const term = selectedTerm(selection);
    if (!term) {
      this.table.set(null);
      this.tableTermId.set(null);
      this.loading.set(false);
      return;
    }
    const generation = ++this.loadGeneration;
    const termId = term.id;
    const weekStartDate = this.weekStartDate();
    const halqaValue = this.selectedHalqaValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.report.loadCenterWeeklyTable(weekStartDate, halqaValue, termId).subscribe({
      next: (data) => {
        if (generation !== this.loadGeneration || selectedTerm(this.selection())?.id !== termId) {
          return;
        }
        this.table.set(data);
        this.tableTermId.set(termId);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.loading.set(false);
        this.table.set(null);
        this.tableTermId.set(null);
        const detail = err instanceof ApiError ? err.message : 'تعذر تحميل جدول الحضور';
        const message = explicitTermFailureMessage(this.selection(), detail);
        this.errorMessage.set(message);
        this.toast.notifyErrorBody(message);
      },
    });
  }

  private toRows(data: CenterWeeklyTable | null): AttendanceRowVm[] {
    if (!data) {
      return [];
    }
    const headers = this.dayHeaders();
    return data.students.map((studentRow, index) => {
      const byDate = new Map(studentRow.days.map((day) => [day.date, day]));
      const cells = headers.map((header) => {
        const cell = byDate.get(header.date);
        const status = cell?.status ?? 'NOT_MARKED';
        const holiday = header.isHoliday || !!cell?.isHoliday || status === 'HOLIDAY';
        const view = mapAttendanceStatus(status, holiday);
        return {
          date: header.date,
          statusRaw: status,
          viewKind: view.kind,
          label: view.label,
          chipClass: view.chipClass,
          isHoliday: holiday,
        };
      });
      const halqaId = studentRow.halqa?.id || null;
      return {
        trackId: `${halqaId ?? 0}-${studentRow.student.id}-${index}`,
        studentId: studentRow.student.id,
        studentName: studentRow.student.name,
        halqaId,
        halqaName: studentRow.halqa?.name || null,
        cells,
      };
    });
  }
}
