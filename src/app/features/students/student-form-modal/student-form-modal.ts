import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { EDUCATION_STAGE_OPTIONS, HIFZ_QUALITY_OPTIONS, STUDENT_YES_NO_OPTIONS } from '../enums';
import { StudentFormModel, createEmptyStudentForm } from '../dto';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-form-modal',
  imports: [ReactiveFormsModule, Button, InputText, Select, FieldErrorComponent],
  templateUrl: './student-form-modal.html',
  styleUrl: './student-form-modal.scss',
})
export class StudentFormModalComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly educationStageOptions = [...EDUCATION_STAGE_OPTIONS];
  protected readonly hifzQualityOptions = [...HIFZ_QUALITY_OPTIONS];
  protected readonly yesNoOptions = [...STUDENT_YES_NO_OPTIONS];

  protected readonly form = formGroupOf(this.fb, createEmptyStudentForm());
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  protected clearFieldError(...fieldNames: string[]): void {
    this.fields.clear(...fieldNames);
    if (!this.fields.hasAny()) {
      this.errorMessage.set(null);
    }
  }

  constructor() {
    const nestKey: Record<string, string> = { fullName: 'name' };
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(nestKey[name] ?? name);
      });
    }

    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.form.reset(createEmptyStudentForm());
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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const value = this.form.getRawValue() as StudentFormModel;
    if (this.fields.applyMap(this.studentsService.validate(value))) {
      return;
    }

    this.submitting.set(true);
    this.studentsService.createStudent(value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.studentCreated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر تسجيل الطالب. حاول مرة أخرى.',
          ),
        );
      },
    });
  }
}
