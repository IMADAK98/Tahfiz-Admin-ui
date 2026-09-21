import { Component, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CreateTermFormModel,
  canPickHolidayDates,
  createEmptyCreateTermForm,
} from '../dto';
import { TermsService } from '../terms.service';

@Component({
  selector: 'app-create-term-modal',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-term-modal.html',
  styleUrl: './create-term-modal.scss',
})
export class CreateTermModalComponent {
  private readonly termsService = inject(TermsService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly termCreated = output<void>();
  readonly closed = output<void>();

  protected readonly form = formGroupOf(this.fb, createEmptyCreateTermForm());
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

  protected model(): CreateTermFormModel {
    return this.form.getRawValue() as CreateTermFormModel;
  }

  constructor() {
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(name);
      });
    }
  }

  protected holidaysEnabled(): boolean {
    return canPickHolidayDates(this.model());
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

  protected addHoliday(): void {
    const value = this.model();
    const date = value.pendingHolidayDate;
    if (!date || !this.holidaysEnabled()) {
      return;
    }
    if (date < value.startDate || date > value.endDate) {
      this.fields.applyMap({ holidayDates: 'يجب أن تقع أيام الإجازة ضمن فترة الدورة' });
      return;
    }
    if (value.holidayDates.includes(date)) {
      this.fields.applyMap({ holidayDates: 'هذا التاريخ مضاف مسبقاً' });
      return;
    }
    this.form.patchValue({
      holidayDates: [...value.holidayDates, date].sort(),
      pendingHolidayDate: '',
    });
    this.clearFieldError('holidayDates');
    this.errorMessage.set(null);
  }

  protected removeHoliday(date: string): void {
    this.form.controls['holidayDates'].setValue(
      this.model().holidayDates.filter((item) => item !== date),
    );
    this.clearFieldError('holidayDates');
  }

  protected formatHolidayLabel(isoDate: string): string {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return new Intl.DateTimeFormat('ar', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    const value = this.model();
    if (this.fields.applyMap(this.termsService.validateForm(value))) {
      return;
    }

    this.submitting.set(true);
    this.termsService.createTerm(value, centerId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.termCreated);
        this.resetForm();
        this.termCreated.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إنشاء الدورة. حاول مرة أخرى.',
          ),
        );
      },
    });
  }

  private resetForm(): void {
    this.form.reset(createEmptyCreateTermForm());
    this.fields.clearAll();
    this.errorMessage.set(null);
  }
}
