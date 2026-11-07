import { CreatedManualStudent } from '../../../core/api/models/student.model';
import { ReEnrollmentRequestView } from './re-enrollment-request.mapper';

export type AcceptAssignPhase = 'idle' | 'approving' | 'assign';

export interface AcceptAssignSession {
  phase: AcceptAssignPhase;
  requestId: number | null;
  student: CreatedManualStudent | null;
  /**
   * Request term for GET /halqa/by-term/:termId.
   * `0` means the row had no term — callers must not fall back to active-ḥalaqas.
   * `null` is idle (no popup).
   */
  termId: number | null;
}

type AssignRequest = Pick<
  ReEnrollmentRequestView,
  'id' | 'existingUserId' | 'termId' | 'email' | 'name'
>;

export function idleAcceptAssign(): AcceptAssignSession {
  return { phase: 'idle', requestId: null, student: null, termId: null };
}

/** Second click while approving, or any click while the assign popup is open, does not start another accept. */
export function beginAccept(
  session: AcceptAssignSession,
  requestId: number,
): AcceptAssignSession | null {
  if (session.phase !== 'idle') {
    return null;
  }
  return { phase: 'approving', requestId, student: null, termId: null };
}

/**
 * `studentsIds` must be the numeric `existingUserId` from the request.
 * Approve `data.id` is a string GetUserDto id and is ignored, including when it
 * is a different number or the same digits as a string.
 */
export function enrollUserId(existingUserId: number, approvalData?: unknown): number | null {
  void approvalData;
  return existingUserId > 0 ? existingUserId : null;
}

export function acceptSucceeded(
  request: AssignRequest,
  approvalData?: unknown,
): AcceptAssignSession {
  return {
    phase: 'assign',
    requestId: request.id,
    student: {
      id: enrollUserId(request.existingUserId, approvalData),
      email: request.email ?? undefined,
      name: request.name,
    },
    termId: request.termId > 0 ? request.termId : 0,
  };
}

/** Approval refusal, ended term, or any accept error: do not open assignment. */
export function acceptFailed(): AcceptAssignSession {
  return idleAcceptAssign();
}

/** Skip or successful assign. Acceptance is already saved; this only closes the popup. */
export function acceptAssignSettled(): AcceptAssignSession {
  return idleAcceptAssign();
}
