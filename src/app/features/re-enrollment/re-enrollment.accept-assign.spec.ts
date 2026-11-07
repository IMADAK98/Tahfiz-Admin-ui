import { computed, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ToastMessageService } from '../../core/toast/toast-message.service';
import { ReEnrollmentStatus } from './enums/re-enrollment-status.enum';
import { ReEnrollmentComponent } from './re-enrollment';
import { ReEnrollmentService } from './re-enrollment.service';
import { ReEnrollmentRequestView } from './dto';

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

const request: ReEnrollmentRequestView = {
  id: 14,
  existingUserId: 30,
  termId: 31,
  appliedToCenterId: 1,
  status: ReEnrollmentStatus.Pending,
  name: 'عبدالله',
  email: 'student@example.com',
  guardianLabel: null,
  previousTermLabel: null,
  termLabel: 'دورة ٣١ (termId 31)',
  halqaLabel: null,
  hifzSummary: null,
  suggestedTeacherLabel: null,
  educationStage: null,
  rejectionReason: null,
  createdAt: null,
  updatedAt: null,
};

describe('ReEnrollmentComponent accept then assign', () => {
  let fixture: ComponentFixture<ReEnrollmentComponent>;
  let approve: ReturnType<typeof vi.fn>;
  let toast: {
    notifySuccess: ReturnType<typeof vi.fn>;
    notifyInfo: ReturnType<typeof vi.fn>;
    notifyErrorBody: ReturnType<typeof vi.fn>;
    notifyErrorTitled: ReturnType<typeof vi.fn>;
  };

  function component(): ReEnrollmentComponent {
    return fixture.componentInstance;
  }

  function clickApprove(): void {
    component()['confirmApprove'](request, { stopPropagation() {} } as Event);
  }

  beforeEach(async () => {
    approve = vi.fn(() => of(undefined));
    toast = {
      notifySuccess: vi.fn(),
      notifyInfo: vi.fn(),
      notifyErrorBody: vi.fn(),
      notifyErrorTitled: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReEnrollmentComponent],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useClass: TranslateStub },
        {
          provide: ReEnrollmentService,
          useValue: {
            loadPendingQueue: () => of([request]),
            approveRequest: approve,
            rejectRequest: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: { getClaims: () => ({ centerId: 4 }) },
        },
        { provide: ToastMessageService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReEnrollmentComponent);
  });

  it('accepts once and opens assignment with the numeric existing user and request term', () => {
    clickApprove();

    const session = component()['session']();
    expect(approve).toHaveBeenCalledTimes(1);
    expect(approve).toHaveBeenCalledWith(14);
    expect(session.phase).toBe('assign');
    expect(session.student?.id).toBe(30);
    expect(typeof session.student?.id).toBe('number');
    expect(session.termId).toBe(31);
    expect(toast.notifySuccess).toHaveBeenCalledTimes(1);
    expect(toast.notifyInfo).not.toHaveBeenCalled();
    expect(component()['requests']().some((row) => row.id === 14)).toBe(false);
  });

  it('does not send a second accept while the first is loading, or from cancel', () => {
    const pending = new Subject<void>();
    approve.mockReturnValue(pending.asObservable());

    clickApprove();
    clickApprove();
    component()['cancelConfirm'](14, { stopPropagation() {} } as Event);

    expect(approve).toHaveBeenCalledTimes(1);
    expect(component()['session']().phase).toBe('approving');
    expect(component()['session']().student).toBeNull();

    pending.next();
    pending.complete();
    expect(component()['session']().phase).toBe('assign');
    expect(approve).toHaveBeenCalledTimes(1);
  });

  it('keeps the popup closed when accept is refused', () => {
    approve.mockReturnValue(
      throwError(() => new ApiError('Term is not active', 400)),
    );

    clickApprove();

    expect(approve).toHaveBeenCalledTimes(1);
    expect(component()['session']().phase).toBe('idle');
    expect(component()['session']().student).toBeNull();
    expect(component()['requests']().some((row) => row.id === 14)).toBe(true);
    expect(toast.notifyErrorBody).toHaveBeenCalled();
    expect(toast.notifySuccess).not.toHaveBeenCalled();
  });

  it('does not accept again when assignment is skipped or finished', () => {
    clickApprove();
    component()['onAssignSkipped']();
    expect(approve).toHaveBeenCalledTimes(1);
    expect(component()['session']().phase).toBe('idle');

    approve.mockClear();
    clickApprove();
    component()['onAssignDone']();
    expect(approve).toHaveBeenCalledTimes(1);
  });

  it('does not accept again after the popup is open (assign retry stays on enroll)', () => {
    clickApprove();
    clickApprove();
    expect(approve).toHaveBeenCalledTimes(1);
    expect(component()['session']().phase).toBe('assign');
  });
});
