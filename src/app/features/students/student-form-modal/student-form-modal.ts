import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { EDUCATION_STAGE_OPTIONS, HIFZ_QUALITY_OPTIONS, STUDENT_YES_NO_OPTIONS } from '../enums';
import { StudentFormModel, createEmptyStudentForm } from '../dto';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-form-modal',
  imports: [FormsModule, Button, Select],
  templateUrl: './student-form-modal.html',
  styleUrl: './student-form-modal.scss',
})
export class StudentFormModalComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly toastMessage = inject(ToastMessageService);

  readonly visible = input.required<boolean>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly educationStageOptions = [...EDUCATION_STAGE_OPTIONS];
  protected readonly hifzQualityOptions = [...HIFZ_QUALITY_OPTIONS];
  protected readonly yesNoOptions = [...STUDENT_YES_NO_OPTIONS];

  protected readonly form: StudentFormModel = createEmptyStudentForm();
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      Object.assign(this.form, createEmptyStudentForm());
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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    const validationError = this.studentsService.validate(this.form);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.submitting.set(true);
    this.studentsService.createStudent(this.form).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.studentCreated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر تسجيل الطالب. حاول مرة أخرى.',
        );
      },
    });
  }
}
