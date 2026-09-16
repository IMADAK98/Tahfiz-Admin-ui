import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../core/api/api-error';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { HalaqaStudentViewModel, StudyPlanViewModel } from '../dto';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-assign-plan-students-modal',
  imports: [FormsModule],
  templateUrl: './assign-plan-students-modal.html',
})
export class AssignPlanStudentsModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly plan = input.required<StudyPlanViewModel | null>();
  readonly rosterStudents = input.required<HalaqaStudentViewModel[]>();
  readonly assigned = output<void>();
  readonly closed = output<void>();

  protected readonly selectedStudentIds = signal<number[]>([]);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly availableStudents = computed(() => {
    const assignedIds = new Set((this.plan()?.students ?? []).map((student) => student.id));
    return this.rosterStudents().filter((student) => !assignedIds.has(student.id));
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.selectedStudentIds.set([]);
      this.errorMessage.set(null);
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
    const plan = this.plan();
    if (!plan) {
      return;
    }
    if (!this.selectedStudentIds().length) {
      this.errorMessage.set(this.translate.instant(HALAQA_DETAIL_I18N.validation.pickStudent));
      return;
    }

    this.submitting.set(true);
    this.detailService.assignStudentsToPlan(plan.id, this.selectedStudentIds()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.assigned.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : '');
      },
    });
  }
}
