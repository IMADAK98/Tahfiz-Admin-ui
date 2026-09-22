import { Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { ActiveTerm } from '../../../core/api/models/term.model';
import { ActiveStudent } from '../../../core/api/models/student.model';
import { ActiveTeacher } from '../../../core/api/models/teacher.model';
import { AuthService } from '../../../core/auth/auth.service';
import { HALQA_CATEGORY_OPTIONS, HALQA_PERIOD_OPTIONS } from '../enums';
import { CreateHalaqaFormModel, createEmptyCreateHalaqaForm } from '../dto';
import { HalaqatService } from '../halaqat.service';

@Component({
  selector: 'app-create-halaqa-modal',
  imports: [ReactiveFormsModule, TranslatePipe, InputText, Select, FieldErrorComponent],
  templateUrl: './create-halaqa-modal.html',
  styleUrl: './create-halaqa-modal.scss',
})
export class CreateHalaqaModalComponent {
  private readonly halaqatService = inject(HalaqatService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly activeTerm = input.required<ActiveTerm | null>();
  readonly halaqaCreated = output<void>();
  readonly closed = output<void>();

  protected readonly categoryOptions = HALQA_CATEGORY_OPTIONS;
  protected readonly periodOptions = HALQA_PERIOD_OPTIONS;
  protected readonly form = formGroupOf(this.fb, createEmptyCreateHalaqaForm());
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

  protected model(): CreateHalaqaFormModel {
    return this.form.getRawValue() as CreateHalaqaFormModel;
  }
  protected readonly teachers = signal<ActiveTeacher[]>([]);
  protected readonly students = signal<ActiveStudent[]>([]);
  protected readonly pickersLoading = signal(false);
  private readonly studentPicker = viewChild<Select>('studentPicker');

  protected readonly termLabel = computed(() => {
    const term = this.activeTerm();
    if (!term) {
      return 'لا توجد دورة نشطة';
    }
    return `${term.name} — الدورة النشطة`;
  });

  constructor() {
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(name === 'period' ? 'periods' : name === 'studentIds' ? 'studentsIds' : name);
      });
    }
    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.loadPickers();
    });
  }

  protected canSubmit(): boolean {
    return !!this.activeTerm() && !this.pickersLoading();
  }

  protected selectedTeacher(): ActiveTeacher | null {
    const teacherId = this.model().teacherId;
    if (!teacherId) {
      return null;
    }
    return this.teachers().find((teacher) => teacher.id === teacherId) ?? null;
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
    this.resetForm();
    this.closed.emit();
  }

  protected onTeacherChange(teacherId: number | null): void {
    this.form.controls['teacherId'].setValue(teacherId);
    this.clearFieldError('teacherId');
  }

  protected clearTeacher(): void {
    this.form.controls['teacherId'].setValue(null);
  }

  protected availableStudents(): ActiveStudent[] {
    const selectedIds = new Set(this.model().studentIds);
    return this.students().filter((student) => !selectedIds.has(student.id));
  }

  protected selectedStudents(): ActiveStudent[] {
    const selectedIds = new Set(this.model().studentIds);
    return this.students().filter((student) => selectedIds.has(student.id));
  }

  protected onStudentPicked(studentId: number | null): void {
    if (studentId == null) {
      return;
    }
    const studentIds = this.model().studentIds;
    if (!studentIds.includes(studentId)) {
      this.form.controls['studentIds'].setValue([...studentIds, studentId]);
      this.clearFieldError('studentsIds');
    }
    const picker = this.studentPicker();
    // ponytail: Select keeps the last id, so the same student is a no-op after chip-remove until clear().
    queueMicrotask(() => {
      picker?.clear();
      picker?.hide();
    });
  }

  protected removeStudent(studentId: number): void {
    this.form.controls['studentIds'].setValue(this.model().studentIds.filter((id) => id !== studentId));
    this.clearFieldError('studentsIds');
  }

  protected shortStudentName(name: string): string {
    return name.replace(/\s*بن\s+\S+\s+/u, ' ').trim();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const term = this.activeTerm();
    if (!term) {
      this.errorMessage.set('لا توجد دورة نشطة — أنشئ دورة من لوحة التحكم أولاً');
      return;
    }

    const validationError = this.halaqatService.validateForm(this.model());
    if (this.fields.applyMap(validationError)) {
      return;
    }

    this.submitting.set(true);
    this.halaqatService.createHalaqa(this.model(), term.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.halaqaCreated);
        this.resetForm();
        this.halaqaCreated.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إنشاء الحلقة. حاول مرة أخرى.',
          ),
        );
      },
    });
  }

  private loadPickers(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    this.pickersLoading.set(true);
    this.halaqatService.loadCreatePickers(centerId).subscribe({
      next: (pickers) => {
        this.teachers.set(pickers.teachers);
        this.students.set(pickers.students);
        this.pickersLoading.set(false);
      },
      error: (error: unknown) => {
        this.pickersLoading.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر تحميل المعلّمين والطلاب',
        );
      },
    });
  }

  private resetForm(): void {
    this.form.reset(createEmptyCreateHalaqaForm());
    this.studentPicker()?.clear();
    this.fields.clearAll();
    this.errorMessage.set(null);
  }
}
