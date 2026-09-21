import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { createFieldErrorBag, nestSubmitBanner } from '../../core/api/field-error-state';
import { formGroupOf } from '../../core/forms/form-group-of';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import {
  CenterSignupFormModel,
  createEmptyCenterSignupForm,
  toIsoDate,
  validateCenterSignupForm,
} from './dto/center-signup-form.model';
import { IdentityDocumentType } from './enums/identity-document-type.enum';
import { CenterSignupService } from './center-signup.service';

@Component({
  selector: 'app-center-signup',
  imports: [ReactiveFormsModule, RouterLink, Button, Checkbox, DatePicker, InputText],
  templateUrl: './center-signup.html',
  styleUrl: './center-signup.scss',
})
export class CenterSignupComponent {
  private readonly signupApi = inject(CenterSignupService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  protected readonly IdentityDocumentType = IdentityDocumentType;
  protected readonly today = new Date();
  protected readonly form = formGroupOf(this.fb, createEmptyCenterSignupForm());
  protected readonly usePassport = new FormControl(false, { nonNullable: true });
  protected readonly adminBirthDate = new FormControl<Date | null>(null);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();
  protected readonly showSuccess = signal(false);

  protected fieldError(fieldName: string): string | undefined {
    return this.fields.get(fieldName);
  }

  protected clearFieldError(fieldName: string): void {
    this.fields.clear(fieldName);
    if (!this.fields.hasAny()) {
      this.errorMessage.set(null);
    }
  }

  protected model(): CenterSignupFormModel {
    return this.form.getRawValue() as CenterSignupFormModel;
  }

  constructor() {
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(name);
      });
    }
    this.adminBirthDate.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearFieldError('adminBirthDate');
    });
  }

  onIdModeChange(): void {
    const identityDocumentType = this.usePassport.value
      ? IdentityDocumentType.Passport
      : IdentityDocumentType.NationalId;
    this.form.patchValue({ identityDocumentType });
    if (identityDocumentType === IdentityDocumentType.Passport) {
      this.form.controls['adminIdentificationNumber'].setValue('');
      this.clearFieldError('adminIdentificationNumber');
    } else {
      this.form.controls['adminPassportNumber'].setValue('');
      this.clearFieldError('adminPassportNumber');
    }
  }

  onSubmit(): void {
    const birth = this.adminBirthDate.value;
    this.form.controls['adminBirthDate'].setValue(birth ? toIsoDate(birth) : '');
    this.fields.clearAll();
    this.errorMessage.set(null);
    const value = this.model();
    if (this.fields.applyMap(validateCenterSignupForm(value))) {
      return;
    }
    this.submitting.set(true);

    this.signupApi.submitCenterSignup(value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showSuccess.set(true);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إرسال الطلب. حاول مرة أخرى.',
          ),
        );
      },
    });
  }
}
