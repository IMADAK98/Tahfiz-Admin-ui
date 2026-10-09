import type { StudyPlanDetailsApiRecord } from './models/study-plan.model';

export interface AssignedStudyPlanRead {
  /** False when HTTP or envelope status is not 2xx. */
  ok: boolean;
  /** Saved plan when the body included one. Null on 2xx with no plan. */
  plan: StudyPlanDetailsApiRecord | null;
}

/**
 * POST /study-plan/:id/assign-students. Live Nest may return `{ data: plan }`,
 * `{ data: null }`, or the raw plan (numeric `id`, no `data` key). A 2xx string
 * stub is not success — same rule as study-plan item delete.
 */
export function readAssignedStudyPlan(body: unknown, httpStatus: number): AssignedStudyPlanRead {
  if (!httpOk(httpStatus)) {
    return { ok: false, plan: null };
  }
  if (typeof body === 'string') {
    return { ok: false, plan: null };
  }
  const direct = planEntity(body);
  if (direct) {
    return { ok: true, plan: direct };
  }
  if (isEnvelope(body)) {
    if (!envelopeSucceeded(body, httpStatus)) {
      return { ok: false, plan: null };
    }
    if (body.data == null) {
      return { ok: true, plan: null };
    }
    return { ok: true, plan: planEntity(body.data) };
  }
  return { ok: true, plan: null };
}

function httpOk(httpStatus: number): boolean {
  return httpStatus >= 200 && httpStatus < 300;
}

function envelopeSucceeded(
  body: { statusCode?: number; status?: number },
  httpStatus: number,
): boolean {
  const bodyStatus = body.statusCode ?? body.status;
  if (bodyStatus !== undefined) {
    return bodyStatus >= 200 && bodyStatus < 300;
  }
  return httpOk(httpStatus);
}

function isEnvelope(
  body: unknown,
): body is { statusCode?: number; status?: number; data?: unknown } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }
  const record = body as Record<string, unknown>;
  return 'data' in record || 'status' in record || 'statusCode' in record;
}

function planEntity(body: unknown): StudyPlanDetailsApiRecord | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if ('data' in record && ('status' in record || 'statusCode' in record || 'message' in record)) {
    return null;
  }
  if (!finiteId(record['id'])) {
    return null;
  }
  if (!('name' in record) && !('students' in record) && !('studyPlanItems' in record)) {
    return null;
  }
  return record as unknown as StudyPlanDetailsApiRecord;
}

function finiteId(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }
  return false;
}
