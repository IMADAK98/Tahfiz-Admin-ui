import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Checkbox } from 'primeng/checkbox';
import { ApiError } from '../../core/api/api-error';
import {
  CenterSignupFormModel,
  createEmptyCenterSignupForm,
} from './dto/center-signup-form.model';
import { IdentityDocumentType } from './enums/identity-document-type.enum';
import { CenterSignupService } from './center-signup.service';

@Component({
  selector: 'app-center-signup',
  imports: [FormsModule, RouterLink, Checkbox],
  templateUrl: './center-signup.html',
})
export class CenterSignupComponent {
  private readonly signupApi = inject(CenterSignupService);

  protected readonly IdentityDocumentType = IdentityDocumentType;
  protected readonly form: CenterSignupFormModel = createEmptyCenterSignupForm();

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showSuccess = signal(false);

  protected get usePassport(): boolean {
    return this.form.identityDocumentType === IdentityDocumentType.Passport;
  }

  protected set usePassport(value: boolean) {
    this.form.identityDocumentType = value
      ? IdentityDocumentType.Passport
      : IdentityDocumentType.NationalId;
    this.onIdModeChange();
  }

  onIdModeChange(): void {
    if (this.form.identityDocumentType === IdentityDocumentType.Passport) {
      this.form.adminIdentificationNumber = '';
    } else {
      this.form.adminPassportNumber = '';
    }
  }

  onSubmit(htmlForm: HTMLFormElement, form: NgForm): void {
    if (form.invalid || !htmlForm.checkValidity()) {
      htmlForm.reportValidity();
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
