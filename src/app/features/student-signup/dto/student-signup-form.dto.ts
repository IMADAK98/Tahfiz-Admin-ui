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

/** Nest DTO keys so step/submit messages land under inputs. */
export function validateStudentSignupForm(
  form: StudentSignupFormValues,
  step: 1 | 2,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.name.trim()) {
      errors['name'] = 'الاسم الكامل مطلوب';
    }
    if (!form.email.trim()) {
      errors['email'] = 'البريد الإلكتروني مطلوب';
    }
    if (!form.phone.trim()) {
      errors['phone'] = 'رقم الجوال مطلوب';
    }
    if (!form.birthDate.trim()) {
      errors['birthDate'] = 'تاريخ الميلاد مطلوب';
    }
    if (!form.address.trim()) {
      errors['address'] = 'العنوان مطلوب';
    }
    if (!form.educationStage) {
      errors['educationStage'] = 'اختر المرحلة الدراسية';
    }
    if (form.usePassport) {
      if (!form.passportNumber.trim()) {
        errors['passportNumber'] = 'رقم الجواز مطلوب';
      }
    } else if (!form.identificationNumber.trim()) {
      errors['identificationNumber'] = 'رقم الهوية مطلوب';
    }
    if (!form.parentPhone.trim()) {
      errors['parentPhone'] = 'جوال ولي الأمر مطلوب';
    }
    return errors;
  }

  if (!form.surahFrom || form.surahFrom < 1 || form.surahFrom > 114) {
    errors['surahFrom'] = 'أدخل سورة البداية (1 إلى 114)';
  }
  if (!form.surahTo || form.surahTo < 1 || form.surahTo > 114) {
    errors['surahTo'] = 'أدخل سورة النهاية (1 إلى 114)';
  }
  return errors;
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
