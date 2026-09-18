import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { ApiError } from '../../../core/api/api-error';
import { createFieldErrorBag, nestSubmitBanner } from '../../../core/api/field-error-state';
import { QuranApiService } from '../../../core/api/quran-api.service';
import { SurahApiRecord } from '../../../core/api/models/study-plan.model';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { FieldErrorComponent } from '../../../core/ui/field-error';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import {
  HalaqaStudentViewModel,
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
  selector: 'app-create-plan-modal',
  imports: [FormsModule, Select, FieldErrorComponent],
  templateUrl: './create-plan-modal.html',
})
export class CreatePlanModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly quranApi = inject(QuranApiService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly halqaId = input.required<number>();
  readonly rosterStudents = input.required<HalaqaStudentViewModel[]>();
  readonly created = output<void>();
  readonly closed = output<void>();

  protected readonly itemTypeOptions = [...STUDY_PLAN_ITEM_TYPE_OPTIONS];
  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = [...STUDY_PLAN_AMOUNT_TYPE_OPTIONS];
  protected readonly planName = signal('');
  protected readonly selectedStudentIds = signal<number[]>([]);
  protected readonly items = signal<PlanItemFormModel[]>([createEmptyPlanItemForm()]);
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  protected readonly ayahsBySurah = signal<Record<number, number[]>>({});
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  protected itemField(index: number, nestName: string): string | undefined {
    return this.fields.get(
      `studyPlanItems.${index}.${nestName}`,
      `studyPlanItems[${index}].${nestName}`,
    );
  }

  protected clearFieldError(...fieldNames: string[]): void {
    this.fields.clear(...fieldNames);
    if (!this.fields.hasAny()) {
      this.errorMessage.set(null);
    }
  }

  protected clearItemField(index: number, nestName: string): void {
    this.clearFieldError(`studyPlanItems.${index}.${nestName}`, `studyPlanItems[${index}].${nestName}`);
  }
  protected readonly surahsLoading = signal(false);

  protected readonly surahOptions = computed(() => mapSurahSelectOptions(this.surahs()));

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.resetForm();
      this.loadSurahs();
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

  protected toggleStudent(studentId: number, checked: boolean): void {
    this.selectedStudentIds.update((ids) =>
      checked ? [...ids, studentId] : ids.filter((id) => id !== studentId),
    );
    this.clearFieldError('studentIds');
  }

  protected isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds().includes(studentId);
  }

  protected addItem(): void {
    const item = createEmptyPlanItemForm();
    this.items.update((current) => [...current, item]);
    this.loadAyahs(item.fromSurah);
  }

  protected removeItem(index: number): void {
    this.items.update((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  }

  protected updateItem(index: number, patch: Partial<PlanItemFormModel>): void {
    this.items.update((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
    for (const key of Object.keys(patch) as (keyof PlanItemFormModel)[]) {
      this.clearItemField(index, String(key));
    }
  }

  protected onFromSurahChange(index: number, fromSurah: number): void {
    this.updateItem(index, { fromSurah, fromAyah: 1 });
    this.loadAyahs(fromSurah);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const name = this.planName().trim();
    if (!name) {
      this.errorMessage.set(this.translate.instant(HALAQA_DETAIL_I18N.validation.planName));
      return;
    }

    for (const item of this.items()) {
      const validationKey = validatePlanItemForm(item);
      if (validationKey) {
        this.errorMessage.set(this.translate.instant(validationKey));
        return;
      }
    }

    this.submitting.set(true);
    const payload = this.detailService.buildCreatePlanPayload(
      this.halqaId(),
      name,
      this.selectedStudentIds(),
      this.items(),
    );

    this.detailService.createPlan(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(HALAQA_DETAIL_I18N.success.planCreated);
        this.created.emit();
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

  private resetForm(): void {
    this.planName.set('');
    this.selectedStudentIds.set([]);
    this.items.set([createEmptyPlanItemForm()]);
    this.fields.clearAll();
    this.errorMessage.set(null);
  }

  private loadSurahs(): void {
    this.surahsLoading.set(true);
    this.quranApi.getSurahs().subscribe({
      next: (surahs) => {
        this.surahs.set(surahs);
        this.surahsLoading.set(false);
        for (const item of this.items()) {
          this.loadAyahs(item.fromSurah);
        }
      },
      error: () => {
        this.surahs.set([]);
        this.surahsLoading.set(false);
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
