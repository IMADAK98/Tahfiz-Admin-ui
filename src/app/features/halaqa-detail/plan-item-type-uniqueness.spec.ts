import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { Select } from 'primeng/select';
import { computed } from '@angular/core';
import { of } from 'rxjs';
import { QuranApiService } from '../../core/api/quran-api.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { arabicPrimeNgTranslation } from '../../core/ui/primeng-ar-locale';
import { HALAQA_DETAIL_I18N } from './i18n/halaqa-detail-i18n';
import { AddPlanItemModalComponent } from './add-plan-item-modal/add-plan-item-modal';
import { CreatePlanModalComponent } from './create-plan-modal/create-plan-modal';
import { StudyPlanItemViewModel } from './dto';
import { EditPlanItemModalComponent } from './edit-plan-item-modal/edit-plan-item-modal';
import { HalaqaDetailService } from './halaqa-detail.service';

class TranslateStub {
  onLangChange = new EventEmitter<unknown>();
  onTranslationChange = new EventEmitter<unknown>();
  onDefaultLangChange = new EventEmitter<unknown>();
  currentLang = 'ar';
  instant(key: string): string {
    return key;
  }
  get(key: string) {
    return of(key);
  }
  translate(key: unknown) {
    const resolved = typeof key === 'function' ? (key as () => string)() : String(key ?? '');
    return computed(() => this.instant(resolved));
  }
}

function planItem(type: StudyPlanItemViewModel['type'], id = 4): StudyPlanItemViewModel {
  return {
    id,
    type,
    direction: 'NORMAL',
    fromSurahNumber: 1,
    fromSurahName: 'الفاتحة',
    fromAyah: 1,
    toSurahNumber: 1,
    toSurahName: 'الفاتحة',
    toAyah: 5,
    amountType: 'LINE',
    amountValue: 5,
    rangeLabel: '',
    amountLabel: '',
    directionLabel: 'عادي',
  };
}

function typeSelect(fixture: ComponentFixture<unknown>, inputId: string): Select {
  const match = fixture.debugElement
    .queryAll(By.directive(Select))
    .map((node) => node.componentInstance as Select)
    .find((select) => select.inputId() === inputId);
  if (!match) {
    throw new Error(`missing type select ${inputId}`);
  }
  return match;
}

function selectOptions(select: Select): { value: string; disabled?: boolean }[] {
  return (select.options() ?? []) as { value: string; disabled?: boolean }[];
}

function disabledValues(select: Select): string[] {
  return selectOptions(select)
    .filter((option) => option.disabled)
    .map((option) => option.value);
}

describe('CreatePlanModalComponent type dropdowns', () => {
  let fixture: ComponentFixture<CreatePlanModalComponent>;
  let createPlan: ReturnType<typeof vi.fn>;

  function modal(): CreatePlanModalComponent {
    return fixture.componentInstance;
  }

  function addButton(): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector('.plan-edit-items-head button');
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('missing add item button');
    }
    return button;
  }

  beforeEach(async () => {
    createPlan = vi.fn(() => of(undefined));
    await TestBed.configureTestingModule({
      imports: [CreatePlanModalComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG({ translation: arabicPrimeNgTranslation }),
        { provide: TranslateService, useClass: TranslateStub },
        { provide: QuranApiService, useValue: { getSurahs: () => of([]), getSurahById: () => of({ id: 1, ayahs: [] }) } },
        { provide: ToastMessageService, useValue: { notifySuccess: vi.fn() } },
        {
          provide: HalaqaDetailService,
          useValue: {
            createPlan,
            buildCreatePlanPayload: vi.fn(() => ({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePlanModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('halqaId', 1);
    fixture.componentRef.setInput('rosterStudents', []);
    fixture.detectChanges();
  });

  it('disables the first type in the other row, frees it on change or remove, and toggles add', () => {
    expect(disabledValues(typeSelect(fixture, 'type-0'))).toEqual([]);

    addButton().click();
    fixture.detectChanges();

    expect(modal()['itemRows'].length).toBe(2);
    expect(modal()['itemModel'](1).type).toBe('TATHBEET');
    expect(disabledValues(typeSelect(fixture, 'type-0'))).toEqual(['TATHBEET']);
    expect(disabledValues(typeSelect(fixture, 'type-1'))).toEqual(['HIFZ']);
    expect(selectOptions(typeSelect(fixture, 'type-0')).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );

    modal()['itemRows'].at(0).get('type')?.setValue('MURAJAA');
    fixture.detectChanges();
    expect(disabledValues(typeSelect(fixture, 'type-1'))).toEqual(['MURAJAA']);
    expect(disabledValues(typeSelect(fixture, 'type-1'))).not.toContain('HIFZ');

    addButton().click();
    fixture.detectChanges();
    expect(modal()['itemModel'](2).type).toBe('HIFZ');
    expect(addButton().disabled).toBe(true);
    expect(modal()['itemRows'].length).toBe(3);
    modal()['addItem']();
    expect(modal()['itemRows'].length).toBe(3);

    modal()['removeItem'](2);
    fixture.detectChanges();
    expect(addButton().disabled).toBe(false);
    expect(disabledValues(typeSelect(fixture, 'type-0'))).not.toContain('HIFZ');
    expect(disabledValues(typeSelect(fixture, 'type-1'))).not.toContain('HIFZ');
  });

  it('blocks a programmatic duplicate and an empty type without calling create', () => {
    addButton().click();
    fixture.detectChanges();
    modal()['itemRows'].at(1).get('type')?.setValue('HIFZ');
    fixture.detectChanges();

    expect(selectOptions(typeSelect(fixture, 'type-0')).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );
    expect(selectOptions(typeSelect(fixture, 'type-1')).find((option) => option.value === 'HIFZ')?.disabled).toBe(
      false,
    );

    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(createPlan).not.toHaveBeenCalled();
    expect(modal()['itemField'](0, 'type')).toBe(HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate);
    expect(modal()['itemField'](1, 'type')).toBe(HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate);
    expect(modal()['itemRows'].length).toBe(2);

    modal()['itemRows'].at(1).get('type')?.setValue(null);
    fixture.detectChanges();
    expect(disabledValues(typeSelect(fixture, 'type-0'))).toEqual([]);
    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(createPlan).not.toHaveBeenCalled();
    expect(modal()['itemField'](1, 'type')).toBe(HALAQA_DETAIL_I18N.validation.planItemType);
  });
});

describe('EditPlanItemModalComponent type dropdown', () => {
  let fixture: ComponentFixture<EditPlanItemModalComponent>;
  let updatePlanItem: ReturnType<typeof vi.fn>;
  const siblings = ['HIFZ', 'TATHBEET'];

  function modal(): EditPlanItemModalComponent {
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    updatePlanItem = vi.fn(() => of(planItem('HIFZ')));
    await TestBed.configureTestingModule({
      imports: [EditPlanItemModalComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG({ translation: arabicPrimeNgTranslation }),
        { provide: TranslateService, useClass: TranslateStub },
        { provide: QuranApiService, useValue: { getSurahs: () => of([]), getSurahById: () => of({ id: 1, ayahs: [] }) } },
        { provide: ToastMessageService, useValue: { notifySuccess: vi.fn() } },
        { provide: HalaqaDetailService, useValue: { updatePlanItem } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPlanItemModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('planName', 'خطة الحفظ');
    fixture.componentRef.setInput('item', planItem('HIFZ'));
    fixture.componentRef.setInput('siblingTypes', siblings);
    fixture.detectChanges();
  });

  it('starts on the saved type, flags the legacy duplicate, and blocks a move onto a sibling type', () => {
    const select = typeSelect(fixture, 'edit-item-type');
    expect(modal()['model']().type).toBe('HIFZ');
    expect(selectOptions(select).find((option) => option.value === 'HIFZ')?.disabled).toBe(false);
    expect(disabledValues(select)).toEqual(['HIFZ', 'TATHBEET'].filter((type) => type !== 'HIFZ'));
    expect(disabledValues(select)).toContain('TATHBEET');
    expect(fixture.nativeElement.querySelector('#edit-item-type-legacy')?.textContent).toContain(
      HALAQA_DETAIL_I18N.validation.planItemTypeLegacy,
    );
    expect(siblings).toEqual(['HIFZ', 'TATHBEET']);

    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(updatePlanItem).toHaveBeenCalledTimes(1);

    modal()['form'].controls['type'].setValue('TATHBEET');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#edit-item-type-legacy')).toBeNull();
    expect(disabledValues(typeSelect(fixture, 'edit-item-type'))).toContain('HIFZ');
    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(updatePlanItem).toHaveBeenCalledTimes(1);
    expect(modal()['fieldError']('type')).toBe(HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate);

    modal()['form'].controls['type'].setValue('MURAJAA');
    fixture.detectChanges();
    expect(disabledValues(typeSelect(fixture, 'edit-item-type'))).toEqual(['HIFZ', 'TATHBEET']);
    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(updatePlanItem).toHaveBeenCalledTimes(2);

    modal()['form'].controls['type'].setValue(null);
    fixture.detectChanges();
    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(updatePlanItem).toHaveBeenCalledTimes(2);
    expect(modal()['fieldError']('type')).toBe(HALAQA_DETAIL_I18N.validation.planItemType);
  });
});

describe('AddPlanItemModalComponent type guard', () => {
  let fixture: ComponentFixture<AddPlanItemModalComponent>;
  let addPlanItem: ReturnType<typeof vi.fn>;

  function modal(): AddPlanItemModalComponent {
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    addPlanItem = vi.fn(() => of(planItem('TATHBEET')));
    await TestBed.configureTestingModule({
      imports: [AddPlanItemModalComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG({ translation: arabicPrimeNgTranslation }),
        { provide: TranslateService, useClass: TranslateStub },
        { provide: QuranApiService, useValue: { getSurahs: () => of([]), getSurahById: () => of({ id: 1, ayahs: [] }) } },
        { provide: ToastMessageService, useValue: { notifySuccess: vi.fn() } },
        { provide: HalaqaDetailService, useValue: { addPlanItem } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPlanItemModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('planId', 9);
    fixture.componentRef.setInput('planName', 'خطة الحفظ');
    fixture.componentRef.setInput('availableTypes', ['TATHBEET']);
    fixture.detectChanges();
  });

  it('rejects a type that is already on the plan', () => {
    expect(modal()['model']().type).toBe('TATHBEET');
    const values = selectOptions(typeSelect(fixture, 'add-item-type')).map((option) => option.value);
    expect(values).toEqual(['TATHBEET']);

    modal()['form'].controls['type'].setValue('HIFZ');
    modal()['onSubmit']({ preventDefault() {} } as Event);
    expect(addPlanItem).not.toHaveBeenCalled();
    expect(modal()['fieldError']('type')).toBe(HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate);
  });
});
