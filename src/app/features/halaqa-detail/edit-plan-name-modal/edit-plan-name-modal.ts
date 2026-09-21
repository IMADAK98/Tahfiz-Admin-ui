import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-edit-plan-name-modal',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './edit-plan-name-modal.html',
})
export class EditPlanNameModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly planId = input.required<number | null>();
  readonly planName = input.required<string>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly name = new FormControl('', { nonNullable: true });
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
    this.name.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.clearFieldError('name'));
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const planName = this.planName();
      untracked(() => {
        this.name.setValue(planName);
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
    const planId = this.planId();
    const trimmed = this.name.value.trim();
    if (!planId) {
      return;
    }
    if (!trimmed) {
      this.fields.applyMap({
        name: this.translate.instant(HALAQA_DETAIL_I18N.validation.planName),
      });
      return;
    }

    this.submitting.set(true);
    this.fields.clearAll();
    this.detailService.updatePlanName(planId, trimmed).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.saved.emit();
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
