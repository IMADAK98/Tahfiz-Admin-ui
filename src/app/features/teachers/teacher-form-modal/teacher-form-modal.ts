import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { AuthService } from '../../../core/auth/auth.service';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { TeacherAgeGroup, TeacherWorkPeriod } from '../../../core/api/models/teacher.model';
import {
  TEACHER_AGE_GROUP_OPTIONS,
  TEACHER_QUALIFICATION_OPTIONS,
  TEACHER_TAJWEED_LEVEL_OPTIONS,
  TEACHER_WORK_PERIOD_OPTIONS,
  TEACHER_YES_NO_OPTIONS,
} from '../enums';
import {
  TeacherDetailViewModel,
  TeacherFormMode,
  TeacherFormModel,
  createEmptyTeacherForm,
  mapTeacherDetailToForm,
} from '../dto';
import { TeachersService } from '../teachers.service';

@Component({
  selector: 'app-teacher-form-modal',
  imports: [ReactiveFormsModule, Button, InputText, Select, FieldErrorComponent],
  templateUrl: './teacher-form-modal.html',
  styleUrl: './teacher-form-modal.scss',
})
export class TeacherFormModalComponent {
  private readonly teachersService = inject(TeachersService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<TeacherFormMode>();
  readonly teacher = input<TeacherDetailViewModel | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly qualificationOptions = [...TEACHER_QUALIFICATION_OPTIONS];
  protected readonly tajweedOptions = TEACHER_TAJWEED_LEVEL_OPTIONS;
  protected readonly ageGroupOptions = TEACHER_AGE_GROUP_OPTIONS;
  protected readonly workPeriodOptions = TEACHER_WORK_PERIOD_OPTIONS;
  protected readonly yesNoOptions = [...TEACHER_YES_NO_OPTIONS];

  protected readonly form = formGroupOf(this.fb, createEmptyTeacherForm());
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
    const nestKey: Record<string, string> = {
      ageGroups: 'teachingAgeGroup',
      workPeriods: 'availableWorkPeriod',
    };
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(name === 'fullName' ? 'teacherName' : (nestKey[name] ?? name));
      });
    }

    effect(() => {
      if (!this.visible()) {
        return;
      }
      const teacher = this.teacher();
      untracked(() => {
        this.form.reset(teacher ? mapTeacherDetailToForm(teacher) : createEmptyTeacherForm());
        this.fields.clearAll();
        this.errorMessage.set(null);
      });
    });
  }

  protected get isAdd(): boolean {
    return this.mode() === 'add';
  }

  protected get title(): string {
    return this.isAdd ? 'إضافة معلّم' : 'تعديل المعلّم';
  }

  private model(): TeacherFormModel {
    return this.form.getRawValue() as TeacherFormModel;
  }

  protected isAgeGroupChecked(value: TeacherAgeGroup): boolean {
    return this.model().ageGroups.includes(value);
  }

  protected toggleAgeGroup(value: TeacherAgeGroup, checked: boolean): void {
    const ageGroups = this.model().ageGroups;
    this.form.controls['ageGroups'].setValue(
      checked ? [...ageGroups, value] : ageGroups.filter((item) => item !== value),
    );
  }

  protected isWorkPeriodChecked(value: TeacherWorkPeriod): boolean {
    return this.model().workPeriods.includes(value);
  }

  protected toggleWorkPeriod(value: TeacherWorkPeriod, checked: boolean): void {
    const workPeriods = this.model().workPeriods;
    this.form.controls['workPeriods'].setValue(
      checked ? [...workPeriods, value] : workPeriods.filter((item) => item !== value),
    );
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

    if (this.mode() === 'add') {
      this.submitAdd();
    } else {
      this.submitEdit();
    }
  }

  private submitAdd(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    const value = this.model();
    if (this.fields.applyMap(this.teachersService.validate(value, 'add'))) {
      return;
    }

    this.submitting.set(true);
    this.teachersService.createTeacher(value, centerId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherCreated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إضافة المعلّم. حاول مرة أخرى.',
          ),
        );
      },
    });
  }

  private submitEdit(): void {
    const profileId = this.teacher()?.profileId;
    if (!profileId) {
      this.errorMessage.set('تعذّر تحديد ملف المعلّم للتعديل');
      return;
    }

    const value = this.model();
    if (this.fields.applyMap(this.teachersService.validate(value, 'edit'))) {
      return;
    }

    this.submitting.set(true);
    this.teachersService.updateTeacher(profileId, value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherUpdated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر حفظ التعديلات. حاول مرة أخرى.',
          ),
        );
      },
    });
  }
}
