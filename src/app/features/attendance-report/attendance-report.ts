import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../core/api/api-error';
import { WeeklyAttendanceTable } from '../../core/api/models/attendance.model';
import { TranslateService } from '@ngx-translate/core';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { buildAttendanceWeeklyCsv, downloadCsv } from './attendance-report-csv';
import { AttendanceReportService } from './attendance-report.service';
import {
  AttendanceDayHeaderVm,
  AttendanceRowVm,
  HalqaSelectOption,
} from './dto/attendance-report-filters.dto';
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

  protected readonly loading = signal(false);
  protected readonly bootstrapping = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly termName = signal<string | null>(null);
  protected readonly halqaOptions = signal<HalqaSelectOption[]>([]);
  protected readonly selectedHalqaId = signal<number | null>(null);
  protected readonly weekStartDate = signal(toIsoDate(startOfWeekSunday()));
  protected readonly studentQuery = signal('');
  protected readonly table = signal<WeeklyAttendanceTable | null>(null);
  protected readonly halqaControl = new FormControl<number | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.halqaControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => this.onHalqaChange(id));
    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((query) => this.studentQuery.set(query));
  }

  protected readonly weekLabel = computed(() => formatWeekLabelAr(this.weekStartDate()));

  protected readonly selectedHalqaName = computed(() => {
    const id = this.selectedHalqaId();
    return this.halqaOptions().find((h) => h.id === id)?.name ?? this.table()?.halqa?.name ?? null;
  });

  protected readonly dayHeaders = computed<AttendanceDayHeaderVm[]>(() => {
    const cols = this.table()?.columns ?? [];
    return cols.map((c) => ({
      date: c.date,
      dayOfWeekEn: c.dayOfWeek,
      dowAr: dowArFromIso(c.date),
      dayOfMonth: dayOfMonthFromIso(c.date),
      isHoliday: !!c.isHoliday,
      holidayHint: c.isHoliday ? 'عطلة' : null,
    }));
  });

  protected readonly rows = computed<AttendanceRowVm[]>(() => {
    const data = this.table();
    if (!data) {
      return [];
    }
    const q = this.studentQuery().trim().toLowerCase();
    const headers = this.dayHeaders();
    return data.students
      .filter((s) => !q || (s.student?.name ?? '').toLowerCase().includes(q))
      .map((s) => {
        const byDate = new Map((s.days ?? []).map((d) => [d.date, d]));
        const cells = headers.map((h) => {
          const cell = byDate.get(h.date);
          const status = cell?.status ?? 'NOT_MARKED';
          const holiday = h.isHoliday || !!cell?.isHoliday || status === 'HOLIDAY';
          const view = mapAttendanceStatus(status, holiday);
          return {
            date: h.date,
            statusRaw: status,
            viewKind: view.kind,
            label: view.label,
            chipClass: view.chipClass,
            isHoliday: holiday,
          };
        });
        return {
          studentId: s.student.id,
          studentName: s.student.name,
          cells,
        };
      });
  });

  /** Empty = no marks yet (roster may still exist). */
  protected readonly showEmptyMarks = computed(() => {
    if (this.loading() || this.bootstrapping()) {
      return false;
    }
    if (!this.selectedHalqaId() || !this.table()) {
      return false;
    }
    const allCells = this.rows().flatMap((r) => r.cells);
    if (allCells.length === 0) {
      return true;
    }
    return !allCells.some((c) => isMarkedAttendanceStatus(c.statusRaw));
  });

  protected readonly studentCountLabel = computed(() => `${this.rows().length} طالب`);

  ngOnInit(): void {
    this.bootstrapping.set(true);
    this.report.bootstrapHalqas().subscribe({
      next: ({ term, halqas }) => {
        this.termName.set(term?.name ?? null);
        this.halqaOptions.set(halqas);
        if (halqas.length > 0) {
          this.halqaControl.setValue(halqas[0].id);
        }
        this.bootstrapping.set(false);
      },
      error: (err: unknown) => {
        this.bootstrapping.set(false);
        const msg = err instanceof ApiError ? err.message : 'تعذر تحميل الحلقات';
        this.errorMessage.set(msg);
        this.toast.notifyErrorBody(msg);
      },
    });
  }

  onHalqaChange(id: number | null): void {
    this.selectedHalqaId.set(id);
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
    if (!headers.length) {
      this.toast.notifyWarnBody(this.translate.instant('attendanceReport.exportEmpty'));
      return;
    }
    const csv = buildAttendanceWeeklyCsv(headers, dataRows, {
      halqaName: this.selectedHalqaName() ?? undefined,
      weekLabel: this.weekLabel(),
    });
    const halqa = (this.selectedHalqaName() ?? 'halqa').replace(/\s+/g, '-');
    downloadCsv(`attendance-${halqa}-${this.weekStartDate()}.csv`, csv);
    this.toast.show('success', this.translate.instant('attendanceReport.exportOk'));
  }

  private reloadTable(): void {
    const halqaId = this.selectedHalqaId();
    if (halqaId == null) {
      this.table.set(null);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.report.loadWeeklyTable(halqaId, this.weekStartDate()).subscribe({
      next: (data) => {
        this.table.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.table.set(null);
        const msg = err instanceof ApiError ? err.message : 'تعذر تحميل جدول الحضور';
        this.errorMessage.set(msg);
        this.toast.notifyErrorBody(msg);
      },
    });
  }
}
