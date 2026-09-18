import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { extractHttpErrorMessage } from '../../core/api/error-message.helpers';
import { createFieldErrorBag } from '../../core/api/field-error-state';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { CenterRequestViewModel } from './dto';
import {
  CenterRequestsLoadState,
  centerRequestFootHint,
  centerRequestStatusBadgeClass,
  centerRequestStatusLabel,
  isPendingCenterRequest,
} from './enums';
import { CenterRequestsService } from './center-requests.service';

@Component({
  selector: 'app-center-requests',
  imports: [FormsModule, Button, FieldErrorComponent],
  templateUrl: './center-requests.html',
  styleUrl: './center-requests.scss',
})
export class CenterRequestsComponent {
  private readonly requestsService = inject(CenterRequestsService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly CenterRequestsLoadState = CenterRequestsLoadState;
  protected readonly isPendingCenterRequest = isPendingCenterRequest;
  protected readonly centerRequestStatusLabel = centerRequestStatusLabel;
  protected readonly centerRequestStatusBadgeClass = centerRequestStatusBadgeClass;
  protected readonly centerRequestFootHint = centerRequestFootHint;

  protected readonly loadState = signal(CenterRequestsLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly requests = signal<CenterRequestViewModel[]>([]);

  protected readonly activeApproveRequest = signal<CenterRequestViewModel | null>(null);
  protected readonly activeRejectRequest = signal<CenterRequestViewModel | null>(null);
  protected rejectionReason = '';
  protected readonly rejectError = signal<string | null>(null);
  protected readonly actingId = signal<number | null>(null);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  protected clearFieldError(...fieldNames: string[]): void {
    this.fields.clear(...fieldNames);
  }

  constructor() {
    this.reload();
  }

  protected countLabel(): string {
    return `${this.requests().length} طلبات`;
  }

  protected reload(): void {
    this.loadState.set(CenterRequestsLoadState.Loading);
    this.loadError.set(null);

    this.requestsService.loadAll().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loadState.set(CenterRequestsLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(CenterRequestsLoadState.Error);
        this.loadError.set(extractHttpErrorMessage(error) ?? 'تعذّر تحميل الطلبات');
      },
    });
  }

  protected openApprove(request: CenterRequestViewModel): void {
    if (this.actingId() !== null || !isPendingCenterRequest(request.status)) {
      return;
    }
    this.activeApproveRequest.set(request);
  }

  protected closeApprove(): void {
    if (this.actingId() !== null) {
      return;
    }
    this.activeApproveRequest.set(null);
  }

  protected confirmApprove(request: CenterRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }
    this.actingId.set(request.id);
    this.requestsService.approve(request.id).subscribe({
      next: () => {
        this.actingId.set(null);
        this.activeApproveRequest.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.centerRequestApproved);
        this.reload();
      },
      error: (error: unknown) => {
        this.actingId.set(null);
        this.toastMessage.notifyErrorBody(
          extractHttpErrorMessage(error) ?? 'تعذّر قبول الطلب. حاول مرة أخرى.',
        );
      },
    });
  }

  protected openReject(request: CenterRequestViewModel): void {
    if (this.actingId() !== null || !isPendingCenterRequest(request.status)) {
      return;
    }
    this.rejectionReason = '';
    this.rejectError.set(null);
    this.fields.clearAll();
    this.activeRejectRequest.set(request);
  }

  protected closeReject(): void {
    if (this.actingId() !== null) {
      return;
    }
    this.activeRejectRequest.set(null);
  }

  protected confirmReject(request: CenterRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }

    if (!this.rejectionReason.trim()) {
      this.rejectError.set('سبب الرفض مطلوب');
      return;
    }

    this.fields.clearAll();
    this.rejectError.set(null);
    this.actingId.set(request.id);
    this.requestsService.reject(request.id, this.rejectionReason).subscribe({
      next: () => {
        this.actingId.set(null);
        this.activeRejectRequest.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.centerRequestRejected);
        this.reload();
      },
      error: (error: unknown) => {
        this.actingId.set(null);
        if (this.fields.apply(error) && this.fields.get('rejectionReason')) {
          this.rejectError.set(null);
          return;
        }
        this.rejectError.set(
          extractHttpErrorMessage(error) ?? 'تعذّر رفض الطلب. حاول مرة أخرى.',
        );
      },
    });
  }
}
