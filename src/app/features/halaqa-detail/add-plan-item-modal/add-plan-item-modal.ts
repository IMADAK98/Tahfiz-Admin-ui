import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag } from '../../../core/api/field-error-state';
import { QuranApiService } from '../../../core/api/quran-api.service';
import { StudyPlanItemType, SurahApiRecord } from '../../../core/api/models/study-plan.model';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N, arabicDialogMessage } from '../../../core/ui/toast-messages';
import {
  PlanItemFormModel,
  ayahNumbersOf,
  createEmptyPlanItemForm,
  mapSurahSelectOptions,
  validatePlanItemForm,
} from '../dto';
import {
  STUDY_PLAN_AMOUNT_TYPE_OPTIONS,
  STUDY_PLAN_DIRECTION_OPTIONS,
  STUDY_PLAN_ITEM_TYPE_OPTIONS,
} from '../enums';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-add-plan-item-modal',
  imports: [ReactiveFormsModule, InputText, Select, FieldErrorComponent],
  templateUrl: './add-plan-item-modal.html',
})
export class AddPlanItemModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly quranApi = inject(QuranApiService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly planId = input.required<number | null>();
  readonly planName = input.required<string>();
  readonly availableTypes = input.required<StudyPlanItemType[]>();
  readonly added = output<void>();
  readonly closed = output<void>();

  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = [...STUDY_PLAN_AMOUNT_TYPE_OPTIONS];
  protected readonly form = formGroupOf(this.fb, createEmptyPlanItemForm());
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  protected readonly ayahsBySurah = signal<Record<number, number[]>>({});
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();

  protected readonly itemTypeOptions = computed(() =>
    STUDY_PLAN_ITEM_TYPE_OPTIONS.filter((option) => this.availableTypes().includes(option.value)),
  );

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
      const types = this.availableTypes();
      if (!this.visible() || !types.length) {
        return;
      }
      untracked(() => {
        this.form.reset(createEmptyPlanItemForm(types[0]));
        this.fields.clearAll();
        this.errorMessage.set(null);
        this.loadSurahs();
        this.loadAyahs(1);
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
    const planId = this.planId();
    if (!planId || this.submitting()) {
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
    this.detailService.addPlanItem(planId, value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(HALAQA_DETAIL_I18N.success.planItemAdded);
        this.added.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.bannerFor(error));
      },
    });
  }

  private bannerFor(error: unknown): string {
    const unexpected = this.translate.instant(TOAST_I18N.errors.unexpected);
    const fieldBanner = this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner);
    if (this.fields.apply(error)) {
      const localized: Record<string, string> = {};
      for (const [field, message] of Object.entries(this.fields.fieldErrors())) {
        localized[field] = arabicDialogMessage(message, unexpected);
      }
      this.fields.applyMap(localized);
      return fieldBanner;
    }
    const message = error instanceof ApiError ? error.message : '';
    return arabicDialogMessage(message, unexpected);
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
