import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag } from '../../../core/api/field-error-state';
import { QuranApiService } from '../../../core/api/quran-api.service';
import { SurahApiRecord } from '../../../core/api/models/study-plan.model';
import { formGroupOf } from '../../../core/forms/form-group-of';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N, arabicDialogMessage } from '../../../core/ui/toast-messages';
import {
  PlanItemFormModel,
  StudyPlanItemViewModel,
  ayahNumbersOf,
  createPlanItemFormFromView,
  mapSurahSelectOptions,
  surahSelectLabel,
  validatePlanItemForm,
} from '../dto';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
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
  imports: [ReactiveFormsModule, TranslatePipe, InputText, Select, FieldErrorComponent],
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
  readonly saved = output<StudyPlanItemViewModel | null>();
  readonly closed = output<void>();

  protected readonly itemTypeOptions = [...STUDY_PLAN_ITEM_TYPE_OPTIONS];
  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = [...STUDY_PLAN_AMOUNT_TYPE_OPTIONS];
  protected readonly form = formGroupOf(this.fb, createPlanItemFormFromView(emptyPlanItemView));
  protected readonly computedOnSave = HALAQA_DETAIL_I18N.edit.computedOnSave;
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  /** True only after fromSurah is written while options exist, so p-select never mounts empty. */
  protected readonly surahSelectReady = signal(false);
  protected readonly ayahsBySurah = signal<Record<number, number[]>>({});
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private preparedItemId: number | null = null;
  private surahsRequested = false;
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

  protected fromSurahStandIn(): string {
    const current = this.item();
    if (!current?.fromSurahNumber) {
      return '';
    }
    return surahSelectLabel(current.fromSurahNumber, current.fromSurahName);
  }

  protected toSurahStandIn(): string {
    const current = this.item();
    if (!current?.toSurahNumber) {
      return '—';
    }
    return surahSelectLabel(current.toSurahNumber, current.toSurahName ?? '');
  }

  constructor() {
    const nestNames: Record<string, string[]> = {
      fromSurah: ['fromSurahNumber', 'fromSurah'],
    };
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(...(nestNames[name] ?? [name]));
      });
    }
    this.fetchSurahs();
    effect(() => {
      const item = this.item();
      const open = this.visible();
      const surahCount = this.surahs().length;
      if (!open || !item) {
        untracked(() => {
          this.preparedItemId = null;
          this.surahSelectReady.set(false);
        });
        return;
      }
      untracked(() => this.applyItem(item, surahCount));
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
      next: (updated) => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.saved.emit(updated);
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

  /**
   * p-select paints blank when the control value is set before its options exist.
   * Write fromSurah only once the list is in the signal, and keep the select
   * unmounted until that write so the saved name shows with no empty flash.
   */
  private applyItem(item: StudyPlanItemViewModel, surahCount: number): void {
    const opening = this.preparedItemId !== item.id;
    if (opening) {
      this.surahSelectReady.set(false);
      this.form.reset(createPlanItemFormFromView(item));
      this.form.controls['toSurah'].disable({ emitEvent: false });
      this.form.controls['toAyah'].disable({ emitEvent: false });
      this.fields.clearAll();
      this.errorMessage.set(null);
      this.loadAyahs(item.fromSurahNumber);
      this.preparedItemId = item.id;
    }
    if (surahCount > 0 && !this.surahSelectReady()) {
      this.form.controls['fromSurah'].setValue(item.fromSurahNumber, { emitEvent: false });
      this.form.controls['toSurah'].setValue(item.toSurahNumber, { emitEvent: false });
      this.surahSelectReady.set(true);
      return;
    }
    if (opening) {
      this.fetchSurahs();
    }
  }

  private fetchSurahs(): void {
    if (this.surahsRequested || this.surahs().length) {
      return;
    }
    this.surahsRequested = true;
    this.quranApi.getSurahs().subscribe({
      next: (surahs) => this.surahs.set(surahs),
      error: () => {
        this.surahsRequested = false;
        this.surahs.set([]);
      },
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
