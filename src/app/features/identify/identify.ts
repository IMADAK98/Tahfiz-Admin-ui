import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { ApiError } from '../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../core/api/field-error-state';
import { IdentifiedStudent, RegisterTokenValidation } from '../../core/api/models/identify.model';
import { allowSignupFromIdentify, INVITE_IDENTIFIED_STATE } from '../../core/auth/invite-identify';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { IdentifyTokenStatus } from './enums/identify-status.enum';
import { IdentifyService } from './identify.service';

@Component({
  selector: 'app-identify',
  imports: [ReactiveFormsModule, RouterLink, Button, Checkbox, InputText, FieldErrorComponent],
  templateUrl: './identify.html',
  styleUrl: './identify.scss',
})
export class IdentifyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly identify = inject(IdentifyService);
  private readonly toast = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  protected readonly IdentifyTokenStatus = IdentifyTokenStatus;
  protected readonly tokenStatus = signal<IdentifyTokenStatus>(IdentifyTokenStatus.Loading);
  protected readonly tokenContext = signal<RegisterTokenValidation | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly foundStudent = signal<IdentifiedStudent | null>(null);
  protected readonly activateDone = signal(false);
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
  protected termHint = '';
  protected readonly form = this.fb.group({
    usePassport: [false],
    identification: [''],
    passportNumber: [''],
  });

  constructor() {
    for (const name of Object.keys(this.form.controls)) {
      this.form.get(name)?.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
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

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.token = (qp.get('token') ?? '').trim();
    this.termHint = (qp.get('term') ?? '').trim();

    if (!this.token) {
      this.tokenStatus.set(IdentifyTokenStatus.Missing);
      return;
    }

    this.identify.validateToken(this.token).subscribe({
      next: (data) => {
        this.tokenContext.set(data);
        this.tokenStatus.set(IdentifyTokenStatus.Valid);
      },
      error: () => {
        this.tokenStatus.set(IdentifyTokenStatus.Invalid);
        this.errorMessage.set('رابط الدعوة غير صالح أو منتهٍ.');
      },
    });
  }

  onIdModeChange(): void {
    if (this.usingPassport()) {
      this.form.controls['identification'].setValue('', { emitEvent: false });
      this.clearFieldError('identification');
    } else {
      this.form.controls['passportNumber'].setValue('', { emitEvent: false });
      this.clearFieldError('passportNumber');
    }
  }

  onSubmit(): void {
    if (this.tokenStatus() !== IdentifyTokenStatus.Valid) {
      return;
    }
    const value = this.form.getRawValue();
    const idOk = value.usePassport ? String(value.passportNumber).trim() : String(value.identification).trim();
    if (!idOk) {
      this.fields.applyMap(
        value.usePassport
          ? { passportNumber: 'رقم جواز السفر مطلوب' }
          : { identification: 'رقم الهوية مطلوب' },
      );
      return;
    }

    this.errorMessage.set(null);
    this.foundStudent.set(null);
    this.fields.clearAll();
    this.submitting.set(true);

    this.identify
      .lookup({
        usePassport: !!value.usePassport,
        identification: String(value.identification),
        passportNumber: String(value.passportNumber),
      })
      .subscribe({
        next: (student) => {
          if (!student) {
            this.submitting.set(false);
            this.errorMessage.set('لم يُعثر على طالب بهذه الهوية. يمكنك التسجيل كطالب جديد.');
            return;
          }
          this.foundStudent.set(student);
          this.activateFound(student);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          const banner = nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر التحقق. حاول مرة أخرى.',
          );
          if (this.fields.hasAny()) {
            this.errorMessage.set(banner);
            return;
          }
          if (error instanceof ApiError && error.httpStatus === 404) {
            this.errorMessage.set('لم يُعثر على طالب بهذه الهوية. يمكنك التسجيل كطالب جديد.');
            return;
          }
          this.errorMessage.set(banner);
        },
      });
  }

  private activateFound(student: IdentifiedStudent): void {
    this.identify.activateReturning(this.token, student.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.activateDone.set(true);
        this.toast.notifySuccess(TOAST_I18N.success.identifyActivated);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        // Keep foundStudent visible; show Nest message (e.g. already enrolled)
        const msg =
          error instanceof ApiError
            ? error.message
            : 'تعذّر تفعيل الالتحاق. تواصل مع إدارة المركز.';
        // Map common already-enrolled copy
        if (/already enrolled/i.test(msg)) {
          this.errorMessage.set('هذا الطالب مسجّل مسبقاً في هذه الدورة.');
          this.toast.notifyInfo(TOAST_I18N.info.identifyAlreadyEnrolled);
        } else if (error instanceof ApiError && error.httpStatus === 401) {
          // TODO(Nest): activate-student OpenAPI requires JWT; public flow may 401
          this.errorMessage.set(
            'تم العثور على الطالب، لكن تفعيل الالتحاق يتطلب صلاحية من المركز حالياً. تواصل مع الإدارة.',
          );
        } else {
          this.errorMessage.set(msg);
        }
      },
    });
  }

  goToSignup(): void {
    allowSignupFromIdentify(this.token);
    void this.router.navigate(['/signup/student'], {
      queryParams: {
        token: this.token || undefined,
        term: this.termHint || this.tokenContext()?.termName || undefined,
      },
      state: { [INVITE_IDENTIFIED_STATE]: this.token },
    });
  }

  goHome(): void {
    void this.router.navigateByUrl('/');
  }

  goAdminLogin(): void {
    void this.router.navigateByUrl('/login');
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
