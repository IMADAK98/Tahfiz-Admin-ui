import { EducationStage } from '../enums/education-stage.enum';
import { HifzQuality, MemorizationLevel } from '../enums/hifz-quality.enum';
import { CreatePendingStudentRequest } from '../../../core/api/models/student-signup.model';

/** Reactive / template form values for mock 12 (expanded to Nest required fields). */
export interface StudentSignupFormValues {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  educationStage: EducationStage | '';
  usePassport: boolean;
  identificationNumber: string;
  passportNumber: string;
  parentPhone: string;
  parentName: string;
  memorization: MemorizationLevel;
  surahFrom: number | null;
  surahTo: number | null;
  hifzQuality: HifzQuality;
  memDetail: string;
  token: string;
}

/** Build Nest payload. Unused ID field sent as empty string (OpenAPI requires both keys). */
export function buildPendingStudentPayload(form: StudentSignupFormValues): CreatePendingStudentRequest {
  const identificationNumber = form.usePassport ? '' : form.identificationNumber.trim();
  const passportNumber = form.usePassport ? form.passportNumber.trim() : '';

  const surahFrom = clampSurah(form.surahFrom ?? 1);
  const surahTo = clampSurah(form.surahTo ?? surahFrom);

  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    educationStage: form.educationStage || EducationStage.ElementarySchool,
    identificationNumber,
    passportNumber,
    address: form.address.trim(),
    birthDate: toIsoDateTime(form.birthDate),
    parentPhone: form.parentPhone.trim(),
    surahFrom,
    surahTo: Math.max(surahFrom, surahTo),
    hifzQuality: form.hifzQuality,
    isHafiz: form.memorization === 'khatm' || form.hifzQuality === HifzQuality.Hafiz,
    token: form.token.trim(),
  };
}

function clampSurah(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(114, Math.max(1, Math.trunc(n)));
}

/** Nest expects date-time; date input yields YYYY-MM-DD. */
function toIsoDateTime(dateOnly: string): string {
  const trimmed = dateOnly.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('T')) return trimmed;
  return `${trimmed}T00:00:00.000Z`;
}
