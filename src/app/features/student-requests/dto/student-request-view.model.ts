import { StudentRequestApiRecord } from '../../../core/api/models/student-request.model';
import { ageFromBirthDate, coerceStudentId } from '../../students/dto';
import { educationStageLabel, hifzQualityLabel } from '../../students/enums';

export interface StudentRequestViewModel {
  id: number;
  name: string;
  email: string;
  phone: string;
  educationStage: string | null;
  educationStageLabel: string;
  identificationNumber: string;
  passportNumber: string;
  address: string;
  birthDate: string | null;
  ageYears: number | null;
  parentPhone: string;
  surahFrom: string | null;
  surahTo: string | null;
  hifzQuality: string | null;
  hifzQualityLabel: string;
  isHafiz: boolean | null;
  appliedToCenterId: number | null;
  termId: number | null;
  existingUserId: number | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string | null;
}

function optionalText(value: unknown): string {
  if (value == null) {
    return '—';
  }
  const trimmed = String(value).trim();
  return trimmed || '—';
}

function optionalNullable(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
}

export function mapStudentRequest(record: StudentRequestApiRecord): StudentRequestViewModel {
  const surahFrom = optionalNullable(record.surah_from ?? record.surahFrom);
  const surahTo = optionalNullable(record.surah_to ?? record.surahTo);
  const birthDate = optionalNullable(record.birthDate);
  const educationStage = optionalNullable(record.educationStage);
  const hifzQuality = optionalNullable(record.hifzQuality);

  return {
    id: coerceStudentId(record.id),
    name: record.name?.trim() || '—',
    email: optionalText(record.email),
    phone: optionalText(record.phone),
    educationStage,
    educationStageLabel: educationStageLabel(educationStage),
    identificationNumber: optionalText(record.identificationNumber),
    passportNumber: optionalText(record.passportNumber),
    address: optionalText(record.address),
    birthDate,
    ageYears: ageFromBirthDate(birthDate),
    parentPhone: optionalText(record.parentPhone),
    surahFrom,
    surahTo,
    hifzQuality,
    hifzQualityLabel: hifzQualityLabel(hifzQuality),
    isHafiz: record.isHafiz ?? null,
    appliedToCenterId: record.appliedToCenterId != null ? coerceStudentId(record.appliedToCenterId) : null,
    termId: record.termId != null ? coerceStudentId(record.termId) : null,
    existingUserId: record.existingUserId != null ? coerceStudentId(record.existingUserId) : null,
    status: record.status ?? 'PENDING',
    rejectionReason: optionalNullable(record.rejectionReason),
    createdAt: optionalNullable(record.createdAt),
  };
}

export function hifzSummary(request: StudentRequestViewModel): string {
  const quality = request.hifzQualityLabel !== '—' ? request.hifzQualityLabel : null;
  if (request.isHafiz) {
    return quality ? `حافظ — ${quality}` : 'حافظ';
  }
  if (request.surahFrom && request.surahTo) {
    const range = `من سورة ${request.surahFrom} إلى ${request.surahTo}`;
    return quality ? `${quality} — ${range}` : range;
  }
  return quality ?? '—';
}
