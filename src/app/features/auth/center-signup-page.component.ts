import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Checkbox } from 'primeng/checkbox';
import { ApiError } from '../../core/api/api-error';
import { SignupApiService } from '../../core/api/signup-api.service';
import { buildPendingCenterPayload } from '../../core/signup/pending-center-payload';

@Component({
  selector: 'app-center-signup-page',
  imports: [FormsModule, RouterLink, Checkbox],
  template: `
    <div class="signup-page">
      <div class="signup-wrap">
        <a class="brand-row" routerLink="/">
          <span class="brand-mark" aria-hidden="true">ت</span>
          تحفيظ
        </a>

        <div class="signup-card">
          @if (!showSuccess()) {
            <div class="signup-form-root">
              <h1>تسجيل مركز جديد</h1>
              <p class="signup-sub">طلب انضمام مركز — يراجعه الفريق قبل التفعيل</p>

              @if (errorMessage()) {
                <p class="signup-error" role="alert">{{ errorMessage() }}</p>
              }

              <form
                class="signup-form"
                #htmlForm
                #signupForm="ngForm"
                (ngSubmit)="onSubmit(htmlForm, signupForm)"
                novalidate
                aria-label="نموذج تسجيل مركز جديد"
              >
                <h2 class="section-title">معلومات المدير</h2>

                <div class="input-group">
                  <label for="adminName">اسم المدير <span class="req" title="مطلوب">*</span></label>
                  <input
                    class="input"
                    type="text"
                    id="adminName"
                    name="adminName"
                    [(ngModel)]="adminName"
                    required
                    autocomplete="name"
                    [disabled]="submitting()"
                  />
                </div>

                <div class="id-block">
                  <label class="check-row">
                    <p-checkbox
                      [(ngModel)]="usePassport"
                      name="noNationalId"
                      [binary]="true"
                      inputId="noNationalId"
                      (onChange)="onIdModeChange()"
                      [disabled]="submitting()"
                    />
                    <span>لا يوجد رقم هوية</span>
                  </label>
                  <p class="hint">اختر رقم الهوية الوطنية أو جواز السفر — أحدهما مطلوب.</p>

                  @if (!usePassport) {
                    <div class="input-group">
                      <label for="adminIdentificationNumber">
                        رقم الهوية الوطنية <span class="req">*</span>
                      </label>
                      <input
                        class="input"
                        type="text"
                        id="adminIdentificationNumber"
                        name="adminIdentificationNumber"
                        [(ngModel)]="adminIdentificationNumber"
                        inputmode="numeric"
                        autocomplete="off"
                        required
                        [disabled]="submitting()"
                      />
                    </div>
                  } @else {
                    <div class="input-group">
                      <label for="adminPassportNumber">رقم جواز السفر <span class="req">*</span></label>
                      <input
                        class="input"
                        type="text"
                        id="adminPassportNumber"
                        name="adminPassportNumber"
                        [(ngModel)]="adminPassportNumber"
                        autocomplete="off"
                        required
                        [disabled]="submitting()"
                      />
                    </div>
                  }
                </div>

                <div class="input-group">
                  <label for="adminEmail">البريد الإلكتروني <span class="req">*</span></label>
                  <input
                    class="input"
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    [(ngModel)]="adminEmail"
                    required
                    autocomplete="email"
                    [disabled]="submitting()"
                  />
                </div>

                <div class="input-group">
                  <label for="adminPhone">رقم الجوال <span class="req">*</span></label>
                  <input
                    class="input"
                    type="tel"
                    id="adminPhone"
                    name="adminPhone"
                    [(ngModel)]="adminPhone"
                    required
                    autocomplete="tel"
                    [disabled]="submitting()"
                  />
                </div>

                <div class="input-group">
                  <label for="adminBirthDate">تاريخ الميلاد <span class="req">*</span></label>
                  <input
                    class="input"
                    type="date"
                    id="adminBirthDate"
                    name="adminBirthDate"
                    [(ngModel)]="adminBirthDate"
                    required
                    [disabled]="submitting()"
                  />
                </div>

                <div class="input-group">
                  <label for="adminAddress">عنوان المدير <span class="req">*</span></label>
                  <input
                    class="input"
                    type="text"
                    id="adminAddress"
                    name="adminAddress"
                    [(ngModel)]="adminAddress"
                    required
                    autocomplete="street-address"
                    [disabled]="submitting()"
                  />
                </div>

                <div class="input-group">
                  <label for="adminNationality">الجنسية <span class="req">*</span></label>
                  <input
                    class="input"
                    type="text"
                    id="adminNationality"
                    name="adminNationality"
                    [(ngModel)]="adminNationality"
                    required
                    [disabled]="submitting()"
                  />
                </div>

                <h2 class="section-title">معلومات المركز</h2>

                <div class="input-group">
                  <label for="centerName">اسم المركز <span class="req">*</span></label>
                  <input
                    class="input"
                    type="text"
                    id="centerName"
                    name="centerName"
                    [(ngModel)]="centerName"
                    required
                    [disabled]="submitting()"
                  />
                </div>

                <div class="input-group">
                  <label for="centerAddress">عنوان المركز <span class="req">*</span></label>
                  <input
                    class="input"
                    type="text"
                    id="centerAddress"
                    name="centerAddress"
                    [(ngModel)]="centerAddress"
                    required
                    [disabled]="submitting()"
                  />
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="submitting()">
                  {{ submitting() ? 'جاري الإرسال…' : 'تسجيل' }}
                </button>
              </form>
            </div>
          } @else {
            <div class="success-panel show" role="status">
              <div class="success-icon" aria-hidden="true">✓</div>
              <h2>تم إرسال طلبك</h2>
              <p>سنراجعه، ثم نرسل إليك بريدًا عند التفعيل</p>
              <a class="btn btn-primary btn-lg" routerLink="/login">تسجيل الدخول</a>
            </div>
          }
        </div>

        <p class="signup-footer-links">
          <a routerLink="/login">تسجيل الدخول</a>
          <a routerLink="/">العودة للرئيسية</a>
        </p>
      </div>
    </div>
  `,
})
export class CenterSignupPageComponent {
  private readonly signupApi = inject(SignupApiService);

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

    const payload = buildPendingCenterPayload({
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
    });

    this.signupApi.submitPendingCenterRequest(payload).subscribe({
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
