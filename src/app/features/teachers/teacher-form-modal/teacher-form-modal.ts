import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
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
  imports: [FormsModule, Button, Select],
  templateUrl: './teacher-form-modal.html',
  styleUrl: './teacher-form-modal.scss',
})
export class TeacherFormModalComponent {
  private readonly teachersService = inject(TeachersService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);

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

  protected readonly form: TeacherFormModel = createEmptyTeacherForm();
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const teacher = this.teacher();
      Object.assign(this.form, teacher ? mapTeacherDetailToForm(teacher) : createEmptyTeacherForm());
      this.errorMessage.set(null);
    });
  }

  protected get isAdd(): boolean {
    return this.mode() === 'add';
  }

  protected get title(): string {
    return this.isAdd ? 'إضافة معلّم' : 'تعديل المعلّم';
  }

  protected isAgeGroupChecked(value: TeacherAgeGroup): boolean {
    return this.form.ageGroups.includes(value);
  }

  protected toggleAgeGroup(value: TeacherAgeGroup, checked: boolean): void {
    this.form.ageGroups =
      checked ? [...this.form.ageGroups, value] : this.form.ageGroups.filter((item) => item !== value);
  }

  protected isWorkPeriodChecked(value: TeacherWorkPeriod): boolean {
    return this.form.workPeriods.includes(value);
  }

  protected toggleWorkPeriod(value: TeacherWorkPeriod, checked: boolean): void {
    this.form.workPeriods =
      checked ? [...this.form.workPeriods, value] : this.form.workPeriods.filter((item) => item !== value);
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

    const validationError = this.teachersService.validate(this.form, 'add');
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.submitting.set(true);
    this.teachersService.createTeacher(this.form, centerId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherCreated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر إضافة المعلّم. حاول مرة أخرى.',
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

    const validationError = this.teachersService.validate(this.form, 'edit');
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.submitting.set(true);
    this.teachersService.updateTeacher(profileId, this.form).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.teacherUpdated);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر حفظ التعديلات. حاول مرة أخرى.',
        );
      },
    });
  }
}
