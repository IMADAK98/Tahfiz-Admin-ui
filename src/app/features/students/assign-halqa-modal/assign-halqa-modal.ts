import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { ActiveHalqaOption } from '../../../core/api/models/halqa.model';
import { CreatedManualStudent } from '../../../core/api/models/student.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { STUDENTS_I18N } from '../i18n/students-i18n';
import { StudentsService } from '../students.service';

type AssignStep = 'confirm' | 'select';

@Component({
  selector: 'app-assign-halqa-modal',
  imports: [ReactiveFormsModule, TranslatePipe, Button, Select, FieldErrorComponent],
  templateUrl: './assign-halqa-modal.html',
  styleUrl: './assign-halqa-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'assign-halqa-modal-host' },
})
export class AssignHalqaModalComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly auth = inject(AuthService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly student = input.required<CreatedManualStudent>();
  readonly assigned = output<void>();
  readonly skipped = output<void>();

  protected readonly i18n = STUDENTS_I18N.assignHalqa;
  protected readonly step = signal<AssignStep>('confirm');
  protected readonly studentId = signal<number | null>(null);
  protected readonly selectableHalqas = signal<ActiveHalqaOption[]>([]);
  protected readonly listedHalqaCount = signal(0);
  protected readonly pickersLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedHalqaId = new FormControl<number | null>(null);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  constructor() {
    this.selectedHalqaId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.fields.clear('halqaId');
      if (!this.fields.hasAny()) {
        this.errorMessage.set(null);
      }
    });

    effect(() => {
      const created = this.student();
      untracked(() => this.reset(created));
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
    this.skipped.emit();
  }

  protected onYes(): void {
    this.step.set('select');
    this.ensureStudentId();
    this.loadHalqas();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const studentId = this.studentId();
    if (!studentId) {
      this.errorMessage.set(this.translate.instant(this.i18n.missingId));
      return;
    }

    const halqaId = this.selectedHalqaId.value;
    if (!halqaId) {
      this.fields.applyMap({
        halqaId: this.translate.instant(this.i18n.pickHalqa),
      });
      return;
    }

    this.submitting.set(true);
    this.studentsService.enrollStudent(halqaId, studentId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.studentAssignedToHalqa);
        this.assigned.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            error instanceof ApiError
              ? error.message
              : this.translate.instant(this.i18n.enrollFailed),
          ),
        );
      },
    });
  }

  protected saveDisabled(): boolean {
    return (
      this.submitting() ||
      this.pickersLoading() ||
      !this.selectableHalqas().length ||
      !this.studentId() ||
      !this.selectedHalqaId.value
    );
  }

  protected emptyCopyKey(): string {
    return this.listedHalqaCount() > 0 ? this.i18n.allFull : this.i18n.empty;
  }

  private reset(created: CreatedManualStudent): void {
    this.step.set('confirm');
    this.studentId.set(created.id ?? null);
    this.selectableHalqas.set([]);
    this.listedHalqaCount.set(0);
    this.selectedHalqaId.setValue(null);
    this.fields.clearAll();
    this.errorMessage.set(null);
    this.pickersLoading.set(false);
    this.submitting.set(false);
  }

  private ensureStudentId(): void {
    const current = this.student();
    if (current.id && current.id > 0) {
      this.studentId.set(current.id);
      return;
    }
    this.studentsService.resolveCreatedStudentId(current).subscribe({
      next: (resolved) => this.studentId.set(resolved.id),
      error: () => this.studentId.set(null),
    });
  }

  private loadHalqas(): void {
    const centerId = this.auth.getClaims()?.centerId;
    if (!centerId) {
      this.errorMessage.set(this.translate.instant(this.i18n.centerUnknown));
      return;
    }

    this.pickersLoading.set(true);
    this.studentsService.loadAssignableHalqas(centerId).subscribe({
      next: ({ all, selectable }) => {
        this.listedHalqaCount.set(all.length);
        this.selectableHalqas.set(selectable);
        this.pickersLoading.set(false);
      },
      error: (error: unknown) => {
        this.pickersLoading.set(false);
        this.errorMessage.set(
          error instanceof ApiError ? error.message : this.translate.instant(this.i18n.empty),
        );
      },
    });
  }
}
