import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { createFieldErrorBag, nestSubmitBanner } from '../../core/api/field-error-state';
import { RegisterTokenValidation } from '../../core/api/models/student-signup.model';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { EDUCATION_STAGE_OPTIONS, EducationStage } from './enums/education-stage.enum';
import { HifzQuality, MemorizationLevel, mapMemorizationToHifz } from './enums/hifz-quality.enum';
import { StudentSignupService } from './student-signup.service';

@Component({
  selector: 'app-student-signup',
  imports: [FormsModule, RouterLink, Button, Checkbox, InputText, Select, FieldErrorComponent],
  templateUrl: './student-signup.html',
  styleUrl: './student-signup.scss',
})
export class StudentSignupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly signup = inject(StudentSignupService);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly educationOptions = [...EDUCATION_STAGE_OPTIONS];
  protected readonly EducationStage = EducationStage;
  protected readonly HifzQuality = HifzQuality;

  protected step = signal<1 | 2>(1);
  protected readonly tokenStatus = signal<'loading' | 'valid' | 'invalid' | 'missing'>('loading');
  protected readonly tokenContext = signal<RegisterTokenValidation | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showSuccess = signal(false);
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

  protected token = '';
  protected name = '';
  protected email = '';
  protected phone = '';
  protected birthDate = '';
  protected address = '';
  protected educationStage: EducationStage | '' = EducationStage.ElementarySchool;
  protected usePassport = false;
  protected identificationNumber = '';
  protected passportNumber = '';
  protected parentName = '';
  protected parentPhone = '';
  protected memorization: MemorizationLevel = 'partial';
  protected surahFrom: number | null = 1;
  protected surahTo: number | null = 12;
  protected hifzQuality: HifzQuality = HifzQuality.NonHafiz;
  protected memDetail = '';

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.token = (qp.get('token') ?? '').trim();
    if (!this.token) {
      this.tokenStatus.set('missing');
      return;
    }
    this.signup.validateToken(this.token).subscribe({
      next: (data) => {
        this.tokenContext.set(data);
        this.tokenStatus.set('valid');
      },
      error: () => {
        this.tokenStatus.set('invalid');
        this.errorMessage.set('رابط التسجيل غير صالح أو منتهٍ. اطلب رابطاً جديداً من المركز.');
      },
    });
  }

  onIdModeChange(): void {
    if (this.usePassport) {
      this.identificationNumber = '';
      this.clearFieldError('identificationNumber');
    } else {
      this.passportNumber = '';
      this.clearFieldError('passportNumber');
    }
  }

  onMemorizationChange(): void {
    const mapped = mapMemorizationToHifz(this.memorization);
    this.hifzQuality = mapped.hifzQuality;
    this.clearFieldError('hifzQuality', 'isHafiz');
    if (this.memorization === 'khatm') {
      this.surahFrom = 1;
      this.surahTo = 114;
    } else if (this.memorization === 'none') {
      this.surahFrom = 1;
      this.surahTo = 1;
    }
  }

  goStep2(htmlForm: HTMLFormElement, form: NgForm): void {
    this.errorMessage.set(null);
    if (form.invalid || !htmlForm.checkValidity()) {
      htmlForm.reportValidity();
      return;
    }
    if (!this.token || this.tokenStatus() !== 'valid') {
      this.errorMessage.set('رابط التسجيل غير صالح. لا يمكن المتابعة.');
      return;
    }
    this.onMemorizationChange();
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goStep1(): void {
    this.step.set(1);
  }

  onSubmit(htmlForm: HTMLFormElement, form: NgForm): void {
    if (form.invalid || !htmlForm.checkValidity()) {
      htmlForm.reportValidity();
      return;
    }
    if (!this.token || this.tokenStatus() !== 'valid') {
      this.errorMessage.set('رابط التسجيل غير صالح. لا يمكن إرسال الطلب.');
      return;
    }

    this.errorMessage.set(null);
    this.fields.clearAll();
    this.submitting.set(true);
    this.onMemorizationChange();

    this.signup
      .submit({
        name: this.name,
        email: this.email,
        phone: this.phone,
        birthDate: this.birthDate,
        address: this.address,
        educationStage: this.educationStage,
        usePassport: this.usePassport,
        identificationNumber: this.identificationNumber,
        passportNumber: this.passportNumber,
        parentPhone: this.parentPhone,
        parentName: this.parentName,
        memorization: this.memorization,
        surahFrom: this.surahFrom,
        surahTo: this.surahTo,
        hifzQuality: this.hifzQuality,
        memDetail: this.memDetail,
        token: this.token,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.showSuccess.set(true);
          // Success toast (feature-triggered) — body-only per TOASTS.md
          this.toast.notifySuccess(TOAST_I18N.success.studentSignupSubmitted);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          const banner = nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إرسال الطلب. حاول مرة أخرى.',
          );
          const step1Fields = [
            'name',
            'email',
            'phone',
            'birthDate',
            'address',
            'educationStage',
            'identificationNumber',
            'passportNumber',
            'parentPhone',
          ];
          if (step1Fields.some((name) => this.fields.get(name))) {
            this.step.set(1);
          }
          this.errorMessage.set(banner);
        },
      });
  }


  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  goIdentify(): void {
    void this.router.navigate(['/identify'], {
      queryParams: this.token ? { token: this.token } : {},
    });
  }

  protected formatExpires(iso: string | undefined): string {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Riyadh',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
}
