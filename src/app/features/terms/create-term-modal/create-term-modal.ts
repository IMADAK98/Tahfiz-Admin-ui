import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ApiError } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CreateTermFormModel,
  canPickHolidayDates,
  createEmptyCreateTermForm,
} from '../dto';
import { TermsService } from '../terms.service';

@Component({
  selector: 'app-create-term-modal',
  imports: [FormsModule, Dialog],
  templateUrl: './create-term-modal.html',
  styleUrl: './create-term-modal.scss',
})
export class CreateTermModalComponent {
  private readonly termsService = inject(TermsService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);

  readonly visible = input.required<boolean>();
  readonly termCreated = output<void>();
  readonly closed = output<void>();

  protected readonly form: CreateTermFormModel = createEmptyCreateTermForm();
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected holidaysEnabled(): boolean {
    return canPickHolidayDates(this.form);
  }

  protected onVisibleChange(next: boolean): void {
    if (!next) {
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
    const date = this.form.pendingHolidayDate;
    if (!date || !this.holidaysEnabled()) {
      return;
    }
    if (date < this.form.startDate || date > this.form.endDate) {
      this.errorMessage.set('يجب أن تقع أيام الإجازة ضمن فترة الدورة');
      return;
    }
    if (this.form.holidayDates.includes(date)) {
      this.errorMessage.set('هذا التاريخ مضاف مسبقاً');
      return;
    }
    this.form.holidayDates = [...this.form.holidayDates, date].sort();
    this.form.pendingHolidayDate = '';
    this.errorMessage.set(null);
  }

  protected removeHoliday(date: string): void {
    this.form.holidayDates = this.form.holidayDates.filter((item) => item !== date);
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
    this.errorMessage.set(null);

    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set('تعذّر تحديد المركز من الجلسة');
      return;
    }

    const validationError = this.termsService.validateForm(this.form);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.submitting.set(true);
    this.termsService.createTerm(this.form, centerId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'تم إنشاء الدورة',
          detail: 'تم حفظ الدورة بنجاح',
          life: 4000,
        });
        this.resetForm();
        this.termCreated.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر إنشاء الدورة. حاول مرة أخرى.',
        );
      },
    });
  }

  private resetForm(): void {
    Object.assign(this.form, createEmptyCreateTermForm());
    this.errorMessage.set(null);
  }
}
