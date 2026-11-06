import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../core/api/api-error';
import { TranslateService } from '@ngx-translate/core';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { buildAttendanceWeeklyCsv, downloadCsv } from './attendance-report-csv';
import { AttendanceReportService } from './attendance-report.service';
import {
  ALL_ACTIVE_HALAQAT,
  ALL_ACTIVE_HALAQAT_LABEL,
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
  imports: [ReactiveFormsModule, Button, InputText, Select],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.scss',
})
export class AttendanceReportComponent implements OnInit {
  private readonly report = inject(AttendanceReportService);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private loadGeneration = 0;

  protected readonly loading = signal(false);
  protected readonly halqaFilterReady = signal(false);
  protected readonly filterError = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly halqaOptions = signal<HalqaFilterOption[]>(withAllActiveHalqaOption([]));
  protected readonly selectedHalqaValue = signal(ALL_ACTIVE_HALAQAT);
  protected readonly weekStartDate = signal(toIsoDate(startOfWeekSunday()));
  protected readonly studentQuery = signal('');
  protected readonly table = signal<CenterWeeklyTable | null>(null);
  protected readonly halqaControl = new FormControl(ALL_ACTIVE_HALAQAT, { nonNullable: true });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.halqaControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.onHalqaChange(value));
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((query) => this.studentQuery.set(query));
  }

  protected readonly weekLabel = computed(() => formatWeekLabelAr(this.weekStartDate()));

  protected readonly scopeLabel = computed(() => {
    const value = this.selectedHalqaValue();
    if (value === ALL_ACTIVE_HALAQAT) {
      return ALL_ACTIVE_HALAQAT_LABEL;
    }
    return this.halqaOptions().find((option) => option.value === value)?.name ?? ALL_ACTIVE_HALAQAT_LABEL;
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

  protected readonly allRows = computed<AttendanceRowVm[]>(() => this.toRows(this.table()));

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
      !this.filterError() &&
      !this.errorMessage() &&
      !!this.table() &&
      this.halqaOptions().length <= 1 &&
      this.allRows().length === 0 &&
      !this.studentQuery().trim()
    );
  });

  protected readonly showNoStudents = computed(() => {
    return (
      this.halqaFilterReady() &&
      !this.loading() &&
      !this.errorMessage() &&
      !!this.table() &&
      this.halqaOptions().length > 1 &&
      this.allRows().length === 0 &&
      !this.studentQuery().trim()
    );
  });

  ngOnInit(): void {
    this.reloadTable();
    this.report.loadHalqaFilterOptions().subscribe({
      next: (options) => {
        this.halqaOptions.set(options);
        this.halqaFilterReady.set(true);
        const selected = this.selectedHalqaValue();
        if (!options.some((option) => option.value === selected)) {
          this.halqaControl.setValue(ALL_ACTIVE_HALAQAT);
        }
      },
      error: (err: unknown) => {
        this.halqaFilterReady.set(true);
        const msg = err instanceof ApiError ? err.message : 'تعذر تحميل الحلقات';
        this.filterError.set(msg);
        this.toast.notifyErrorBody(msg);
      },
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
    const headers = this.dayHeaders();
    const dataRows = this.rows();
    if (!headers.length || !dataRows.length) {
      this.toast.notifyWarnBody(this.translate.instant('attendanceReport.exportEmpty'));
      return;
    }
    const csv = buildAttendanceWeeklyCsv(headers, dataRows, {
      halqaName: this.scopeLabel(),
      weekLabel: this.weekLabel(),
    });
    const slug =
      this.selectedHalqaValue() === ALL_ACTIVE_HALAQAT
        ? 'all-active'
        : this.scopeLabel().replace(/\s+/g, '-');
    downloadCsv(`attendance-${slug}-${this.weekStartDate()}.csv`, csv);
    this.toast.show('success', this.translate.instant('attendanceReport.exportOk'));
  }

  private reloadTable(): void {
    const generation = ++this.loadGeneration;
    const weekStartDate = this.weekStartDate();
    const halqaValue = this.selectedHalqaValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.report.loadCenterWeeklyTable(weekStartDate, halqaValue).subscribe({
      next: (data) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.table.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        this.loading.set(false);
        this.table.set(null);
        const msg = err instanceof ApiError ? err.message : 'تعذر تحميل جدول الحضور';
        this.errorMessage.set(msg);
        this.toast.notifyErrorBody(msg);
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
