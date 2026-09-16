import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { ActiveTerm } from '../../core/api/models/term.model';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { CreateTermModalComponent } from '../terms/create-term-modal/create-term-modal';
import { TermsService } from '../terms/terms.service';
import { DashboardLoadState } from './enums/dashboard-load-state.enum';
import { MOCK_DASHBOARD_KPIS, MOCK_TERM_PLAN_SUMMARY } from './dto';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CreateTermModalComponent, Toast, ConfirmDialog],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly termsService = inject(TermsService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly DashboardLoadState = DashboardLoadState;
  protected readonly mockKpis = MOCK_DASHBOARD_KPIS;

  protected readonly loadState = signal(DashboardLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeTerm = signal<ActiveTerm | null>(null);
  protected readonly showCreateModal = signal(false);
  protected readonly endingTerm = signal(false);

  protected readonly hasActiveTerm = computed(() => !!this.activeTerm());

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

    this.loadState.set(DashboardLoadState.Loading);
    this.loadError.set(null);

    this.dashboardService.loadActiveTerm(centerId).subscribe({
      next: (term) => {
        this.activeTerm.set(term);
        this.loadState.set(DashboardLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(DashboardLoadState.Error);
        this.loadError.set(
          error instanceof ApiError ? error.message : 'تعذّر تحميل الدورة النشطة',
        );
      },
    });
  }

  protected openCreateModal(): void {
    if (this.hasActiveTerm()) {
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

  protected termBannerSummary(term: ActiveTerm): string {
    return `${this.registrationSummary(term)} · ${MOCK_TERM_PLAN_SUMMARY}`;
  }

  protected formatDate(value: string): string {
    const normalized = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected holidayLabels(term: ActiveTerm): string[] {
    return (term.holidayDates ?? []).map((date) => this.formatHolidayLabel(date));
  }

  protected formatHolidayLabel(isoDate: string): string {
    const parsed = new Date(`${this.formatDate(isoDate)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return new Intl.DateTimeFormat('ar', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }

  protected registrationSummary(term: ActiveTerm): string {
    const today = new Date().toISOString().slice(0, 10);
    const regStart = this.formatDate(term.registerationStartDate);
    const regEnd = this.formatDate(term.registerationEndDate);
    if (today >= regStart && today <= regEnd) {
      return 'التسجيل مفتوح';
    }
    if (today < regStart) {
      return 'التسجيل لم يبدأ بعد';
    }
    return 'التسجيل مغلق';
  }

  private endActiveTerm(term: ActiveTerm): void {
    this.endingTerm.set(true);
    this.termsService.endActiveTerm(term.id).subscribe({
      next: () => {
        this.endingTerm.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'تم إنهاء الدورة',
          detail: 'تم إنهاء الدورة الحالية',
          life: 4000,
        });
        this.reload();
      },
      error: (error: unknown) => {
        this.endingTerm.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'إنهاء الدورة',
          detail:
            error instanceof ApiError
              ? error.message
              : 'مسار إنهاء الدورة غير متوفر — UpdateTermDto لا يتضمن status',
          life: 6000,
        });
      },
    });
  }
}
