import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N, formatServerErrorToastBody } from '../../core/ui/toast-messages';
import {
  isAlreadyProcessedError,
  ReEnrollmentRequestView,
  RejectReEnrollmentFormModel,
  validateRejectForm,
} from './dto';
import { ReEnrollmentLoadState } from './enums';
import { ReEnrollmentService } from './re-enrollment.service';

type ConfirmKind = 'approve' | 'reject';

@Component({
  selector: 'app-re-enrollment',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './re-enrollment.html',
  styleUrl: './re-enrollment.scss',
})
export class ReEnrollmentComponent {
  private readonly reEnrollmentService = inject(ReEnrollmentService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly ReEnrollmentLoadState = ReEnrollmentLoadState;

  protected readonly loadState = signal(ReEnrollmentLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly requests = signal<ReEnrollmentRequestView[]>([]);
  protected readonly expandedCards = signal<Record<number, boolean>>({});
  protected readonly activeConfirm = signal<{ requestId: number; kind: ConfirmKind } | null>(null);
  protected readonly rejectReasons = signal<Record<number, string>>({});
  protected readonly rejectErrors = signal<Record<number, string | null>>({});
  protected readonly actingRequestId = signal<number | null>(null);

  protected readonly pendingCountLabel = computed(() =>
    this.formatCountLabel(this.requests().length),
  );

  protected readonly targetTermLabel = computed(() => {
    const termIds = [...new Set(this.requests().map((request) => request.termId))];
    if (termIds.length === 1) {
      const request = this.requests()[0];
      return request ?
          this.translate.instant('reEnrollment.targetTerm', { term: request.termLabel })
        : null;
    }
    if (termIds.length > 1) {
      return this.translate.instant('reEnrollment.multipleTargetTerms', { count: termIds.length });
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
      this.loadError.set(this.translate.instant('reEnrollment.errors.centerUnknown'));
      return;
    }

    this.loadState.set(ReEnrollmentLoadState.Loading);
    this.loadError.set(null);
    this.activeConfirm.set(null);

    this.reEnrollmentService.loadPendingQueue(centerId).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.expandedCards.set(Object.fromEntries(requests.map((request) => [request.id, true])));
        this.loadState.set(ReEnrollmentLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(ReEnrollmentLoadState.Error);
        this.loadError.set(
          error instanceof ApiError ?
            error.message
          : this.translate.instant(TOAST_I18N.errors.unexpected),
        );
      },
    });
  }

  protected cardExpanded(requestId: number): boolean {
    return this.expandedCards()[requestId] ?? true;
  }

  protected toggleCard(requestId: number): void {
    this.expandedCards.update((current) => ({
      ...current,
      [requestId]: !this.cardExpanded(requestId),
    }));
  }

  protected showApproveConfirm(request: ReEnrollmentRequestView, event: Event): void {
    event.stopPropagation();
    if (this.actingRequestId() != null) {
      return;
    }
    this.activeConfirm.set({ requestId: request.id, kind: 'approve' });
    this.rejectErrors.update((current) => ({ ...current, [request.id]: null }));
  }

  protected showRejectConfirm(request: ReEnrollmentRequestView, event: Event): void {
    event.stopPropagation();
    if (this.actingRequestId() != null) {
      return;
    }
    this.activeConfirm.set({ requestId: request.id, kind: 'reject' });
    this.rejectErrors.update((current) => ({ ...current, [request.id]: null }));
  }

  protected cancelConfirm(requestId: number, event?: Event): void {
    event?.stopPropagation();
    if (this.actingRequestId() === requestId) {
      return;
    }
    this.activeConfirm.set(null);
    this.rejectErrors.update((current) => ({ ...current, [requestId]: null }));
  }

  protected isConfirmOpen(requestId: number, kind: ConfirmKind): boolean {
    const confirm = this.activeConfirm();
    return confirm?.requestId === requestId && confirm.kind === kind;
  }

  protected rejectReason(requestId: number): string {
    return this.rejectReasons()[requestId] ?? '';
  }

  protected setRejectReason(requestId: number, value: string): void {
    this.rejectReasons.update((current) => ({ ...current, [requestId]: value }));
    this.rejectErrors.update((current) => ({ ...current, [requestId]: null }));
  }

  protected canSubmitReject(requestId: number): boolean {
    return this.rejectReason(requestId).trim().length > 0 && this.actingRequestId() !== requestId;
  }

  protected rejectError(requestId: number): string | null {
    return this.rejectErrors()[requestId] ?? null;
  }

  protected confirmApprove(request: ReEnrollmentRequestView, event: Event): void {
    event.stopPropagation();
    if (this.actingRequestId() != null) {
      return;
    }

    this.actingRequestId.set(request.id);
    this.reEnrollmentService.approveRequest(request.id).subscribe({
      next: () => {
        this.actingRequestId.set(null);
        this.activeConfirm.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.reEnrollmentApproved);
        this.toastMessage.notifyInfo(TOAST_I18N.info.reEnrollmentAddToHalaqa);
        this.reload();
      },
      error: (error: unknown) => this.handleMutationError(error, request.id, 'approve'),
    });
  }

  protected confirmReject(request: ReEnrollmentRequestView, event: Event): void {
    event.stopPropagation();
    if (this.actingRequestId() != null) {
      return;
    }

    const form: RejectReEnrollmentFormModel = {
      rejectionReason: this.rejectReason(request.id),
    };
    const validationError = validateRejectForm(form);
    if (validationError) {
      this.rejectErrors.update((current) => ({ ...current, [request.id]: validationError }));
      return;
    }

    this.actingRequestId.set(request.id);
    this.reEnrollmentService.rejectRequest(request.id, form).subscribe({
      next: () => {
        this.actingRequestId.set(null);
        this.activeConfirm.set(null);
        this.rejectReasons.update((current) => ({ ...current, [request.id]: '' }));
        this.toastMessage.notifySuccess(TOAST_I18N.success.reEnrollmentRejected);
        this.reload();
      },
      error: (error: unknown) => this.handleMutationError(error, request.id, 'reject'),
    });
  }

  protected studentMeta(request: ReEnrollmentRequestView): string {
    return [
      request.email,
      `userId ${request.existingUserId}`,
      this.translate.instant('reEnrollment.requestMeta'),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected approveMessage(request: ReEnrollmentRequestView): string {
    return this.translate.instant('reEnrollment.approve.message', {
      name: request.name,
      term: request.termLabel,
    });
  }

  protected isActingOn(request: ReEnrollmentRequestView): boolean {
    return this.actingRequestId() === request.id;
  }

  private handleMutationError(error: unknown, requestId: number, action: 'approve' | 'reject'): void {
    this.actingRequestId.set(null);

    if (!(error instanceof ApiError)) {
      if (action === 'reject') {
        this.rejectErrors.update((current) => ({
          ...current,
          [requestId]: this.translate.instant(TOAST_I18N.errors.unexpected),
        }));
      }
      return;
    }

    if (isAlreadyProcessedError(error)) {
      this.toastMessage.notifyErrorBody(
        formatServerErrorToastBody(
          error.message,
          (message) => this.translate.instant(TOAST_I18N.errors.requestFailedWithMessage, { message }),
        ),
      );
      this.activeConfirm.set(null);
      this.reload();
      return;
    }

    if (action === 'reject') {
      this.rejectErrors.update((current) => ({ ...current, [requestId]: error.message }));
      return;
    }

    this.toastMessage.notifyErrorBody(
      formatServerErrorToastBody(
        error.message,
        (message) => this.translate.instant(TOAST_I18N.errors.requestFailedWithMessage, { message }),
      ),
    );
  }

  private formatCountLabel(count: number): string {
    return this.translate.instant('reEnrollment.countLabel', { count });
  }
}
