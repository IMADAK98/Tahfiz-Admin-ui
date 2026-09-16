import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../core/api/api-error';
import { ActiveStudent } from '../../../core/api/models/student.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { HalaqaStudentViewModel } from '../dto';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-enroll-students-modal',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './enroll-students-modal.html',
})
export class EnrollStudentsModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly halqaId = input.required<number>();
  readonly rosterStudents = input.required<HalaqaStudentViewModel[]>();
  readonly enrolled = output<void>();
  readonly closed = output<void>();

  protected readonly candidates = signal<ActiveStudent[]>([]);
  protected readonly selectedStudentIds = signal<number[]>([]);
  protected readonly pickersLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly availableCandidates = computed(() => {
    const enrolledIds = new Set(this.rosterStudents().map((student) => student.id));
    return this.candidates().filter((student) => !enrolledIds.has(student.id));
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.selectedStudentIds.set([]);
      this.errorMessage.set(null);
      this.loadPickers();
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected close(): void {
    if (this.submitting()) {
      return;
    }
    this.closed.emit();
  }

  protected toggleStudent(studentId: number, checked: boolean): void {
    this.selectedStudentIds.update((ids) =>
      checked ? [...ids, studentId] : ids.filter((id) => id !== studentId),
    );
  }

  protected isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds().includes(studentId);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    if (!this.selectedStudentIds().length) {
      this.errorMessage.set(this.translate.instant(HALAQA_DETAIL_I18N.validation.pickStudent));
      return;
    }

    this.submitting.set(true);
    this.detailService.enrollStudents(this.halqaId(), this.selectedStudentIds()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(HALAQA_DETAIL_I18N.success.studentsEnrolled);
        this.enrolled.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  private loadPickers(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set(this.translate.instant(HALAQA_DETAIL_I18N.validation.centerUnknown));
      return;
    }

    this.pickersLoading.set(true);
    this.detailService.loadStudentPickers(centerId).subscribe({
      next: (students) => {
        this.candidates.set(students);
        this.pickersLoading.set(false);
      },
      error: (error: unknown) => {
        this.pickersLoading.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : '');
      },
    });
  }
}
