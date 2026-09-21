import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ActiveTeacher } from '../../../core/api/models/teacher.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { HALQA_CATEGORY_OPTIONS, HALQA_PERIOD_OPTIONS } from '../../halaqat/enums';
import {
  EditHalaqaFormModel,
  HalaqaDetailViewModel,
  createEditHalaqaForm,
} from '../dto';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-edit-halaqa-modal',
  imports: [ReactiveFormsModule, Select, FieldErrorComponent],
  templateUrl: './edit-halaqa-modal.html',
  styleUrl: './edit-halaqa-modal.scss',
})
export class EditHalaqaModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly detail = input.required<HalaqaDetailViewModel | null>();
  readonly saved = output<HalaqaDetailViewModel>();
  readonly closed = output<void>();

  protected readonly categoryOptions = [...HALQA_CATEGORY_OPTIONS];
  protected readonly periodOptions = [...HALQA_PERIOD_OPTIONS];
  protected readonly form = formGroupOf(this.fb, createEditHalaqaForm({
    id: 0,
    name: '',
    category: null,
    periods: [],
    isActive: true,
    studentLimit: 15,
    teacherId: null,
    teacherName: null,
  }));
  protected readonly teachers = signal<ActiveTeacher[]>([]);
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
  protected readonly pickersLoading = signal(false);

  protected model(): EditHalaqaFormModel {
    return this.form.getRawValue() as EditHalaqaFormModel;
  }

  constructor() {
    const nestKey: Record<string, string> = { period: 'periods' };
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(nestKey[name] ?? name);
      });
    }
    effect(() => {
      const detail = this.detail();
      if (!this.visible() || !detail) {
        return;
      }
      untracked(() => {
        this.form.reset(createEditHalaqaForm(detail));
        this.fields.clearAll();
        this.errorMessage.set(null);
        this.loadTeachers();
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
    const detail = this.detail();
    if (!detail) {
      return;
    }

    this.errorMessage.set(null);
    this.fields.clearAll();
    const raw = this.detailService.validateEditForm(this.model());
    const mapped: Record<string, string> = {};
    for (const [field, key] of Object.entries(raw)) {
      mapped[field] = this.translate.instant(key);
    }
    if (this.fields.applyMap(mapped)) {
      return;
    }

    this.submitting.set(true);
    this.detailService.updateHalqa(detail, this.model()).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.saved.emit(updated);
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

  private loadTeachers(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set(this.translate.instant(HALAQA_DETAIL_I18N.validation.centerUnknown));
      return;
    }

    this.pickersLoading.set(true);
    this.detailService.loadTeacherPickers(centerId).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        this.pickersLoading.set(false);
      },
      error: (error: unknown) => {
        this.pickersLoading.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : '');
      },
    });
  }
}
