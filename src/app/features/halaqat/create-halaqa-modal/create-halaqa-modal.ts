import { Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
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
  imports: [FormsModule, TranslatePipe, Select],
  templateUrl: './create-halaqa-modal.html',
  styleUrl: './create-halaqa-modal.scss',
})
export class CreateHalaqaModalComponent {
  private readonly halaqatService = inject(HalaqatService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);

  readonly visible = input.required<boolean>();
  readonly activeTerm = input.required<ActiveTerm | null>();
  readonly halaqaCreated = output<void>();
  readonly closed = output<void>();

  protected readonly categoryOptions = HALQA_CATEGORY_OPTIONS;
  protected readonly periodOptions = HALQA_PERIOD_OPTIONS;
  protected readonly form: CreateHalaqaFormModel = createEmptyCreateHalaqaForm();
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
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
    const teacherId = this.form.teacherId;
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
    this.form.teacherId = teacherId;
  }

  protected clearTeacher(): void {
    this.form.teacherId = null;
  }

  protected availableStudents(): ActiveStudent[] {
    const selectedIds = new Set(this.form.studentIds);
    return this.students().filter((student) => !selectedIds.has(student.id));
  }

  protected selectedStudents(): ActiveStudent[] {
    const selectedIds = new Set(this.form.studentIds);
    return this.students().filter((student) => selectedIds.has(student.id));
  }

  protected onStudentPicked(studentId: number | null): void {
    if (studentId == null) {
      return;
    }
    if (!this.form.studentIds.includes(studentId)) {
      this.form.studentIds = [...this.form.studentIds, studentId];
    }
    const picker = this.studentPicker();
    // ponytail: Select keeps the last id, so the same student is a no-op after chip-remove until clear().
    queueMicrotask(() => {
      picker?.clear();
      picker?.hide();
    });
  }

  protected removeStudent(studentId: number): void {
    this.form.studentIds = this.form.studentIds.filter((id) => id !== studentId);
  }

  protected shortStudentName(name: string): string {
    return name.replace(/\s*بن\s+\S+\s+/u, ' ').trim();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    const term = this.activeTerm();
    if (!term) {
      this.errorMessage.set('لا توجد دورة نشطة — أنشئ دورة من لوحة التحكم أولاً');
      return;
    }

    const validationError = this.halaqatService.validateForm(this.form);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.submitting.set(true);
    this.halaqatService.createHalaqa(this.form, term.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.halaqaCreated);
        this.resetForm();
        this.halaqaCreated.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر إنشاء الحلقة. حاول مرة أخرى.',
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
    Object.assign(this.form, createEmptyCreateHalaqaForm());
    this.studentPicker()?.clear();
    this.errorMessage.set(null);
  }
}
