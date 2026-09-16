import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../core/api/api-error';
import { QuranApiService } from '../../../core/api/quran-api.service';
import { SurahApiRecord } from '../../../core/api/models/study-plan.model';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { TOAST_I18N } from '../../../core/ui/toast-messages';
import {
  PlanItemFormModel,
  StudyPlanItemViewModel,
  createPlanItemFormFromView,
  surahSelectLabel,
  validatePlanItemForm,
} from '../dto';
import {
  STUDY_PLAN_AMOUNT_TYPE_OPTIONS,
  STUDY_PLAN_DIRECTION_OPTIONS,
  STUDY_PLAN_ITEM_TYPE_OPTIONS,
} from '../enums';
import { HalaqaDetailService } from '../halaqa-detail.service';

@Component({
  selector: 'app-edit-plan-item-modal',
  imports: [FormsModule],
  templateUrl: './edit-plan-item-modal.html',
})
export class EditPlanItemModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly quranApi = inject(QuranApiService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);

  readonly visible = input.required<boolean>();
  readonly planName = input.required<string>();
  readonly item = input.required<StudyPlanItemViewModel | null>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly itemTypeOptions = STUDY_PLAN_ITEM_TYPE_OPTIONS;
  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = STUDY_PLAN_AMOUNT_TYPE_OPTIONS;
  protected readonly form = signal<PlanItemFormModel>(createPlanItemFormFromView({
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
  }));
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly surahOptions = computed(() =>
    this.surahs().map((surah) => ({
      number: surah.number ?? surah.id,
      label: surahSelectLabel(
        surah.number ?? surah.id,
        surah.arabicName ?? surah.name ?? String(surah.number ?? surah.id),
      ),
    })),
  );

  constructor() {
    effect(() => {
      const item = this.item();
      if (!this.visible() || !item) {
        return;
      }
      this.form.set(createPlanItemFormFromView(item));
      this.errorMessage.set(null);
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

  protected patchForm(patch: Partial<PlanItemFormModel>): void {
    this.form.update((current) => ({ ...current, ...patch }));
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const item = this.item();
    if (!item) {
      return;
    }

    this.errorMessage.set(null);
    const validationKey = validatePlanItemForm(this.form());
    if (validationKey) {
      this.errorMessage.set(this.translate.instant(validationKey));
      return;
    }

    this.submitting.set(true);
    this.detailService.updatePlanItem(item.id, this.form()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMessage.notifySuccess(TOAST_I18N.success.saved);
        this.saved.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : '');
      },
    });
  }

  private loadSurahs(): void {
    this.quranApi.getSurahs().subscribe({
      next: (surahs) => this.surahs.set(surahs),
      error: () => this.surahs.set([]),
    });
  }
}
