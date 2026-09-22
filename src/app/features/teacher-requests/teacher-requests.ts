import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { ApiError } from '../../core/api/api-error';
import { createFieldErrorBag } from '../../core/api/field-error-state';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import {
  teacherAgeGroupsLabel,
  teacherQualificationLabel,
  teacherTajweedLevelLabel,
  teacherWorkPeriodsLabel,
  yesNoLabel,
} from '../teachers/enums';
import { TeacherRequestViewModel } from './dto';
import { TeacherRequestsLoadState } from './enums';
import { TeacherRequestsService } from './teacher-requests.service';

@Component({
  selector: 'app-teacher-requests',
  imports: [ReactiveFormsModule, RouterLink, Button, Textarea, FieldErrorComponent],
  templateUrl: './teacher-requests.html',
  styleUrl: './teacher-requests.scss',
})
export class TeacherRequestsComponent {
  private readonly requestsService = inject(TeacherRequestsService);
  private readonly toastMessage = inject(ToastMessageService);

  protected readonly TeacherRequestsLoadState = TeacherRequestsLoadState;
  protected readonly teacherQualificationLabel = teacherQualificationLabel;
  protected readonly teacherTajweedLevelLabel = teacherTajweedLevelLabel;
  protected readonly teacherAgeGroupsLabel = teacherAgeGroupsLabel;
  protected readonly teacherWorkPeriodsLabel = teacherWorkPeriodsLabel;
  protected readonly yesNoLabel = yesNoLabel;

  protected readonly loadState = signal(TeacherRequestsLoadState.Loading);
  protected readonly loadError = signal<string | null>(null);
  protected readonly requests = signal<TeacherRequestViewModel[]>([]);
  protected readonly expandedIds = signal<Set<number>>(new Set());

  protected readonly activeApproveRequest = signal<TeacherRequestViewModel | null>(null);
  protected readonly activeRejectRequest = signal<TeacherRequestViewModel | null>(null);
  protected readonly rejectionReason = new FormControl('', { nonNullable: true });
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
    this.rejectionReason.valueChanges.subscribe(() => this.clearFieldError('rejectionReason'));
    this.reload();
  }

  protected countLabel(): string {
    return `${this.requests().length} طلب معلّق`;
  }

  protected reload(): void {
    this.loadState.set(TeacherRequestsLoadState.Loading);
    this.loadError.set(null);

    this.requestsService.loadPending().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.expandedIds.set(new Set());
        this.loadState.set(TeacherRequestsLoadState.Ready);
      },
      error: (error: unknown) => {
        this.loadState.set(TeacherRequestsLoadState.Error);
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

  protected openApprove(request: TeacherRequestViewModel): void {
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

  protected confirmApprove(request: TeacherRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }
    this.actingId.set(request.id);
    this.requestsService.approve(request.id).subscribe({
      next: () => {
        this.actingId.set(null);
        this.activeApproveRequest.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherRequestApproved);
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

  protected openReject(request: TeacherRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }
    this.rejectionReason.setValue('');
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

  protected confirmReject(request: TeacherRequestViewModel): void {
    if (this.actingId() !== null) {
      return;
    }

    if (!this.rejectionReason.value.trim()) {
      this.fields.applyMap({ rejectionReason: 'سبب الرفض مطلوب' });
      return;
    }

    this.fields.clearAll();
    this.rejectError.set(null);
    this.actingId.set(request.id);
    this.requestsService.reject(request.id, this.rejectionReason.value).subscribe({
      next: () => {
        this.actingId.set(null);
        this.activeRejectRequest.set(null);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherRequestRejected);
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
