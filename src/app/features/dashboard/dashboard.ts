import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Badge } from 'primeng/badge';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DataView } from 'primeng/dataview';
import { MeterGroup } from 'primeng/metergroup';
import { ProgressBar } from 'primeng/progressbar';
import { TableModule, TableRowSelectEvent } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { StudyPlanItemType } from '../../core/api/models/study-plan.model';
import { ActiveTerm } from '../../core/api/models/term.model';
import {
  DashboardAttentionStudent,
  DashboardHalaqaPerformanceRow,
  DashboardHalaqaRow,
  DashboardTerm,
  DashboardWeek,
  TermDashboardResponse,
} from '../../core/api/models/term-dashboard.model';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { CreateTermModalComponent } from '../terms/create-term-modal/create-term-modal';
import { EditTermModalComponent } from '../terms/edit-term-modal/edit-term-modal';
import { TermsService } from '../terms/terms.service';
import { DashboardService } from './dashboard.service';
import {
  LOW_ATTENDANCE_BELOW,
  LOW_COVERAGE_BELOW,
  isLow,
  scoreBand,
  studentGroups,
  termDateLabels,
  weekRangeLabel,
} from './dto/dashboard-view';
import { DashboardLoadState, ScoreBand } from './enums';
import {
  DASHBOARD_COPY,
  DashboardCopyKey,
  DashboardCopyValues,
  dashboardCopy,
} from './i18n/dashboard-copy';

const COVERAGE_TYPES: readonly { type: StudyPlanItemType; label: DashboardCopyKey }[] = [
  { type: 'HIFZ', label: 'type.hifz' },
  { type: 'TATHBEET', label: 'type.tathbeet' },
  { type: 'MURAJAA', label: 'type.murajaa' },
];

type OverviewRow = DashboardHalaqaPerformanceRow | DashboardHalaqaRow;

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    TableModule,
    ProgressBar,
    DataView,
    Tag,
    Chip,
    Card,
    Badge,
    MeterGroup,
    CreateTermModalComponent,
    EditTermModalComponent,
    ConfirmDialog,
  ],
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly termsService = inject(TermsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly DashboardLoadState = DashboardLoadState;
  protected readonly ScoreBand = ScoreBand;
  protected readonly copy = DASHBOARD_COPY;
  protected readonly lowAttendanceBelow = LOW_ATTENDANCE_BELOW;
  protected readonly lowCoverageBelow = LOW_COVERAGE_BELOW;
  protected readonly isLow = isLow;
  protected readonly scoreBand = scoreBand;

  protected readonly loadState = signal(DashboardLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeTerm = signal<ActiveTerm | null>(null);
  protected readonly dashboard = signal<TermDashboardResponse | null>(null);
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly endingTerm = signal(false);
  /** «أداء الحلقات» only: mock rows under `?mock=`, else the live halqa-performance endpoint. */
  protected readonly mockMode = signal(false);
  protected readonly performanceState = signal(DashboardLoadState.Loading);
  protected readonly performanceError = signal<string | null>(null);
  protected readonly performanceRows = signal<OverviewRow[]>([]);
  private performanceSubscription?: Subscription;

  protected readonly studentGroups = computed(() =>
    studentGroups(this.dashboard()?.attentionStudents ?? []),
  );
  protected readonly incompleteHalaqat = computed(() =>
    (this.dashboard()?.halaqat ?? []).filter((row) => !row.fullyMarkedThisWeek),
  );
  protected readonly coverageRows = computed(() => {
    const totals = this.dashboard()?.totals;
    return COVERAGE_TYPES.map(({ type, label }) => ({
      type,
      label,
      average: totals?.typeAverages[type] ?? null,
      students: totals?.typeStudentCounts[type] ?? 0,
    }));
  });
  protected readonly meterItems = computed(() => {
    const marking = this.dashboard()?.markingCompleteness;
    return [
      { label: 'marked', value: marking?.markedCells ?? 0, color: 'var(--color-primary)' },
      { label: 'unmarked', value: marking?.notMarkedCells ?? 0, color: 'var(--sev-warn-bar)' },
    ];
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(DashboardLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.performanceSubscription?.unsubscribe();
    this.loadState.set(DashboardLoadState.Loading);
    this.loadError.set(null);

    this.dashboardService.loadPage(centerId).subscribe({
      next: ({ activeTerm, dashboard, mock }) => {
        this.activeTerm.set(activeTerm);
        this.dashboard.set(dashboard);
        this.mockMode.set(mock);
        this.loadState.set(DashboardLoadState.Ready);
        if (mock) {
          this.performanceRows.set(dashboard.halaqat);
          this.performanceState.set(DashboardLoadState.Ready);
        } else if (activeTerm) {
          this.loadPerformance(activeTerm.id);
        }
      },
      error: (error: unknown) => {
        this.loadState.set(DashboardLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل لوحة التحكم');
      },
    });
  }

  protected retryPerformance(): void {
    const term = this.activeTerm();
    if (term && !this.mockMode()) {
      this.loadPerformance(term.id);
    }
  }

  private loadPerformance(termId: number): void {
    this.performanceSubscription?.unsubscribe();
    this.performanceState.set(DashboardLoadState.Loading);
    this.performanceError.set(null);
    this.performanceRows.set([]);
    this.performanceSubscription = this.dashboardService.loadHalqaPerformance(termId).subscribe({
      next: (rows) => {
        this.performanceRows.set(rows);
        this.performanceState.set(DashboardLoadState.Ready);
      },
      error: (error: unknown) => {
        this.performanceState.set(DashboardLoadState.Error);
        this.performanceError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الحلقات');
      },
    });
  }

  /** Live rows carry no weekly marking, so they never show the incomplete-marking hint. */
  protected isIncomplete(row: OverviewRow): boolean {
    return 'fullyMarkedThisWeek' in row && !row.fullyMarkedThisWeek;
  }

  protected t(key: DashboardCopyKey, values?: DashboardCopyValues): string {
    return dashboardCopy(key, values);
  }

  protected round(value: number | null): string {
    return value === null ? this.copy['pc.dash'] : String(Math.round(value));
  }

  protected percent(value: number | null): string {
    return value === null ? this.copy['pc.dash'] : `${Math.round(value)}%`;
  }

  protected termMeta(term: DashboardTerm): string {
    return this.t('term.meta', {
      ...termDateLabels(term.startDate, term.endDate),
      days: term.schoolDaysToDate,
    });
  }

  protected weekSubtitle(week: DashboardWeek): string {
    return this.t('mc.sub', {
      range: weekRangeLabel(week.weekStart, week.weekEnd),
      days: week.schoolDaysToDate,
    });
  }

  protected halaqaAria(row: OverviewRow): string {
    return this.t('ov.row_aria', {
      name: row.name,
      score: this.round(row.score),
      att: this.round(row.attendanceRate),
      cov: this.round(row.coverage),
    });
  }

  protected absenceIssue(student: DashboardAttentionStudent): string {
    return this.t('ws.issue_abs', { n: student.absentCount });
  }

  protected coverageIssue(student: DashboardAttentionStudent): string {
    return this.t('ws.issue_cov', { p: this.round(student.coverage) });
  }

  protected studentAria(student: DashboardAttentionStudent, absenceGroup: boolean): string {
    const issues = absenceGroup
      ? [this.absenceIssue(student)].concat(
          isLow(student.coverage, LOW_COVERAGE_BELOW) ? [this.coverageIssue(student)] : [],
        )
      : [this.coverageIssue(student)];
    return this.t('ws.row_aria', {
      name: student.name,
      halaqa: student.halaqaName,
      issue: issues.join('، '),
    });
  }

  protected openHalaqa(event: TableRowSelectEvent<OverviewRow>): void {
    const row = Array.isArray(event.data) ? event.data[0] : event.data;
    if (row) {
      void this.router.navigate(['/admin/halaqat', row.halaqaId]);
    }
  }

  protected openCreateModal(): void {
    if (this.activeTerm()) {
      return;
    }
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected onTermCreated(): void {
    this.showCreateModal.set(false);
    this.reload();
  }

  protected openEditModal(): void {
    const term = this.activeTerm();
    if (!term || term.status === 'COMPLETED' || this.endingTerm()) {
      return;
    }
    this.showEditModal.set(true);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
  }

  protected onTermUpdated(): void {
    this.showEditModal.set(false);
    this.reload();
  }

  protected confirmEndTerm(): void {
    const term = this.activeTerm();
    if (!term || this.endingTerm()) {
      return;
    }

    this.confirmation.confirm({
      header: 'إنهاء الدورة',
      message: `هل تريد إنهاء الدورة «${term.name}»؟ لن تتمكن من إنشاء دورة جديدة قبل الإنهاء.`,
      acceptLabel: 'إنهاء الدورة',
      rejectLabel: 'إلغاء',
      accept: () => this.endActiveTerm(term),
    });
  }

  private endActiveTerm(term: ActiveTerm): void {
    this.endingTerm.set(true);
    this.termsService.endActiveTerm(term.id).subscribe({
      next: () => {
        this.endingTerm.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.termEnded);
        this.reload();
      },
      error: () => {
        this.endingTerm.set(false);
      },
    });
  }
}
