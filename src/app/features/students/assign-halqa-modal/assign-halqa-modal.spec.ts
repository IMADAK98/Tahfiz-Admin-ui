import { EventEmitter } from '@angular/core';
import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { of, Subject, throwError } from 'rxjs';
import { apiErrorFromBody, ApiError } from '../../../core/api/api-error';
import { CreatedManualStudent } from '../../../core/api/models/student.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastMessageService } from '../../../core/toast/toast-message.service';
import { arabicPrimeNgTranslation } from '../../../core/ui/primeng-ar-locale';
import { StudentsService } from '../students.service';
import { AssignHalqaModalComponent } from './assign-halqa-modal';

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

@Component({
  imports: [AssignHalqaModalComponent],
  template: `
    <app-assign-halqa-modal
      [student]="student()"
      [requestTermId]="termId()"
      (assigned)="assigned.set(assigned() + 1)"
      (skipped)="skipped.set(skipped() + 1)"
    />
  `,
})
class AssignHost {
  readonly student = signal<CreatedManualStudent>({
    id: 30,
    name: 'عبدالله',
    email: 'student@example.com',
  });
  readonly termId = signal<number | null>(31);
  readonly assigned = signal(0);
  readonly skipped = signal(0);
}

describe('AssignHalqaModalComponent', () => {
  let fixture: ComponentFixture<AssignHost>;
  let students: {
    loadAssignableHalqas: ReturnType<typeof vi.fn>;
    loadAssignableHalqasForTerm: ReturnType<typeof vi.fn>;
    enrollStudent: ReturnType<typeof vi.fn>;
    resolveCreatedStudentId: ReturnType<typeof vi.fn>;
  };
  let claims: { centerId?: number } | null;

  const halaqa = {
    id: 7,
    name: 'حلقة الفجر',
    studentLimit: null,
    studentsCount: null,
    remainingCapacity: null,
  };

  function host(): AssignHost {
    return fixture.componentInstance;
  }

  function modal(): AssignHalqaModalComponent {
    return fixture.debugElement.query(By.directive(AssignHalqaModalComponent)).componentInstance;
  }

  function chooseYes(): void {
    modal()['onYes']();
    fixture.detectChanges();
  }

  function submit(): void {
    modal()['onSubmit']({ preventDefault() {} } as Event);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    claims = { centerId: 4 };
    students = {
      loadAssignableHalqas: vi.fn(() => of({ all: [halaqa], selectable: [halaqa] })),
      loadAssignableHalqasForTerm: vi.fn(() => of({ all: [halaqa], selectable: [halaqa] })),
      enrollStudent: vi.fn(() => of(null)),
      resolveCreatedStudentId: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AssignHost],
      providers: [
        provideNoopAnimations(),
        providePrimeNG({ translation: arabicPrimeNgTranslation }),
        { provide: TranslateService, useClass: TranslateStub },
        { provide: StudentsService, useValue: students },
        { provide: AuthService, useValue: { getClaims: () => claims } },
        {
          provide: ToastMessageService,
          useValue: { notifySuccess: vi.fn(), notifyInfo: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignHost);
    fixture.detectChanges();
  });

  it('loads halaqas for the request term and does not call active-halqas', () => {
    chooseYes();

    expect(students.loadAssignableHalqasForTerm).toHaveBeenCalledTimes(1);
    expect(students.loadAssignableHalqasForTerm).toHaveBeenCalledWith(31);
    expect(students.loadAssignableHalqas).not.toHaveBeenCalled();
    expect(modal()['selectableHalqas']()).toEqual([halaqa]);
  });

  it('keeps the new-student path on active-halqas when no request term is set', () => {
    host().termId.set(null);
    fixture.detectChanges();

    chooseYes();

    expect(students.loadAssignableHalqas).toHaveBeenCalledWith(4);
    expect(students.loadAssignableHalqasForTerm).not.toHaveBeenCalled();
  });

  it('shows an empty state when the request term has no halaqas', () => {
    students.loadAssignableHalqasForTerm.mockReturnValue(of({ all: [], selectable: [] }));

    chooseYes();

    expect(modal()['selectableHalqas']()).toEqual([]);
    expect(modal()['listedHalqaCount']()).toBe(0);
    expect(modal()['emptyCopyKey']()).toContain('empty');
    expect(students.enrollStudent).not.toHaveBeenCalled();
  });

  it('shows the list error and does not enroll when halaqa loading fails', () => {
    students.loadAssignableHalqasForTerm.mockReturnValue(
      throwError(() => new ApiError('تعذّر تحميل حلقات الدورة', 500)),
    );

    chooseYes();

    expect(modal()['errorMessage']()).toBe('تعذّر تحميل حلقات الدورة');
    expect(modal()['pickersLoading']()).toBe(false);
    expect(students.enrollStudent).not.toHaveBeenCalled();
    expect(students.loadAssignableHalqas).not.toHaveBeenCalled();
  });

  it('does not load another term when the request term is missing', () => {
    host().termId.set(0);
    fixture.detectChanges();

    chooseYes();

    expect(students.loadAssignableHalqasForTerm).not.toHaveBeenCalled();
    expect(students.loadAssignableHalqas).not.toHaveBeenCalled();
    expect(modal()['errorMessage']()).toContain('termUnavailable');
  });

  it('skip closes without enrollment', () => {
    modal()['close']();

    expect(host().skipped()).toBe(1);
    expect(host().assigned()).toBe(0);
    expect(students.enrollStudent).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'inactive halaqa 400',
      body: { statusCode: 400, message: 'الحلقة غير نشطة', error: 'Bad Request' },
    },
    {
      label: 'non-active term 400',
      body: { statusCode: 400, message: 'الفصل غير نشط', error: 'Bad Request' },
    },
    {
      label: 'wrong or null center 404',
      body: { statusCode: 404, message: 'الحلقة غير موجودة', error: 'Not Found' },
    },
    {
      label: 'teacher 403',
      body: {
        statusCode: 403,
        message: 'You are not authorized to access this resource',
        error: 'Forbidden',
      },
    },
  ])(
    'keeps the accepted student and retries enroll after $label',
    ({ body }) => {
      const failure = apiErrorFromBody(body, body.statusCode);
      expect(failure).toBeInstanceOf(ApiError);
      expect(failure.code).toBeUndefined();
      expect(failure.message).toBe(body.message);
      expect('code' in body).toBe(false);

      chooseYes();
      modal()['selectedHalqaId'].setValue(7);
      students.enrollStudent.mockReturnValue(throwError(() => failure));

      submit();

      expect(students.enrollStudent).toHaveBeenCalledTimes(1);
      expect(students.enrollStudent).toHaveBeenCalledWith(7, 30);
      expect(typeof students.enrollStudent.mock.calls[0][1]).toBe('number');
      expect(host().assigned()).toBe(0);
      expect(host().skipped()).toBe(0);
      expect(modal()['errorMessage']()).toBe(body.message);
      expect(modal()['errorMessage']()).not.toMatch(/rollback|تراجع/);
      expect(modal()['submitting']()).toBe(false);

      students.enrollStudent.mockReturnValue(of(null));
      submit();

      expect(students.enrollStudent).toHaveBeenCalledTimes(2);
      expect(students.enrollStudent).toHaveBeenLastCalledWith(7, 30);
      expect(host().assigned()).toBe(1);
    },
  );

  it('ignores a second submit while enrollment is in flight and ignores cancel until it finishes', () => {
    chooseYes();
    modal()['selectedHalqaId'].setValue(7);
    const pending = new Subject<unknown>();
    students.enrollStudent.mockReturnValue(pending.asObservable());

    submit();
    submit();
    modal()['close']();

    expect(students.enrollStudent).toHaveBeenCalledTimes(1);
    expect(host().skipped()).toBe(0);
    expect(modal()['submitting']()).toBe(true);

    pending.next(null);
    pending.complete();
    fixture.detectChanges();

    expect(host().assigned()).toBe(1);
    expect(students.enrollStudent).toHaveBeenCalledTimes(1);
  });
});
