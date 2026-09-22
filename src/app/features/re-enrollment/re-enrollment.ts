import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Textarea } from 'primeng/textarea';
import { ApiError } from '../../core/api/api-error';
import { createFieldErrorBag } from '../../core/api/field-error-state';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N, resolveServerErrorToastDisplay } from '../../core/ui/toast-messages';
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
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, Textarea, FieldErrorComponent],
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
  protected readonly rejectErrors = signal<Record<number, string | null>>({});
  protected readonly actingRequestId = signal<number | null>(null);
  private readonly fields = createFieldErrorBag();
  private readonly rejectControls = new Map<number, FormControl<string>>();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

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
    this.fields.clearAll();
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

  protected rejectControl(requestId: number): FormControl<string> {
    let control = this.rejectControls.get(requestId);
    if (!control) {
      control = new FormControl('', { nonNullable: true });
      control.valueChanges.subscribe(() => {
        this.fields.clear('rejectionReason');
        this.rejectErrors.update((current) => ({ ...current, [requestId]: null }));
      });
      this.rejectControls.set(requestId, control);
    }
    return control;
  }

  protected rejectReason(requestId: number): string {
    return this.rejectControl(requestId).value;
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
    if (this.fields.applyMap(validateRejectForm(form))) {
      return;
    }

    this.fields.clearAll();
    this.actingRequestId.set(request.id);
    this.reEnrollmentService.rejectRequest(request.id, form).subscribe({
      next: () => {
        this.actingRequestId.set(null);
        this.activeConfirm.set(null);
        this.rejectControl(request.id).setValue('');
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

    if (this.fields.apply(error) && this.fields.get('rejectionReason')) {
      this.rejectErrors.update((current) => ({ ...current, [requestId]: null }));
      return;
    }

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
      this.notifyServerErrorToast(error.message);
      this.activeConfirm.set(null);
      this.reload();
      return;
    }

    if (action === 'reject') {
      this.rejectErrors.update((current) => ({ ...current, [requestId]: error.message }));
      return;
    }

    this.notifyServerErrorToast(error.message);
  }

  /** Same Nest-body toast skin as the error interceptor (`resolveServerErrorToastDisplay`). */
  private notifyServerErrorToast(serverMessage: string): void {
    const display = resolveServerErrorToastDisplay(
      serverMessage,
      this.translate.instant(TOAST_I18N.errors.requestFailedTitle),
      (message: string) =>
        this.translate.instant(TOAST_I18N.errors.requestFailedWithMessage, { message }),
    );

    if (display.mode === 'titled') {
      this.toastMessage.notifyErrorTitled(display.summary, display.detail);
      return;
    }

    this.toastMessage.notifyErrorBody(display.body);
  }

  private formatCountLabel(count: number): string {
    return this.translate.instant('reEnrollment.countLabel', { count });
  }
}
