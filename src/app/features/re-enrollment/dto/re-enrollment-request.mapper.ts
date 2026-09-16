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
  phone: string | null;
  parentPhone: string | null;
  identityLabel: string | null;
  educationStage: string | null;
  address: string | null;
  birthDate: string | null;
  hifzSummary: string | null;
  termLabel: string;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasOptionalDetails: boolean;
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

function buildIdentityLabel(raw: ReEnrollmentRequest): string | null {
  const identificationNumber = raw.identificationNumber?.trim();
  if (identificationNumber) {
    return identificationNumber;
  }
  const passportNumber = raw.passportNumber?.trim();
  return passportNumber || null;
}

function buildHifzSummary(raw: ReEnrollmentRequest): string | null {
  if (raw.isHafiz) {
    return raw.hifzQuality?.trim() ? `حافظ — ${raw.hifzQuality.trim()}` : 'حافظ';
  }

  const from = raw.surah_from?.trim();
  const to = raw.surah_to?.trim();
  if (from && to) {
    const quality = raw.hifzQuality?.trim();
    return quality ? `من ${from} إلى ${to} — ${quality}` : `من ${from} إلى ${to}`;
  }
  if (from || to) {
    return [from, to].filter(Boolean).join(' — ');
  }
  return raw.hifzQuality?.trim() || null;
}

function formatBirthDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : trimmed;
}

export function mapReEnrollmentRequest(
  raw: ReEnrollmentRequest,
  termNames: ReadonlyMap<number, string>,
): ReEnrollmentRequestView {
  const termId = coerceId(raw.termId);
  const termName = termNames.get(termId);
  const termLabel = termName ? `${termName} (termId ${termId})` : `termId ${termId}`;

  const address = raw.address?.trim() || null;
  const birthDate = formatBirthDate(raw.birthDate);
  const hifzSummary = buildHifzSummary(raw);

  return {
    id: coerceId(raw.id),
    existingUserId: coerceId(raw.existingUserId),
    termId,
    appliedToCenterId: coerceId(raw.appliedToCenterId),
    status: normalizeStatus(raw.status),
    name: raw.name?.trim() || `طالب #${coerceId(raw.existingUserId)}`,
    email: raw.email?.trim() || null,
    phone: raw.phone?.trim() || null,
    parentPhone: raw.parentPhone?.trim() || null,
    identityLabel: buildIdentityLabel(raw),
    educationStage: educationStageLabel(raw.educationStage),
    address,
    birthDate,
    hifzSummary,
    termLabel,
    rejectionReason: raw.rejectionReason?.trim() || null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    hasOptionalDetails: !!(address || birthDate || hifzSummary),
  };
}

export function sortRequestsPendingFirst(requests: ReEnrollmentRequestView[]): ReEnrollmentRequestView[] {
  const rank = (status: ReEnrollmentStatus): number => {
    if (status === ReEnrollmentStatus.Pending) {
      return 0;
    }
    return 1;
  };

  return [...requests].sort((left, right) => {
    const byStatus = rank(left.status) - rank(right.status);
    if (byStatus !== 0) {
      return byStatus;
    }
    return right.id - left.id;
  });
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
