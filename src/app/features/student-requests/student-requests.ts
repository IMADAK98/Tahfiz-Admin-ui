import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ApiError } from '../../core/api/api-error';
import { createFieldErrorBag } from '../../core/api/field-error-state';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { yesNoLabel } from '../students/enums';
import { hifzSummary, StudentRequestViewModel } from './dto';
import { StudentRequestsLoadState } from './enums';
import { StudentRequestsService } from './student-requests.service';

@Component({
  selector: 'app-student-requests',
  imports: [FormsModule, RouterLink, Button, FieldErrorComponent],
  templateUrl: './student-requests.html',
  styleUrl: './student-requests.scss',
})
export class StudentRequestsComponent {
  private readonly requestsService = inject(StudentRequestsService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly StudentRequestsLoadState = StudentRequestsLoadState;
  protected readonly yesNoLabel = yesNoLabel;
  protected readonly hifzSummary = hifzSummary;

  protected readonly loadState = signal(StudentRequestsLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly requests = signal<StudentRequestViewModel[]>([]);
  protected readonly expandedIds = signal<Set<number>>(new Set());

  protected readonly activeApproveRequest = signal<StudentRequestViewModel | null>(null);
  protected readonly activeRejectRequest = signal<StudentRequestViewModel | null>(null);
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
    return `${this.requests().length} طلب معلّق`;
  }

  protected reload(): void {
    this.loadState.set(StudentRequestsLoadState.Loading);
    this.loadError.set(null);

    this.requestsService.loadPending().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.expandedIds.set(new Set());
        this.loadState.set(StudentRequestsLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(StudentRequestsLoadState.Error);
        this.loadError.set(error instanceof ApiError ? error.message : 'تعذّر تحميل الطلبات');
      },
    });
  }

  protected isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  protected toggleDetails(id: number): void {
    this.expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected openApprove(request: StudentRequestViewModel): void {
    if (this.actingId() !== null) {
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

  protected confirmApprove(request: StudentRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }
    this.actingId.set(request.id);
    this.requestsService.approve(request.id).subscribe({
      next: () => {
        this.actingId.set(null);
        this.activeApproveRequest.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.studentRequestApproved);
        this.reload();
      },
      error: (error: unknown) => {
        this.actingId.set(null);
        this.toastMessage.notifyErrorBody(
          error instanceof ApiError ? error.message : 'تعذّر قبول الطلب. حاول مرة أخرى.',
        );
      },
    });
  }

  protected openReject(request: StudentRequestViewModel): void {
    if (this.actingId() !== null) {
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

  protected confirmReject(request: StudentRequestViewModel): void {
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
        this.toastMessage.notifySuccess(TOAST_I18N.success.studentRequestRejected);
        this.reload();
      },
      error: (error: unknown) => {
        this.actingId.set(null);
        if (this.fields.apply(error) && this.fields.get('rejectionReason')) {
          this.rejectError.set(null);
          return;
        }
        this.rejectError.set(
          error instanceof ApiError ? error.message : 'تعذّر رفض الطلب. حاول مرة أخرى.',
        );
      },
    });
  }
}
