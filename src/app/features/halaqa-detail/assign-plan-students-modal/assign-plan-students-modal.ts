import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { HalaqaStudentViewModel, StudyPlanViewModel } from '../dto';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-assign-plan-students-modal',
  imports: [ReactiveFormsModule, FieldErrorComponent],
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

  protected readonly selectedStudentIds = new FormControl<number[]>([], { nonNullable: true });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  protected readonly availableStudents = computed(() => {
    const assignedIds = new Set((this.plan()?.students ?? []).map((student) => student.id));
    return this.rosterStudents().filter((student) => !assignedIds.has(student.id));
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.selectedStudentIds.setValue([]);
        this.fields.clearAll();
        this.errorMessage.set(null);
      });
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
    const ids = this.selectedStudentIds.value;
    this.selectedStudentIds.setValue(
      checked ? [...ids, studentId] : ids.filter((id) => id !== studentId),
    );
    this.fields.clear('studentIds');
  }

  protected isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds.value.includes(studentId);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const plan = this.plan();
    if (!plan) {
      return;
    }
    if (!this.selectedStudentIds.value.length) {
      this.fields.applyMap({
        studentIds: this.translate.instant(HALAQA_DETAIL_I18N.validation.pickStudent),
      });
      return;
    }

    this.submitting.set(true);
    this.fields.clearAll();
    this.detailService.assignStudentsToPlan(plan.id, this.selectedStudentIds.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.assigned.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            error instanceof ApiError ? error.message : '',
          ),
        );
      },
    });
  }
}
