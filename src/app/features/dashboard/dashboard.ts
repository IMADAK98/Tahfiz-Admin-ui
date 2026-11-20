import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressBar } from 'primeng/progressbar';
import { TableModule, TableRowSelectEvent } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { DashboardHalaqaPerformanceRow } from '../../core/api/models/halqa-performance.model';
import { ActiveTerm } from '../../core/api/models/term.model';
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
  termDateLabels,
} from './dto/dashboard-view';
import { DashboardLoadState, ScoreBand } from './enums';
import {
  DASHBOARD_COPY,
  DashboardCopyKey,
  DashboardCopyValues,
  dashboardCopy,
} from './i18n/dashboard-copy';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    TableModule,
    ProgressBar,
    Tag,
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
  protected readonly showCreateModal = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly endingTerm = signal(false);
  protected readonly performanceState = signal(DashboardLoadState.Loading);
  protected readonly performanceError = signal<string | null>(null);
  protected readonly performanceRows = signal<DashboardHalaqaPerformanceRow[]>([]);
  private performanceSubscription?: Subscription;

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

    this.dashboardService.loadActiveTerm(centerId).subscribe({
      next: (activeTerm) => {
        this.activeTerm.set(activeTerm);
        this.loadState.set(DashboardLoadState.Ready);
        if (activeTerm) {
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
    if (term) {
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
        this.performanceError.set(error instanceof ApiError ? error.message : null);
      },
    });
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

  /** Same date range as `term.meta`, without the school-day count (no live source for it). */
  protected termDates(term: ActiveTerm): string {
    const { start, end } = termDateLabels(term.startDate, term.endDate);
    return `${start} – ${end}`;
  }

  protected halaqaAria(row: DashboardHalaqaPerformanceRow): string {
    return this.t('ov.row_aria', {
      name: row.name,
      score: row.score === null ? this.copy['ov.aria_none'] : this.round(row.score),
      att: this.ariaPercent(row.attendanceRate),
      cov: this.ariaPercent(row.coverage),
    });
  }

  private ariaPercent(value: number | null): string {
    return value === null
      ? this.copy['ov.aria_none']
      : this.t('ov.aria_pct', { v: this.round(value) });
  }

  protected openHalaqa(event: TableRowSelectEvent<DashboardHalaqaPerformanceRow>): void {
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
