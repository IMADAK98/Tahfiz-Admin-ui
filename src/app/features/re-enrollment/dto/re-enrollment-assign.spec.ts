import { ApiError } from '../../../core/api/api-error';
import { toAssignableHalqas } from '../../students/students.service';
import { ReEnrollmentStatus } from '../enums/re-enrollment-status.enum';
import {
  acceptAssignSettled,
  acceptFailed,
  acceptSucceeded,
  beginAccept,
  enrollUserId,
  idleAcceptAssign,
} from './re-enrollment-assign';
import { mapReEnrollmentRequest, type ReEnrollmentRequestView } from './re-enrollment-request.mapper';

const approvalStringId = { id: '999', name: 'from-approve-dto' };

function pendingRow(
  overrides: Partial<{ existingUserId: number | string; termId: number | string }> = {},
): ReEnrollmentRequestView {
  return mapReEnrollmentRequest(
    {
      id: '14',
      existingUserId: overrides.existingUserId ?? 30,
      termId: overrides.termId ?? 31,
      appliedToCenterId: 1,
      status: 'PENDING',
      name: 'عبدالله',
      email: 'student@example.com',
    },
    new Map([[31, 'دورة ٣١']]),
  );
}

describe('re-enrollment accept then optional halaqa', () => {
  it('uses numeric existingUserId and ignores string approval data.id', () => {
    const request = pendingRow({ existingUserId: 30, termId: '31' });
    const opened = acceptSucceeded(request, approvalStringId);

    expect(request.existingUserId).toBe(30);
    expect(typeof request.existingUserId).toBe('number');
    expect(opened.student?.id).toBe(30);
    expect(typeof opened.student?.id).toBe('number');
    expect(opened.student?.id).not.toBe(approvalStringId.id);
    expect(opened.termId).toBe(31);
    expect(opened.phase).toBe('assign');
  });

  it('keeps numeric existingUserId when approval data.id is the same digits as a string', () => {
    const request = pendingRow({ existingUserId: '30', termId: 31 });
    const fromStringBody = acceptSucceeded(request, { id: '30' });
    const fromOtherBody = acceptSucceeded(request, { id: '888' });

    expect(request.existingUserId).toBe(30);
    expect(fromStringBody.student).toEqual(fromOtherBody.student);
    expect(fromStringBody.student?.id).toBe(30);
    expect(enrollUserId(0, { id: '30' })).toBeNull();
  });

  it('opens assignment only after accept, on the request term', () => {
    const request = pendingRow();
    const started = beginAccept(idleAcceptAssign(), request.id);

    expect(started?.phase).toBe('approving');
    expect(started?.student).toBeNull();

    const opened = acceptSucceeded(request, approvalStringId);
    expect(opened.termId).toBe(request.termId);
    expect(opened.termId).toBe(31);
    expect(beginAccept(opened, request.id)).toBeNull();
  });

  it('does not open assignment when approval is refused or the term cannot accept', () => {
    const request = pendingRow();
    const started = beginAccept(idleAcceptAssign(), request.id);
    expect(started).not.toBeNull();

    const refused = acceptFailed();
    expect(refused).toEqual(idleAcceptAssign());
    expect(refused.student).toBeNull();
    expect(refused.phase).toBe('idle');
  });

  it('blocks a second accept while approving and while the popup is open', () => {
    const request = pendingRow();
    const approving = beginAccept(idleAcceptAssign(), request.id)!;
    expect(beginAccept(approving, request.id)).toBeNull();

    const opened = acceptSucceeded(request, approvalStringId);
    expect(beginAccept(opened, request.id)).toBeNull();
    expect(acceptAssignSettled()).toEqual(idleAcceptAssign());
  });

  it('keeps a missing request term as 0 so the popup cannot load another term', () => {
    const request = pendingRow({ termId: 0 });
    const opened = acceptSucceeded(request, { id: '31' });
    expect(opened.termId).toBe(0);
    expect(opened.termId).not.toBeNull();
  });

  it('maps no halaqas to an empty choice list and hides a full room', () => {
    expect(toAssignableHalqas([])).toEqual({ all: [], selectable: [] });

    const full = toAssignableHalqas([
      { id: '5', name: 'ممتلئة', studentLimit: 1, studentsCount: 1 },
    ]);
    expect(full.all).toHaveLength(1);
    expect(full.selectable).toEqual([]);

    const unknownCapacity = toAssignableHalqas([{ id: '8', name: 'حلقة الفجر' }]);
    expect(unknownCapacity.selectable.map((halqa) => halqa.id)).toEqual([8]);
  });

  it('treats an already-processed accept as a refusal to open assignment', () => {
    const duplicate = new ApiError('Request not found or already processed', 404);
    expect(duplicate.httpStatus).toBe(404);
    const afterDuplicate = acceptFailed();
    expect(afterDuplicate.phase).toBe('idle');
    expect(afterDuplicate.student).toBeNull();
    expect(ReEnrollmentStatus.Approved).toBe('APPROVED');
  });
});
