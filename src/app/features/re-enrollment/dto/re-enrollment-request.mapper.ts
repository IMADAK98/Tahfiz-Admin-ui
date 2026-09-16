import { ReEnrollmentRequest } from '../../../core/api/models/re-enrollment.model';
import { ReEnrollmentStatus } from '../enums/re-enrollment-status.enum';

export interface ReEnrollmentRequestView {
  id: number;
  existingUserId: number;
  termId: number;
  appliedToCenterId: number;
  status: ReEnrollmentStatus;
  studentName: string;
  email: string | null;
  phoneNumber: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  previousTermName: string | null;
  termLabel: string;
  halqaLabel: string | null;
  memorizationStatus: string | null;
  suggestedTeacherLabel: string | null;
  educationStage: string | null;
  createdAt: string | null;
}

function coerceId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: unknown): ReEnrollmentStatus {
  const raw = String(value ?? ReEnrollmentStatus.Pending).toUpperCase();
  if (raw === ReEnrollmentStatus.Approved) {
    return ReEnrollmentStatus.Approved;
  }
  if (raw === ReEnrollmentStatus.Rejected) {
    return ReEnrollmentStatus.Rejected;
  }
  return ReEnrollmentStatus.Pending;
}

export function mapReEnrollmentRequest(
  raw: ReEnrollmentRequest,
  termNames: ReadonlyMap<number, string>,
): ReEnrollmentRequestView {
  const termId = coerceId(raw.termId);
  const termName = raw.termName?.trim() || termNames.get(termId);
  const termLabel = termName ? `${termName} (termId ${termId})` : `termId ${termId}`;

  const halqaId = raw.halqaId != null ? coerceId(raw.halqaId) : null;
  const halqaLabel =
    raw.halqaName?.trim() ?
      halqaId != null ?
        `${raw.halqaName} (ḥalaqaId ${halqaId})`
      : raw.halqaName
    : null;

  const teacherId = raw.suggestedTeacherId != null ? coerceId(raw.suggestedTeacherId) : null;
  const suggestedTeacherLabel =
    raw.suggestedTeacherName?.trim() ?
      teacherId != null ?
        `${raw.suggestedTeacherName} (userId ${teacherId})`
      : raw.suggestedTeacherName
    : null;

  const studentName =
    raw.studentName?.trim() || raw.name?.trim() || `طالب #${coerceId(raw.existingUserId)}`;

  return {
    id: coerceId(raw.id),
    existingUserId: coerceId(raw.existingUserId),
    termId,
    appliedToCenterId: coerceId(raw.appliedToCenterId),
    status: normalizeStatus(raw.status),
    studentName,
    email: raw.email?.trim() || null,
    phoneNumber: raw.phoneNumber?.trim() || null,
    guardianName: raw.guardianName?.trim() || null,
    guardianPhone: raw.guardianPhone?.trim() || null,
    previousTermName: raw.previousTermName?.trim() || null,
    termLabel,
    halqaLabel,
    memorizationStatus: raw.memorizationStatus?.trim() || null,
    suggestedTeacherLabel,
    educationStage: raw.educationStage?.trim() || null,
    createdAt: raw.createdAt ?? null,
  };
}
