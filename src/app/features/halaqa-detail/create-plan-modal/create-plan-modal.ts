import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
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
  imports: [ReactiveFormsModule, Select, FieldErrorComponent],
  templateUrl: './create-plan-modal.html',
})
export class CreatePlanModalComponent {
  private readonly detailService = inject(HalaqaDetailService);
  private readonly quranApi = inject(QuranApiService);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = input.required<boolean>();
  readonly halqaId = input.required<number>();
  readonly rosterStudents = input.required<HalaqaStudentViewModel[]>();
  readonly created = output<void>();
  readonly closed = output<void>();

  protected readonly itemTypeOptions = [...STUDY_PLAN_ITEM_TYPE_OPTIONS];
  protected readonly directionOptions = STUDY_PLAN_DIRECTION_OPTIONS;
  protected readonly amountTypeOptions = [...STUDY_PLAN_AMOUNT_TYPE_OPTIONS];
  protected readonly form = this.fb.group({
    planName: [''],
    studentIds: this.fb.control<number[]>([], { nonNullable: true }),
    items: this.fb.array([this.itemGroup(createEmptyPlanItemForm())]),
  });
  protected readonly surahs = signal<SurahApiRecord[]>([]);
  protected readonly ayahsBySurah = signal<Record<number, number[]>>({});
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fields = createFieldErrorBag();

  protected get itemRows(): FormArray {
    return this.form.controls['items'] as FormArray;
  }

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

  protected itemModel(index: number): PlanItemFormModel {
    return this.itemRows.at(index).getRawValue() as PlanItemFormModel;
  }

  protected readonly surahsLoading = signal(false);

  protected readonly surahOptions = computed(() => mapSurahSelectOptions(this.surahs()));

  constructor() {
    this.form.controls['planName'].valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearFieldError('name');
    });
    this.form.controls['studentIds'].valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clearFieldError('studentIds');
    });
    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.resetForm();
        this.loadSurahs();
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

  protected toggleStudent(studentId: number, checked: boolean): void {
    const ids = this.form.controls['studentIds'].value ?? [];
    this.form.controls['studentIds'].setValue(
      checked ? [...ids, studentId] : ids.filter((id) => id !== studentId),
    );
  }

  protected isStudentSelected(studentId: number): boolean {
    return (this.form.controls['studentIds'].value ?? []).includes(studentId);
  }

  protected addItem(): void {
    const item = createEmptyPlanItemForm();
    this.itemRows.push(this.itemGroup(item));
    this.loadAyahs(item.fromSurah);
  }

  protected removeItem(index: number): void {
    if (this.itemRows.length <= 1) {
      return;
    }
    this.itemRows.removeAt(index);
  }

  protected onFromSurahChange(index: number, fromSurah: number): void {
    this.itemRows.at(index).patchValue({ fromAyah: 1 });
    this.loadAyahs(fromSurah);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);

    const name = String(this.form.controls['planName'].value ?? '').trim();
    const items = this.itemRows.getRawValue() as PlanItemFormModel[];
    const errors: Record<string, string> = {};
    if (!name) {
      errors['name'] = this.translate.instant(HALAQA_DETAIL_I18N.validation.planName);
    }
    items.forEach((item, index) => {
      for (const [field, key] of Object.entries(validatePlanItemForm(item))) {
        errors[`studyPlanItems.${index}.${field}`] = this.translate.instant(key);
      }
    });
    if (this.fields.applyMap(errors)) {
      return;
    }

    this.submitting.set(true);
    const payload = this.detailService.buildCreatePlanPayload(
      this.halqaId(),
      name,
      this.form.controls['studentIds'].value ?? [],
      items,
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

  private itemGroup(value: PlanItemFormModel): FormGroup {
    const group = formGroupOf(this.fb, value);
    for (const name of Object.keys(group.controls)) {
      group.controls[name].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        const index = this.itemRows.controls.indexOf(group);
        if (index >= 0) {
          this.clearItemField(index, name);
        }
      });
    }
    return group;
  }

  private resetForm(): void {
    this.form.patchValue({ planName: '', studentIds: [] });
    this.itemRows.clear();
    this.itemRows.push(this.itemGroup(createEmptyPlanItemForm()));
    this.fields.clearAll();
    this.errorMessage.set(null);
  }

  private loadSurahs(): void {
    this.surahsLoading.set(true);
    this.quranApi.getSurahs().subscribe({
      next: (surahs) => {
        this.surahs.set(surahs);
        this.surahsLoading.set(false);
        for (const item of this.itemRows.getRawValue() as PlanItemFormModel[]) {
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
