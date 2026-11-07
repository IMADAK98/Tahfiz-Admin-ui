import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DateFieldComponent } from '../../core/ui/date-field/date-field';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { map } from 'rxjs/operators';
import { ApiError } from '../../core/api/api-error';
import { ProgressPeriod, ProgressReportResponse } from '../../core/api/models/progress.model';
import { TranslateService } from '@ngx-translate/core';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { ReportTermPickerComponent } from '../report-term/report-term-picker';
import { REPORT_TERM_QUERY_PARAM, ReportTermSelection } from '../report-term/dto/report-term.dto';
import { isCompletedTerm } from '../report-term/enums/report-term-status-label';
import {
  explicitTermFailureMessage,
  parseReportTermQuery,
  pickerTerms,
  progressDateForTerm,
  progressHalqaAfterTermChange,
  reportTermBlockedReason,
  resolveReportTerm,
  selectedTerm,
  termHeading,
  termStatusLabel,
} from '../report-term/report-term-context';
import { ReportTermService } from '../report-term/report-term.service';
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
  imports: [ReactiveFormsModule, Button, InputText, Select, DateFieldComponent, ReportTermPickerComponent],
  templateUrl: './progress-report.html',
  styleUrl: './progress-report.scss',
})
export class ProgressReportComponent {
  private readonly report = inject(ProgressReportService);
  private readonly terms = inject(ReportTermService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private loadGeneration = 0;
  private termApplyGeneration = 0;
  private appliedTermId: number | undefined;

  protected readonly loading = signal(false);
  protected readonly bootstrapping = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly blockedReason = signal<string | null>(null);
  protected readonly termHeading = signal<string | null>(null);
  protected readonly termReadOnly = signal(false);
  protected readonly termOptions = signal<ReturnType<typeof pickerTerms>>([]);
  protected readonly selectedTermId = signal<number | null>(null);
  protected readonly selection = signal<ReportTermSelection>({ state: 'no-active' });
  protected readonly halqaOptions = signal<HalqaSelectOption[]>([]);
  protected readonly selectedHalqaId = signal<number | null>(null);
  protected readonly period = signal<ProgressPeriod>('week');
  /** day: YYYY-MM-DD; week: Sunday YYYY-MM-DD; month: YYYY-MM */
  protected readonly dateContext = signal(toIsoDate(startOfWeekSunday()));
  protected readonly studentQuery = signal('');
  protected readonly table = signal<ProgressReportResponse | null>(null);
  protected readonly tableTermId = signal<number | null>(null);
  protected readonly halqaControl = new FormControl<number | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly dateControl = new FormControl(toIsoDate(startOfWeekSunday()), {
    nonNullable: true,
  });

  constructor() {
    this.halqaControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onHalqaChange(id));
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((query) => this.studentQuery.set(query));
    this.dateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (!value) {
        return;
      }
      this.dateContext.set(value);
      this.reloadTable();
    });
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
    const termId = selectedTerm(this.selection())?.id ?? null;
    if (this.tableTermId() !== termId) {
      return [];
    }
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
  protected readonly listFailed = computed(() => {
    const state = this.selection().state;
    return state === 'list-failed' || state === 'explicit-unresolved';
  });

  protected readonly showEmpty = computed(() => {
    if (this.loading() || this.bootstrapping() || this.blockedReason()) {
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
    const migrated = migrateDateContext(prev, prevCtx, next);
    const term = selectedTerm(this.selection());
    const nextContext = term ? progressDateForTerm(next, migrated, term) : migrated;
    this.dateContext.set(nextContext);
    this.dateControl.setValue(nextContext, { emitEvent: false });
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

  exportCsv(): void {
    const term = selectedTerm(this.selection());
    const dataRows = this.rows();
    if (!term || this.tableTermId() !== term.id || !dataRows.length) {
      this.toast.notifyWarnBody(this.translate.instant('progressReport.exportEmpty'));
      return;
    }
    const csv = buildProgressReportCsv(dataRows, {
      halqaName: this.selectedHalqaName() ?? undefined,
      periodLabel: this.periodLabelAr(),
      rangeLabel: this.rangeLabel(),
      termName: term.name,
      termStatusLabel: termStatusLabel(term) ?? undefined,
      termStart: term.startDate,
      termEnd: term.endDate,
    });
    const halqa = (this.selectedHalqaName() ?? 'halqa').replace(/\s+/g, '-');
    downloadCsv(`progress-${halqa}-${this.period()}-${this.dateContext()}-term-${term.id}.csv`, csv);
    this.toast.show('success', this.translate.instant('progressReport.exportOk'));
  }

  private applyTerm(
    raw: string | null,
    catalog: Parameters<typeof resolveReportTerm>[1],
  ): void {
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
    const sameTerm = this.appliedTermId === term.id;
    if (!sameTerm) {
      const nextDate = progressDateForTerm(this.period(), this.dateContext(), term);
      if (nextDate !== this.dateContext()) {
        this.dateContext.set(nextDate);
        if (this.period() !== 'week') {
          this.dateControl.setValue(nextDate, { emitEvent: false });
        }
      }
    }
    const generation = ++this.termApplyGeneration;
    const pickFirst = this.appliedTermId === undefined;
    this.appliedTermId = term.id;
    this.bootstrapping.set(true);
    this.errorMessage.set(null);
    this.report.loadHalqaOptions(term.id).subscribe({
      next: (halqas) => {
        if (generation !== this.termApplyGeneration) {
          return;
        }
        this.halqaOptions.set(halqas);
        const nextId = progressHalqaAfterTermChange(
          this.selectedHalqaId(),
          halqas.map((halqa) => halqa.id),
          pickFirst,
        );
        this.bootstrapping.set(false);
        this.halqaControl.setValue(nextId, { emitEvent: false });
        this.selectedHalqaId.set(nextId);
        this.reloadTable();
      },
      error: (err: unknown) => {
        if (generation !== this.termApplyGeneration) {
          return;
        }
        this.bootstrapping.set(false);
        this.halqaOptions.set([]);
        this.halqaControl.setValue(null, { emitEvent: false });
        this.selectedHalqaId.set(null);
        this.table.set(null);
        this.tableTermId.set(null);
        this.loading.set(false);
        const detail =
          err instanceof ApiError
            ? err.message
            : this.translate.instant('progressReport.loadHalqasFailed');
        const message = explicitTermFailureMessage(selection, detail);
        this.errorMessage.set(message);
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
    this.halqaOptions.set([]);
    this.halqaControl.setValue(null, { emitEvent: false });
    this.selectedHalqaId.set(null);
    this.loading.set(false);
    this.bootstrapping.set(false);
    this.errorMessage.set(null);
  }

  private reloadTable(): void {
    const selection = this.selection();
    const term = selectedTerm(selection);
    const halqaId = this.selectedHalqaId();
    if (!term || halqaId == null) {
      this.table.set(null);
      this.tableTermId.set(null);
      this.loading.set(false);
      return;
    }
    const generation = ++this.loadGeneration;
    const termId = term.id;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.report.loadProgress(halqaId, this.period(), this.dateContext(), termId).subscribe({
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
        const detail =
          err instanceof ApiError
            ? err.message
            : this.translate.instant('progressReport.loadTableFailed');
        const message = explicitTermFailureMessage(this.selection(), detail);
        this.errorMessage.set(message);
        this.toast.notifyErrorBody(message);
      },
    });
  }
}

function migrateDateContext(from: ProgressPeriod, ctx: string, to: ProgressPeriod): string {
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
