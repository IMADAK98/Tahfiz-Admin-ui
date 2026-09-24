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
  CHANGE_PASSWORD_MIN_LENGTH,
  createEmptyChangePasswordForm,
  fieldErrorRecord,
  toChangePasswordRequest,
  validateChangePasswordForm,
} from '../dto';

@Component({
  selector: 'app-change-password-dialog',
  imports: [ReactiveFormsModule, InputText, FieldErrorComponent],
  templateUrl: './change-password-dialog.html',
})
export class ChangePasswordDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly minLength = CHANGE_PASSWORD_MIN_LENGTH;
  protected readonly form = formGroupOf(this.fb, createEmptyChangePasswordForm());
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
    this.form.controls['currentPassword'].valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFieldError('currentPassword'));
    this.form.controls['newPassword'].valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFieldError('newPassword', 'confirmPassword'));
    this.form.controls['confirmPassword'].valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFieldError('confirmPassword'));

    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.form.reset(createEmptyChangePasswordForm());
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
    const errors = validateChangePasswordForm({
      currentPassword: String(value['currentPassword'] ?? ''),
      newPassword: String(value['newPassword'] ?? ''),
      confirmPassword: String(value['confirmPassword'] ?? ''),
    });
    this.errorMessage.set(null);
    if (this.fields.applyMap(fieldErrorRecord(errors))) {
      return;
    }

    this.submitting.set(true);
    this.auth
      .changePassword(
        toChangePasswordRequest({
          currentPassword: String(value['currentPassword'] ?? ''),
          newPassword: String(value['newPassword'] ?? ''),
          confirmPassword: String(value['confirmPassword'] ?? ''),
        }),
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toastMessage.notifySuccess(TOAST_I18N.success.passwordChanged);
          this.saved.emit();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          const banner = nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            error instanceof ApiError ? error.message : 'تعذّر تغيير كلمة المرور',
          );
          if (this.fields.hasAny()) {
            this.errorMessage.set(banner);
            return;
          }
          this.toastMessage.notifyErrorBody(banner ?? 'تعذّر تغيير كلمة المرور');
        },
      });
  }
}
