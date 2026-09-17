import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { ApiError } from '../../core/api/api-error';
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
  imports: [FormsModule, RouterLink, Button, Checkbox, DatePicker, InputText],
  templateUrl: './center-signup.html',
  styleUrl: './center-signup.scss',
})
export class CenterSignupComponent {
  private readonly signupApi = inject(CenterSignupService);

  protected readonly IdentityDocumentType = IdentityDocumentType;
  protected readonly today = new Date();
  protected readonly form: CenterSignupFormModel = createEmptyCenterSignupForm();
  protected usePassport = false;
  protected adminBirthDate: Date | null = null;

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showSuccess = signal(false);

  onIdModeChange(): void {
    this.form.identityDocumentType = this.usePassport
      ? IdentityDocumentType.Passport
      : IdentityDocumentType.NationalId;
    if (this.form.identityDocumentType === IdentityDocumentType.Passport) {
      this.form.adminIdentificationNumber = '';
    } else {
      this.form.adminPassportNumber = '';
    }
  }

  onSubmit(): void {
    this.form.adminBirthDate = this.adminBirthDate ? toIsoDate(this.adminBirthDate) : '';
    const validationError = validateCenterSignupForm(this.form);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.signupApi.submitCenterSignup(this.form).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showSuccess.set(true);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'تعذّر إرسال الطلب. حاول مرة أخرى.',
        );
      },
    });
  }
}
