import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { ReEnrollmentRequestView, RejectReEnrollmentFormModel } from './dto';
import { ReEnrollmentLoadState } from './enums';
import { RejectReEnrollmentDialogComponent } from './reject-re-enrollment-dialog/reject-re-enrollment-dialog';
import { ReEnrollmentService } from './re-enrollment.service';

@Component({
  selector: 'app-re-enrollment',
  imports: [RouterLink, ConfirmDialog, RejectReEnrollmentDialogComponent],
  providers: [ConfirmationService],
  templateUrl: './re-enrollment.html',
  styleUrl: './re-enrollment.scss',
})
export class ReEnrollmentComponent {
  private readonly reEnrollmentService = inject(ReEnrollmentService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly ReEnrollmentLoadState = ReEnrollmentLoadState;

  protected readonly loadState = signal(ReEnrollmentLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly requests = signal<ReEnrollmentRequestView[]>([]);
  protected readonly actingRequestId = signal<number | null>(null);
  protected readonly rejectTarget = signal<ReEnrollmentRequestView | null>(null);
  protected readonly rejectSubmitting = signal(false);
  protected readonly rejectServerError = signal<string | null>(null);

  protected readonly pendingCountLabel = computed(() => this.formatCountLabel(this.requests().length));
  protected readonly targetTermLabel = computed(() => {
    const termIds = [...new Set(this.requests().map((request) => request.termId))];
    if (termIds.length === 1) {
      const request = this.requests()[0];
      return request ? `الدورة المستهدفة: ${request.termLabel}` : null;
    }
    if (termIds.length > 1) {
      return `${termIds.length} دورات مستهدفة`;
    }
    return null;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.loadState.set(ReEnrollmentLoadState.Error);
      this.loadError.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.loadState.set(ReEnrollmentLoadState.Loading);
    this.loadError.set(null);

    this.reEnrollmentService.loadPendingQueue(centerId).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loadState.set(ReEnrollmentLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(ReEnrollmentLoadState.Error);
        this.loadError.set(
          error instanceof ApiError ? error.message : 'تعذّر تحميل طلبات إعادة التسجيل',
        );
      },
    });
  }

  protected confirmApprove(request: ReEnrollmentRequestView): void {
    if (this.actingRequestId() != null) {
      return;
    }

    this.confirmation.confirm({
      header: 'قبول إعادة التسجيل',
      message: `قبول إعادة تسجيل ${request.studentName} في ${request.termLabel}؟\n\nسيتم تسجيل الطالب في الدورة فقط دون تعيين حلقة.`,
      acceptLabel: 'تأكيد القبول',
      rejectLabel: 'إلغاء',
      accept: () => this.approveRequest(request),
    });
  }

  protected openRejectDialog(request: ReEnrollmentRequestView): void {
    if (this.actingRequestId() != null || this.rejectSubmitting()) {
      return;
    }
    this.rejectServerError.set(null);
    this.rejectTarget.set(request);
  }

  protected closeRejectDialog(): void {
    if (this.rejectSubmitting()) {
      return;
    }
    this.rejectTarget.set(null);
    this.rejectServerError.set(null);
  }

  protected onRejectConfirmed(form: RejectReEnrollmentFormModel): void {
    const request = this.rejectTarget();
    if (!request || this.rejectSubmitting()) {
      return;
    }

    this.rejectSubmitting.set(true);
    this.rejectServerError.set(null);
    this.reEnrollmentService.rejectRequest(request.id, form).subscribe({
      next: () => {
        this.rejectSubmitting.set(false);
        this.rejectTarget.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.reEnrollmentRejected);
        this.reload();
      },
      error: (error: unknown) => {
        this.rejectSubmitting.set(false);
        this.rejectServerError.set(
          error instanceof ApiError ? error.message : 'تعذّر رفض الطلب. حاول مرة أخرى.',
        );
      },
    });
  }

  protected studentMeta(request: ReEnrollmentRequestView): string {
    const parts = [
      request.email,
      `userId ${request.existingUserId}`,
      'طلب إعادة تسجيل',
    ].filter(Boolean);
    return parts.join(' · ');
  }

  protected guardianLabel(request: ReEnrollmentRequestView): string {
    if (request.guardianName && request.guardianPhone) {
      return `${request.guardianName} · ${request.guardianPhone}`;
    }
    return request.guardianName ?? request.guardianPhone ?? '—';
  }

  protected isActingOn(request: ReEnrollmentRequestView): boolean {
    return this.actingRequestId() === request.id;
  }

  private approveRequest(request: ReEnrollmentRequestView): void {
    this.actingRequestId.set(request.id);
    this.reEnrollmentService.approveRequest(request.id).subscribe({
      next: () => {
        this.actingRequestId.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.reEnrollmentApproved);
        this.reload();
      },
      error: (error: unknown) => {
        this.actingRequestId.set(null);
        if (error instanceof ApiError) {
          this.toastMessage.notifyErrorBody(error.message);
        }
      },
    });
  }

  private formatCountLabel(count: number): string {
    if (count === 0) {
      return 'لا طلبات';
    }
    if (count === 1) {
      return '1 طلب';
    }
    if (count === 2) {
      return '2 طلب';
    }
    if (count >= 3 && count <= 10) {
      return `${count} طلبات`;
    }
    return `${count} طلب`;
  }
}
