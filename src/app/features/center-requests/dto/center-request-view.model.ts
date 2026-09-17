import { CenterRequestApiRecord } from '../../../core/api/models/center-request.model';

export interface CenterRequestViewModel {
  id: number;
  centerName: string;
  centerAddress: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminIdentificationNumber: string;
  adminPassportNumber: string;
  adminBirthDate: string;
  adminNationality: string;
  adminAddress: string;
  status: string;
  rejectionReason: string | null;
  centerId: number | null;
  centerIdLabel: string;
}

/** Ids may arrive as JSON strings from live Nest — coerce defensively. */
export function coerceCenterRequestId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function coerceOptionalId(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function displayText(value: unknown): string {
  if (value == null) {
    return '—';
  }
  const trimmed = String(value).trim();
  return trimmed || '—';
}

/** Show ISO date prefix when Nest sends a datetime; otherwise the raw string. */
export function displayDate(value: unknown): string {
  const text = displayText(value);
  if (text === '—') {
    return text;
  }
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate ? isoDate[1] : text;
}

export function mapCenterRequest(record: CenterRequestApiRecord): CenterRequestViewModel {
  const centerId = coerceOptionalId(record.centerId ?? record.center?.id);
  const rejection = record.rejectionReason?.trim() || null;

  return {
    id: coerceCenterRequestId(record.id),
    centerName: record.centerName?.trim() || '—',
    centerAddress: displayText(record.centerAddress),
    adminName: displayText(record.adminName),
    adminEmail: displayText(record.adminEmail),
    adminPhone: displayText(record.adminPhone),
    adminIdentificationNumber: displayText(record.adminIdentificationNumber),
    adminPassportNumber: displayText(record.adminPassportNumber),
    adminBirthDate: displayDate(record.adminBirthDate),
    adminNationality: displayText(record.adminNationality),
    adminAddress: displayText(record.adminAddress),
    status: record.status,
    rejectionReason: rejection,
    centerId,
    centerIdLabel: centerId != null ? `centerId ${centerId}` : '—',
  };
}
