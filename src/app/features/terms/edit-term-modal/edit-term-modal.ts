import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { ActiveTerm } from '../../../core/api/models/term.model';
import { readTermEditConflict } from '../../../core/api/term-edit-conflict';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import { createEmptyCreateTermForm } from '../dto';
import {
  buildUpdateTermPayload,
  changedTermRows,
  editTermFormFromTerm,
  formatArabicDate,
  holidayAddError,
  inspectEditTermForm,
  isFrozenHoliday,
  isTermStartLocked,
  todayIsoDate,
} from '../dto/edit-term-validation';
import { TermsService } from '../terms.service';

@Component({
  selector: 'app-edit-term-modal',
  imports: [ReactiveFormsModule, InputText, FieldErrorComponent],
  templateUrl: './edit-term-modal.html',
  styleUrl: './edit-term-modal.scss',
})
export class EditTermModalComponent {
  private readonly termsService = inject(TermsService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly term = input.required<ActiveTerm | null>();
  readonly saved = output<string[]>();
  readonly closed = output<void>();

  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly formTick = signal(0);
  private readonly fields = createFieldErrorBag();
  private opened = false;
  private today = todayIsoDate();
  private originalHolidayDates: string[] = [];

  protected readonly form = formGroupOf(this.fb, createEmptyCreateTermForm());
  protected readonly submitting = signal(false);
  protected readonly startLocked = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly adderError = signal<string | null>(null);
  protected readonly conflictOpen = signal(false);
  protected readonly conflictDates = signal<string[]>([]);

  protected readonly validation = computed(() => {
    this.formTick();
    return inspectEditTermForm(this.model(), {
      today: this.today,
      startLocked: this.startLocked(),
    });
  });

  protected readonly saveDisabled = computed(
    () =>
      this.submitting() || Object.keys(this.validation().errors).length > 0 || this.fields.hasAny(),
  );

  protected readonly showFrozenLegend = computed(() => {
    this.formTick();
    return this.originalHolidayDates.some((date) => date < this.today);
  });

  protected readonly holidayChips = computed(() => {
    const outside = new Set(this.validation().outsideHolidays);
    const conflicts = new Set(this.conflictDates());
    return [...this.model().holidayDates].sort().map((date) => {
      const frozen = isFrozenHoliday(date, this.originalHolidayDates, this.today);
      const conflict = conflicts.has(date);
      return {
        date,
        label: formatArabicDate(date),
        frozen,
        isNew: !this.originalHolidayDates.includes(date),
        invalid: outside.has(date) || conflict,
        conflict,
        title: conflict
          ? 'يوم فيه حضور أو تقدّم مسجّل'
          : frozen
            ? 'إجازة سابقة — لا يمكن حذفها'
            : '',
      };
    });
  });

  constructor() {
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.fields.clear(name);
        if (name === 'pendingHolidayDate') {
          this.adderError.set(null);
        }
        this.formTick.update((count) => count + 1);
      });
    }

    effect(() => {
      const open = this.visible();
      const term = this.term();
      if (open && !this.opened && term) {
        this.opened = true;
        untracked(() => this.prefill(term));
      }
      if (!open) {
        this.opened = false;
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.visible()) {
      this.close();
    }
  }

  protected model() {
    return this.form.getRawValue() as ReturnType<typeof createEmptyCreateTermForm>;
  }

  protected fieldError(fieldName: string): string | undefined {
    return this.fields.get(fieldName) ?? this.validation().errors[fieldName];
  }

  protected todayMin(): string {
    return this.today;
  }

  protected endMin(): string {
    const start = this.model().startDate;
    return start && start > this.today ? start : this.today;
  }

  protected formatDate(isoDate: string): string {
    return formatArabicDate(isoDate);
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

  protected addHoliday(): void {
    const value = this.model();
    const message = holidayAddError(value.pendingHolidayDate, value, this.validation().endValid);
    this.adderError.set(message || null);
    if (message) {
      return;
    }
    this.form.patchValue({
      holidayDates: [...value.holidayDates, value.pendingHolidayDate].sort(),
      pendingHolidayDate: '',
    });
    this.adderError.set(null);
    this.fields.clear('holidayDates');
  }

  protected onHolidayEnter(event: Event): void {
    event.preventDefault();
    this.addHoliday();
  }

  protected removeHoliday(date: string): void {
    if (this.submitting() || isFrozenHoliday(date, this.originalHolidayDates, this.today)) {
      return;
    }
    this.form.controls['holidayDates'].setValue(
      this.model().holidayDates.filter((item) => item !== date),
    );
    this.fields.clear('holidayDates');
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }
    const term = this.term();
    const value = this.model();
    const inspection = inspectEditTermForm(value, {
      today: this.today,
      startLocked: this.startLocked(),
    });
    if (Object.keys(inspection.errors).length || !term) {
      this.formTick.update((count) => count + 1);
      return;
    }

    this.conflictOpen.set(false);
    this.conflictDates.set([]);
    this.errorMessage.set(null);
    this.fields.clearAll();
    this.adderError.set(null);
    const payload = buildUpdateTermPayload(value, this.startLocked());
    this.setSubmitting(true);
    this.termsService.updateTerm(term.id, payload).subscribe({
      next: () => {
        this.setSubmitting(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.termUpdated);
        this.saved.emit(changedTermRows(term, payload));
      },
      error: (error: unknown) => {
        this.setSubmitting(false);
        this.showSubmitError(error);
      },
    });
  }

  private prefill(term: ActiveTerm): void {
    this.today = todayIsoDate();
    const value = editTermFormFromTerm(term);
    this.originalHolidayDates = [...value.holidayDates];
    this.startLocked.set(isTermStartLocked(value.startDate, this.today));
    this.form.reset(value);
    this.setSubmitting(false);
    this.fields.clearAll();
    this.errorMessage.set(null);
    this.adderError.set(null);
    this.conflictOpen.set(false);
    this.conflictDates.set([]);
    this.formTick.update((count) => count + 1);
    setTimeout(() => this.nameInput()?.nativeElement.focus());
  }

  private setSubmitting(busy: boolean): void {
    this.submitting.set(busy);
    if (busy) {
      this.form.disable({ emitEvent: false });
      return;
    }
    this.form.enable({ emitEvent: false });
    if (this.startLocked()) {
      this.form.controls['startDate'].disable({ emitEvent: false });
    }
  }

  private showSubmitError(error: unknown): void {
    const conflict = readTermEditConflict(error);
    if (conflict) {
      this.conflictOpen.set(true);
      this.conflictDates.set(conflict.affectedDates);
      this.errorMessage.set(null);
      this.fields.clearAll();
      return;
    }
    this.conflictOpen.set(false);

    const banner = nestSubmitBanner(
      error,
      this.fields,
      this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
      'تعذّر حفظ الدورة. حاول مرة أخرى.',
    );
    this.errorMessage.set(
      banner === 'Request failed' ? 'تعذّر حفظ الدورة. حاول مرة أخرى.' : banner,
    );
  }
}
