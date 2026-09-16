import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActiveTerm } from '../../core/api/models/term.model';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { CreateTermModalComponent } from '../terms/create-term-modal/create-term-modal';
import { DashboardLoadState } from './enums/dashboard-load-state.enum';
import { MOCK_DASHBOARD_KPIS } from './dto';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CreateTermModalComponent, Toast],
  providers: [MessageService],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly DashboardLoadState = DashboardLoadState;
  protected readonly mockKpis = MOCK_DASHBOARD_KPIS;

  protected readonly loadState = signal(DashboardLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeTerm = signal<ActiveTerm | null>(null);
  protected readonly showCreateModal = signal(false);

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
    return (term.holidayDates ?? []).map((date) => this.formatDate(date));
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
}
