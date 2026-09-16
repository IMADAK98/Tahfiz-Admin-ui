import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Checkbox } from 'primeng/checkbox';
import { ApiError } from '../../core/api/api-error';
import { CenterSignupService } from './center-signup.service';

@Component({
  selector: 'app-center-signup',
  imports: [FormsModule, RouterLink, Checkbox],
  templateUrl: './center-signup.html',
})
export class CenterSignupComponent {
  private readonly signupApi = inject(CenterSignupService);

  protected adminName = '';
  protected adminEmail = '';
  protected adminPhone = '';
  protected adminBirthDate = '';
  protected adminAddress = '';
  protected adminNationality = '';
  protected centerName = '';
  protected centerAddress = '';
  protected adminIdentificationNumber = '';
  protected adminPassportNumber = '';
  protected usePassport = false;

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showSuccess = signal(false);

  onIdModeChange(): void {
    if (this.usePassport) {
      this.adminIdentificationNumber = '';
    } else {
      this.adminPassportNumber = '';
    }
  }

  onSubmit(htmlForm: HTMLFormElement, form: NgForm): void {
    if (form.invalid || !htmlForm.checkValidity()) {
      htmlForm.reportValidity();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.signupApi.submitCenterSignup({
      adminName: this.adminName,
      adminEmail: this.adminEmail,
      adminPhone: this.adminPhone,
      adminBirthDate: this.adminBirthDate,
      adminAddress: this.adminAddress,
      adminNationality: this.adminNationality,
      centerName: this.centerName,
      centerAddress: this.centerAddress,
      adminIdentificationNumber: this.adminIdentificationNumber,
      adminPassportNumber: this.adminPassportNumber,
      usePassport: this.usePassport,
    }).subscribe({
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
