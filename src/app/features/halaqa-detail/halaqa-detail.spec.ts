import { computed, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { QuranApiService } from '../../core/api/quran-api.service';
import { ActiveTeacher } from '../../core/api/models/teacher.model';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { arabicPrimeNgTranslation } from '../../core/ui/primeng-ar-locale';
import { detailAfterHalqaSave, HalaqaDetailViewModel } from './dto';
import { EditHalaqaModalComponent } from './edit-halaqa-modal/edit-halaqa-modal';
import { HalaqaDetailComponent } from './halaqa-detail';
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

const initialDetail: HalaqaDetailViewModel = {
  id: 12,
  name: 'حلقة الفجر',
  category: 'PRIMARY',
  periods: ['FAJR'],
  isActive: true,
  studentLimit: 15,
  teacherId: 3,
  teacherName: 'معلّم قديم',
};

const savedWithoutTeacher: HalaqaDetailViewModel = {
  ...initialDetail,
  category: 'SECONDARY',
  studentLimit: 20,
  teacherId: null,
  teacherName: null,
};

const refetchedDetail: HalaqaDetailViewModel = {
  ...initialDetail,
  category: null,
  periods: [],
  studentLimit: 0,
  teacherId: 9,
  teacherName: 'خالد بن سعد',
};

const pickerTeacher: ActiveTeacher = {
  id: 9,
  name: 'خالد',
  email: 'khalid@example.com',
  halqas: [],
};

describe('detailAfterHalqaSave', () => {
  it('keeps the GET teacher and the PUT fields the GET omits', () => {
    const merged = detailAfterHalqaSave(
      { ...savedWithoutTeacher, teacherId: 9, teacherName: 'خالد' },
      refetchedDetail,
    );
    expect(merged.teacherName).toBe('خالد بن سعد');
    expect(merged.teacherId).toBe(9);
    expect(merged.category).toBe('SECONDARY');
    expect(merged.periods).toEqual(['FAJR']);
    expect(merged.studentLimit).toBe(20);
  });
});

describe('HalaqaDetailComponent teacher edit', () => {
  let fixture: ComponentFixture<HalaqaDetailComponent>;
  let updateHalqa: ReturnType<typeof vi.fn>;
  let reloadDetail: ReturnType<typeof vi.fn>;
  let loadPage: ReturnType<typeof vi.fn>;

  function page(): HalaqaDetailComponent {
    return fixture.componentInstance;
  }

  function modal(): EditHalaqaModalComponent {
    return fixture.debugElement.query(By.directive(EditHalaqaModalComponent)).componentInstance;
  }

  function openAndSubmit(teacherId: number): void {
    page()['openEditModal']();
    fixture.detectChanges();
    modal()['form'].patchValue({
      category: 'SECONDARY',
      period: 'FAJR',
      isActive: true,
      teacherId,
      studentLimit: 20,
    });
    modal()['onSubmit']({ preventDefault() {} } as Event);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    updateHalqa = vi.fn(() => of(savedWithoutTeacher));
    reloadDetail = vi.fn(() => of(refetchedDetail));
    loadPage = vi.fn(() => of({ detail: initialDetail, students: [], plans: [] }));

    await TestBed.configureTestingModule({
      imports: [HalaqaDetailComponent],
      providers: [
        provideNoopAnimations(),
        providePrimeNG({ translation: arabicPrimeNgTranslation }),
        provideRouter([]),
        { provide: TranslateService, useClass: TranslateStub },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '12' })) },
        },
        {
          provide: HalaqaDetailService,
          useValue: {
            loadPage,
            updateHalqa,
            reloadDetail,
            loadTeacherPickers: () => of([pickerTeacher]),
            validateEditForm: () => ({}),
          },
        },
        { provide: QuranApiService, useValue: { getSurahs: () => of([]), getSurahById: () => of(null) } },
        { provide: AuthService, useValue: { getClaims: () => ({ centerId: 4 }) } },
        { provide: ToastMessageService, useValue: { notifySuccess: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HalaqaDetailComponent);
    fixture.detectChanges();
  });

  it('refetches the halqa after a successful teacher save and shows the server teacher', () => {
    expect(fixture.nativeElement.textContent).toContain('معلّم قديم');

    openAndSubmit(9);

    expect(updateHalqa).toHaveBeenCalledTimes(1);
    expect(reloadDetail).toHaveBeenCalledTimes(1);
    expect(reloadDetail).toHaveBeenCalledWith(12);
    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('خالد بن سعد');
    expect(fixture.nativeElement.textContent).not.toContain('معلّم قديم');
    expect(fixture.nativeElement.textContent).toContain('متوسط');
    expect(fixture.nativeElement.textContent).toContain('0 / 20');
    expect(fixture.nativeElement.textContent).not.toContain('تعديل الحلقة');
  });

  it('does not refetch when the save fails', () => {
    updateHalqa.mockReturnValue(throwError(() => new ApiError('تعذّر الحفظ', 400)));

    openAndSubmit(9);

    expect(updateHalqa).toHaveBeenCalledTimes(1);
    expect(reloadDetail).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('معلّم قديم');
    expect(fixture.nativeElement.textContent).toContain('تعديل الحلقة');
  });

  it('does not refetch when the dialog is cancelled', () => {
    page()['openEditModal']();
    fixture.detectChanges();
    modal()['close']();
    fixture.detectChanges();

    expect(updateHalqa).not.toHaveBeenCalled();
    expect(reloadDetail).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('معلّم قديم');
    expect(fixture.nativeElement.textContent).not.toContain('تعديل الحلقة');
  });
});
