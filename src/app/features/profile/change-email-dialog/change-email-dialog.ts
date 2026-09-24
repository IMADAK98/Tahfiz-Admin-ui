import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { AuthService } from '../../../core/auth/auth.service';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import {
  createEmptyChangeEmailForm,
  fieldErrorRecord,
  toChangeEmailRequest,
  validateChangeEmailForm,
} from '../dto';

@Component({
  selector: 'app-change-email-dialog',
  imports: [ReactiveFormsModule, InputText, FieldErrorComponent],
  templateUrl: './change-email-dialog.html',
})
export class ChangeEmailDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly currentEmail = input.required<string>();
  readonly saved = output<string>();
  readonly closed = output<void>();

  protected readonly form = formGroupOf(this.fb, createEmptyChangeEmailForm());
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
    this.form.controls['newEmail'].valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFieldError('newEmail'));
    this.form.controls['currentPassword'].valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFieldError('currentPassword'));

    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.form.reset(createEmptyChangeEmailForm());
        this.fields.clearAll();
        this.errorMessage.set(null);
        this.submitting.set(false);
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
    if (this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();
    const draft = {
      newEmail: String(value['newEmail'] ?? ''),
      currentPassword: String(value['currentPassword'] ?? ''),
    };
    const errors = validateChangeEmailForm(draft);
    this.errorMessage.set(null);
    if (this.fields.applyMap(fieldErrorRecord(errors))) {
      return;
    }

    const body = toChangeEmailRequest(draft);
    this.submitting.set(true);
    this.auth.changeEmail(body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.emailChanged);
        this.saved.emit(body.newEmail);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const banner = nestSubmitBanner(
          error,
          this.fields,
          this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
          error instanceof ApiError ? error.message : 'تعذّر تغيير البريد',
        );
        if (this.fields.hasAny()) {
          this.errorMessage.set(banner);
          return;
        }
        this.toastMessage.notifyErrorBody(banner ?? 'تعذّر تغيير البريد');
      },
    });
  }
}
