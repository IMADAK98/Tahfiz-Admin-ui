import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { QuranApiService } from '../../../core/api/quran-api.service';
import { SurahApiRecord } from '../../../core/api/models/study-plan.model';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import {
  PlanItemFormModel,
  StudyPlanItemViewModel,
  ayahNumbersOf,
  createPlanItemFormFromView,
  mapSurahSelectOptions,
  validatePlanItemForm,
} from '../dto';
import {
  STUDY_PLAN_AMOUNT_TYPE_OPTIONS,
  STUDY_PLAN_DIRECTION_OPTIONS,
  STUDY_PLAN_ITEM_TYPE_OPTIONS,
} from '../enums';
import { HalaqaDetailService } from '../halaqa-detail.service';

const emptyPlanItemView: StudyPlanItemViewModel = {
  id: 0,
  type: 'HIFZ',
  direction: 'NORMAL',
  fromSurahNumber: 1,
  fromSurahName: '',
  fromAyah: 1,
  toSurahNumber: null,
  toSurahName: null,
  toAyah: null,
  amountType: 'LINE',
  amountValue: 1,
  rangeLabel: '',
  amountLabel: '',
  directionLabel: 'عادي',
};

@Component({
  selector: 'app-edit-plan-item-modal',
  imports: [ReactiveFormsModule, InputText, Select, FieldErrorComponent],
  templateUrl: './edit-plan-item-modal.html',
})
export class EditPlanItemModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly quranApi = inject(QuranApiService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly planName = input.required<string>();
  readonly item = input.required<StudyPlanItemViewModel | null>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly itemTypeOptions = [...STUDY_PLAN_ITEM_TYPE_OPTIONS];
  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = [...STUDY_PLAN_AMOUNT_TYPE_OPTIONS];
  protected readonly form = formGroupOf(this.fb, createPlanItemFormFromView(emptyPlanItemView));
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  protected readonly ayahsBySurah = signal<Record<number, number[]>>({});
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
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

  protected model(): PlanItemFormModel {
    return this.form.getRawValue() as PlanItemFormModel;
  }

  protected readonly surahOptions = computed(() => mapSurahSelectOptions(this.surahs()));

  constructor() {
    const nestNames: Record<string, string[]> = {
      fromSurah: ['fromSurahNumber', 'fromSurah'],
    };
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(...(nestNames[name] ?? [name]));
      });
    }
    effect(() => {
      const item = this.item();
      if (!this.visible() || !item) {
        return;
      }
      untracked(() => {
        this.form.reset(createPlanItemFormFromView(item));
        this.form.controls['toSurah'].disable({ emitEvent: false });
        this.form.controls['toAyah'].disable({ emitEvent: false });
        this.fields.clearAll();
        this.errorMessage.set(null);
        this.loadSurahs();
        this.loadAyahs(item.fromSurahNumber);
      });
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
    this.closed.emit();
  }

  protected onFromSurahChange(fromSurah: number): void {
    this.form.patchValue({ fromAyah: 1 });
    this.loadAyahs(fromSurah);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const item = this.item();
    if (!item) {
      return;
    }

    this.errorMessage.set(null);
    this.fields.clearAll();
    const value = this.model();
    const raw = validatePlanItemForm(value);
    const mapped: Record<string, string> = {};
    for (const [field, key] of Object.entries(raw)) {
      mapped[field] = this.translate.instant(key);
    }
    if (this.fields.applyMap(mapped)) {
      return;
    }

    this.submitting.set(true);
    this.detailService.updatePlanItem(item.id, value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            error instanceof ApiError ? error.message : '',
          ),
        );
      },
    });
  }

  private loadSurahs(): void {
    this.quranApi.getSurahs().subscribe({
      next: (surahs) => this.surahs.set(surahs),
      error: () => this.surahs.set([]),
    });
  }

  private loadAyahs(surahId: number): void {
    if (!surahId || this.ayahsBySurah()[surahId]) {
      return;
    }

    this.quranApi.getSurahById(surahId).subscribe({
      next: (surah) => {
        this.ayahsBySurah.update((current) => ({
          ...current,
          [surahId]: ayahNumbersOf(surah),
        }));
      },
      error: () => {
        this.ayahsBySurah.update((current) => ({ ...current, [surahId]: [] }));
      },
    });
  }
}
