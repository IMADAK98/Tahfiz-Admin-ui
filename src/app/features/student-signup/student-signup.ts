import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import {
  StudentSignupFormValues,
  validateStudentSignupForm,
} from './dto/student-signup-form.dto';
import { StudentSignupService } from './student-signup.service';

@Component({
  selector: 'app-student-signup',
  imports: [ReactiveFormsModule, RouterLink, Button, Checkbox, InputText, Select, FieldErrorComponent],
  templateUrl: './student-signup.html',
  styleUrl: './student-signup.scss',
})
export class StudentSignupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly signup = inject(StudentSignupService);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

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
  protected readonly form = this.fb.group({
    name: [''],
    email: [''],
    phone: [''],
    birthDate: [''],
    address: [''],
    educationStage: [EducationStage.ElementarySchool as EducationStage | ''],
    usePassport: [false],
    identificationNumber: [''],
    passportNumber: [''],
    parentName: [''],
    parentPhone: [''],
    memorization: ['partial' as MemorizationLevel],
    surahFrom: this.fb.control<number | null>(1),
    surahTo: this.fb.control<number | null>(12),
    hifzQuality: [HifzQuality.NonHafiz],
    memDetail: [''],
  });

  constructor() {
    for (const name of Object.keys(this.form.controls)) {
      this.form.get(name)?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        if (name === 'memorization') {
          this.onMemorizationChange();
          return;
        }
        if (name === 'usePassport') {
          this.onIdModeChange();
          return;
        }
        this.clearFieldError(name);
      });
    }
  }

  protected usingPassport(): boolean {
    return !!this.form.controls['usePassport'].value;
  }

  protected memorizationLevel(): MemorizationLevel {
    return this.form.controls['memorization'].value as MemorizationLevel;
  }

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
    if (this.usingPassport()) {
      this.form.controls['identificationNumber'].setValue('', { emitEvent: false });
      this.clearFieldError('identificationNumber');
    } else {
      this.form.controls['passportNumber'].setValue('', { emitEvent: false });
      this.clearFieldError('passportNumber');
    }
  }

  onMemorizationChange(): void {
    const memorization = this.form.controls['memorization'].value as MemorizationLevel;
    const mapped = mapMemorizationToHifz(memorization);
    this.form.controls['hifzQuality'].setValue(mapped.hifzQuality, { emitEvent: false });
    this.clearFieldError('hifzQuality', 'isHafiz');
    if (memorization === 'khatm') {
      this.form.patchValue({ surahFrom: 1, surahTo: 114 }, { emitEvent: false });
    } else if (memorization === 'none') {
      this.form.patchValue({ surahFrom: 1, surahTo: 1 }, { emitEvent: false });
    }
  }

  goStep2(): void {
    this.errorMessage.set(null);
    this.form.markAllAsTouched();
    const value = this.signupValue();
    if (this.fields.applyMap(validateStudentSignupForm(value, 1))) {
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

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.fields.applyMap(validateStudentSignupForm(this.signupValue(), 2))) {
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
    const latest = this.form.getRawValue();

    this.signup
      .submit({
        name: String(latest.name),
        email: String(latest.email),
        phone: String(latest.phone),
        birthDate: String(latest.birthDate),
        address: String(latest.address),
        educationStage: latest.educationStage as EducationStage,
        usePassport: !!latest.usePassport,
        identificationNumber: String(latest.identificationNumber),
        passportNumber: String(latest.passportNumber),
        parentPhone: String(latest.parentPhone),
        parentName: String(latest.parentName),
        memorization: latest.memorization as MemorizationLevel,
        surahFrom: latest.surahFrom,
        surahTo: latest.surahTo,
        hifzQuality: latest.hifzQuality as HifzQuality,
        memDetail: String(latest.memDetail),
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


  private signupValue(): StudentSignupFormValues {
    const value = this.form.getRawValue();
    return {
      name: String(value.name ?? ''),
      email: String(value.email ?? ''),
      phone: String(value.phone ?? ''),
      birthDate: String(value.birthDate ?? ''),
      address: String(value.address ?? ''),
      educationStage: value.educationStage as EducationStage | '',
      usePassport: !!value.usePassport,
      identificationNumber: String(value.identificationNumber ?? ''),
      passportNumber: String(value.passportNumber ?? ''),
      parentPhone: String(value.parentPhone ?? ''),
      parentName: String(value.parentName ?? ''),
      memorization: value.memorization as MemorizationLevel,
      surahFrom: value.surahFrom,
      surahTo: value.surahTo,
      hifzQuality: value.hifzQuality as HifzQuality,
      memDetail: String(value.memDetail ?? ''),
      token: this.token,
    };
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
