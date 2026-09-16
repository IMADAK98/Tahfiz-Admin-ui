import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { TOAST_I18N, formatServerErrorToastBody } from '../../core/ui/toast-messages';
import {
  isAlreadyProcessedError,
  ReEnrollmentRequestView,
  RejectReEnrollmentFormModel,
} from './dto';
import { ReEnrollmentListTab, ReEnrollmentLoadState, ReEnrollmentStatus } from './enums';
import { RejectReEnrollmentDialogComponent } from './reject-re-enrollment-dialog/reject-re-enrollment-dialog';
import { ReEnrollmentService } from './re-enrollment.service';

@Component({
  selector: 'app-re-enrollment',
  imports: [RouterLink, TranslatePipe, ConfirmDialog, RejectReEnrollmentDialogComponent],
  providers: [ConfirmationService],
  templateUrl: './re-enrollment.html',
  styleUrl: './re-enrollment.scss',
})
export class ReEnrollmentComponent {
  private readonly reEnrollmentService = inject(ReEnrollmentService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly ReEnrollmentLoadState = ReEnrollmentLoadState;
  protected readonly ReEnrollmentListTab = ReEnrollmentListTab;
  protected readonly ReEnrollmentStatus = ReEnrollmentStatus;

  protected readonly loadState = signal(ReEnrollmentLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly allRequests = signal<ReEnrollmentRequestView[]>([]);
  protected readonly activeTab = signal(ReEnrollmentListTab.Pending);
  protected readonly expandedDetails = signal<Record<number, boolean>>({});
  protected readonly actingRequestId = signal<number | null>(null);
  protected readonly rejectTarget = signal<ReEnrollmentRequestView | null>(null);
  protected readonly rejectSubmitting = signal(false);
  protected readonly rejectServerError = signal<string | null>(null);

  protected readonly visibleRequests = computed(() => {
    const tab = this.activeTab();
    return this.allRequests().filter((request) =>
      tab === ReEnrollmentListTab.Pending ?
        request.status === ReEnrollmentStatus.Pending
      : request.status !== ReEnrollmentStatus.Pending,
    );
  });

  protected readonly pendingCountLabel = computed(() =>
    this.formatCountLabel(
      this.allRequests().filter((request) => request.status === ReEnrollmentStatus.Pending).length,
    ),
  );

  protected readonly targetTermLabel = computed(() => {
    const pending = this.allRequests().filter(
      (request) => request.status === ReEnrollmentStatus.Pending,
    );
    const termIds = [...new Set(pending.map((request) => request.termId))];
    if (termIds.length === 1) {
      const request = pending[0];
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

    this.reEnrollmentService.loadQueue(centerId).subscribe({
      next: (requests) => {
        this.allRequests.set(requests);
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

  protected setTab(tab: ReEnrollmentListTab): void {
    this.activeTab.set(tab);
  }

  protected toggleDetails(requestId: number): void {
    this.expandedDetails.update((current) => ({
      ...current,
      [requestId]: !current[requestId],
    }));
  }

  protected detailsExpanded(requestId: number): boolean {
    return !!this.expandedDetails()[requestId];
  }

  protected confirmApprove(request: ReEnrollmentRequestView): void {
    if (this.actingRequestId() != null) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant('reEnrollment.approve.header'),
      message: this.translate.instant('reEnrollment.approve.message', {
        name: request.name,
        term: request.termLabel,
      }),
      acceptLabel: this.translate.instant('reEnrollment.approve.confirm'),
      rejectLabel: this.translate.instant('reEnrollment.approve.cancel'),
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
      error: (error: unknown) => this.handleMutationError(error, 'reject'),
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

  protected statusBadgeKey(request: ReEnrollmentRequestView): string {
    if (request.status === ReEnrollmentStatus.Approved) {
      return 'reEnrollment.status.approved';
    }
    if (request.status === ReEnrollmentStatus.Rejected) {
      return 'reEnrollment.status.rejected';
    }
    return 'reEnrollment.status.pending';
  }

  protected statusBadgeClass(request: ReEnrollmentRequestView): string {
    if (request.status === ReEnrollmentStatus.Approved) {
      return 'badge-success';
    }
    if (request.status === ReEnrollmentStatus.Rejected) {
      return 'badge-neutral';
    }
    return 'badge-warning';
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
        this.toastMessage.notifyInfo(TOAST_I18N.info.reEnrollmentAddToHalaqa);
        this.reload();
      },
      error: (error: unknown) => this.handleMutationError(error, 'approve'),
    });
  }

  private handleMutationError(error: unknown, action: 'approve' | 'reject'): void {
    if (action === 'approve') {
      this.actingRequestId.set(null);
    } else {
      this.rejectSubmitting.set(false);
    }

    if (!(error instanceof ApiError)) {
      if (action === 'reject') {
        this.rejectServerError.set(this.translate.instant(TOAST_I18N.errors.unexpected));
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
      if (action === 'reject') {
        this.rejectTarget.set(null);
      }
      this.reload();
      return;
    }

    if (action === 'reject') {
      this.rejectServerError.set(error.message);
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
