import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../core/api/api-error';
import { ProgressPeriod, ProgressReportResponse } from '../../core/api/models/progress.model';
import { TranslateService } from '@ngx-translate/core';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { buildProgressReportCsv, downloadCsv } from './progress-report-csv';
import {
  ProgressReportService,
  formatDayLabelAr,
  formatMonthLabelAr,
  toYearMonth,
} from './progress-report.service';
import { HalqaSelectOption, ProgressRowVm } from './dto/progress-report-filters.dto';
import { normalizePercent } from './enums/progress-plan-item-type.enum';
import {
  addDays,
  formatWeekLabelAr,
  parseIsoDate,
  startOfWeekSunday,
  toIsoDate,
} from './week-date.util';

const MONTH_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

@Component({
  selector: 'app-progress-report',
  imports: [FormsModule, Button, InputText, Select],
  templateUrl: './progress-report.html',
  styleUrl: './progress-report.scss',
})
export class ProgressReportComponent implements OnInit {
  private readonly report = inject(ProgressReportService);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly bootstrapping = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly termName = signal<string | null>(null);
  protected readonly halqaOptions = signal<HalqaSelectOption[]>([]);
  protected readonly selectedHalqaId = signal<number | null>(null);
  protected readonly period = signal<ProgressPeriod>('week');
  /** day: YYYY-MM-DD; week: Sunday YYYY-MM-DD; month: YYYY-MM */
  protected readonly dateContext = signal(toIsoDate(startOfWeekSunday()));
  protected readonly studentQuery = signal('');
  protected readonly table = signal<ProgressReportResponse | null>(null);

  protected readonly weekLabel = computed(() => {
    if (this.period() !== 'week') {
      return '';
    }
    return formatWeekLabelAr(this.dateContext());
  });

  protected readonly rangeLabel = computed(() => {
    const p = this.period();
    const ctx = this.dateContext();
    if (p === 'day') {
      return formatDayLabelAr(ctx);
    }
    if (p === 'week') {
      return formatWeekLabelAr(ctx);
    }
    return formatMonthLabelAr(ctx);
  });

  protected readonly periodLabelAr = computed(() => {
    switch (this.period()) {
      case 'day':
        return 'يوم';
      case 'week':
        return 'أسبوع';
      case 'month':
        return 'شهر';
    }
  });

  protected readonly selectedHalqaName = computed(() => {
    const id = this.selectedHalqaId();
    return this.halqaOptions().find((h) => h.id === id)?.name ?? this.table()?.halqa?.name ?? null;
  });

  protected readonly rows = computed<ProgressRowVm[]>(() => {
    const data = this.table();
    if (!data) {
      return [];
    }
    const q = this.studentQuery().trim().toLowerCase();
    return (data.students ?? [])
      .map((s) => {
        const name = s.studentName ?? s.student?.name ?? '';
        const id = s.studentId ?? s.student?.id ?? 0;
        const byType = new Map(
          (s.progress ?? []).map((p) => [String(p.planItemType).toUpperCase(), p.totalPercentage]),
        );
        const raw = s.lastUpdatedAt ?? s.updatedAt ?? null;
        return {
          studentId: id,
          studentName: name,
          hifzPercent: normalizePercent(byType.get('HIFZ')),
          tathPercent: normalizePercent(byType.get('TATHBEET')),
          murPercent: normalizePercent(byType.get('MURAJAA')),
          lastUpdatedRaw: raw,
          lastUpdatedLabel: formatLastUpdatedAr(raw),
        };
      })
      .filter((s) => !q || s.studentName.toLowerCase().includes(q));
  });

  /**
   * Empty = no roster rows for this period (0% students still show in table).
   * Product lock: 0% ≠ no students.
   */
  protected readonly showEmpty = computed(() => {
    if (this.loading() || this.bootstrapping()) {
      return false;
    }
    if (!this.selectedHalqaId() || !this.table()) {
      return false;
    }
    return this.rows().length === 0;
  });

  protected readonly studentCountLabel = computed(() => {
    const n = this.rows().length;
    return this.translate.instant('progressReport.studentsCount', { count: n });
  });

  ngOnInit(): void {
    this.bootstrapping.set(true);
    this.report.bootstrapHalqas().subscribe({
      next: ({ term, halqas }) => {
        this.termName.set(term?.name ?? null);
        this.halqaOptions.set(halqas);
        if (halqas.length > 0) {
          this.selectedHalqaId.set(halqas[0].id);
          this.reloadTable();
        }
        this.bootstrapping.set(false);
      },
      error: (err: unknown) => {
        this.bootstrapping.set(false);
        const msg =
          err instanceof ApiError
            ? err.message
            : this.translate.instant('progressReport.loadHalqasFailed');
        this.errorMessage.set(msg);
        this.toast.notifyErrorBody(msg);
      },
    });
  }

  onHalqaChange(id: number | null): void {
    this.selectedHalqaId.set(id);
    this.reloadTable();
  }

  setPeriod(next: ProgressPeriod): void {
    if (this.period() === next) {
      return;
    }
    const prev = this.period();
    const prevCtx = this.dateContext();
    this.period.set(next);
    this.dateContext.set(migrateDateContext(prev, prevCtx, next));
    this.reloadTable();
  }

  prevWeek(): void {
    this.dateContext.set(addDays(this.dateContext(), -7));
    this.reloadTable();
  }

  nextWeek(): void {
    this.dateContext.set(addDays(this.dateContext(), 7));
    this.reloadTable();
  }

  onDayChange(value: string): void {
    if (!value) {
      return;
    }
    this.dateContext.set(value);
    this.reloadTable();
  }

  onMonthChange(value: string): void {
    if (!value) {
      return;
    }
    this.dateContext.set(value);
    this.reloadTable();
  }

  onStudentQuery(value: string): void {
    this.studentQuery.set(value);
  }

  exportCsv(): void {
    const dataRows = this.rows();
    if (!dataRows.length) {
      this.toast.notifyWarnBody(this.translate.instant('progressReport.exportEmpty'));
      return;
    }
    const csv = buildProgressReportCsv(dataRows, {
      halqaName: this.selectedHalqaName() ?? undefined,
      periodLabel: this.periodLabelAr(),
      rangeLabel: this.rangeLabel(),
    });
    const halqa = (this.selectedHalqaName() ?? 'halqa').replace(/\s+/g, '-');
    downloadCsv(`progress-${halqa}-${this.period()}-${this.dateContext()}.csv`, csv);
    this.toast.show('success', this.translate.instant('progressReport.exportOk'));
  }

  private reloadTable(): void {
    const halqaId = this.selectedHalqaId();
    if (halqaId == null) {
      this.table.set(null);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.report.loadProgress(halqaId, this.period(), this.dateContext()).subscribe({
      next: (data) => {
        this.table.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.table.set(null);
        const msg =
          err instanceof ApiError
            ? err.message
            : this.translate.instant('progressReport.loadTableFailed');
        this.errorMessage.set(msg);
        this.toast.notifyErrorBody(msg);
      },
    });
  }
}

function migrateDateContext(
  from: ProgressPeriod,
  ctx: string,
  to: ProgressPeriod,
): string {
  let anchor: Date;
  if (from === 'month') {
    const [y, m] = ctx.split('-').map(Number);
    anchor = new Date(y, (m ?? 1) - 1, 1);
  } else {
    anchor = parseIsoDate(ctx);
  }
  if (to === 'day') {
    return toIsoDate(anchor);
  }
  if (to === 'week') {
    return toIsoDate(startOfWeekSunday(anchor));
  }
  return toYearMonth(anchor);
}

/** ASSUMED lastUpdated formatting — ISO date or datetime → Arabic day label. */
function formatLastUpdatedAr(raw: string | null | undefined): string {
  if (!raw) {
    return '—';
  }
  const iso = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return raw;
  }
  const d = parseIsoDate(iso);
  return `${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
}
