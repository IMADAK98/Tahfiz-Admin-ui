import { ApiError } from '../../../core/api/api-error';
import { ReEnrollmentRequest } from '../../../core/api/models/re-enrollment.model';
import { educationStageLabel } from '../enums/education-stage-labels';
import { ReEnrollmentStatus } from '../enums/re-enrollment-status.enum';

export interface ReEnrollmentRequestView {
  id: number;
  existingUserId: number;
  termId: number;
  appliedToCenterId: number;
  status: ReEnrollmentStatus;
  name: string;
  email: string | null;
  guardianLabel: string | null;
  previousTermLabel: string | null;
  termLabel: string;
  halqaLabel: string | null;
  hifzSummary: string | null;
  suggestedTeacherLabel: string | null;
  educationStage: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function coerceId(value: unknown): number {
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

function buildGuardianLabel(raw: ReEnrollmentRequest): string | null {
  const name = raw.guardianName?.trim();
  const phone = raw.parentPhone?.trim();
  if (name && phone) {
    return `${name} · ${phone}`;
  }
  return name ?? phone ?? null;
}

function buildHifzSummary(raw: ReEnrollmentRequest): string | null {
  if (raw.isHafiz) {
    return raw.hifzQuality?.trim() ? `حافظ — ${raw.hifzQuality.trim()}` : 'حافظ';
  }

  const from = raw.surah_from?.trim();
  const to = raw.surah_to?.trim();
  if (from && to) {
    const quality = raw.hifzQuality?.trim();
    if (quality) {
      return `جزئي — ${quality} — حتى ${to}`;
    }
    return `جزئي — حتى ${to}`;
  }
  return raw.hifzQuality?.trim() || null;
}

function buildHalqaLabel(raw: ReEnrollmentRequest): string | null {
  const halqaId = raw.halqaId != null ? coerceId(raw.halqaId) : null;
  const halqaName = raw.halqaName?.trim();
  if (halqaName && halqaId) {
    return `${halqaName} (ḥalaqaId ${halqaId})`;
  }
  return halqaName || null;
}

function buildSuggestedTeacherLabel(raw: ReEnrollmentRequest): string | null {
  const teacherId = raw.suggestedTeacherId != null ? coerceId(raw.suggestedTeacherId) : null;
  const teacherName = raw.suggestedTeacherName?.trim();
  if (teacherName && teacherId) {
    return `${teacherName} (userId ${teacherId})`;
  }
  return teacherName || null;
}

export function mapReEnrollmentRequest(
  raw: ReEnrollmentRequest,
  termNames: ReadonlyMap<number, string>,
): ReEnrollmentRequestView {
  const termId = coerceId(raw.termId);
  const termName = termNames.get(termId);
  const termLabel = termName ? `${termName} (termId ${termId})` : `termId ${termId}`;

  return {
    id: coerceId(raw.id),
    existingUserId: coerceId(raw.existingUserId),
    termId,
    appliedToCenterId: coerceId(raw.appliedToCenterId),
    status: normalizeStatus(raw.status),
    name: raw.name?.trim() || `طالب #${coerceId(raw.existingUserId)}`,
    email: raw.email?.trim() || null,
    guardianLabel: buildGuardianLabel(raw),
    previousTermLabel: raw.previousTermName?.trim() || null,
    termLabel,
    halqaLabel: buildHalqaLabel(raw),
    hifzSummary: buildHifzSummary(raw),
    suggestedTeacherLabel: buildSuggestedTeacherLabel(raw),
    educationStage: educationStageLabel(raw.educationStage),
    rejectionReason: raw.rejectionReason?.trim() || null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function sortRequestsPendingFirst(requests: ReEnrollmentRequestView[]): ReEnrollmentRequestView[] {
  return [...requests].sort((left, right) => right.id - left.id);
}

export function isAlreadyProcessedError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    error.httpStatus === 404 ||
    message.includes('already processed') ||
    message.includes('not found')
  );
}
