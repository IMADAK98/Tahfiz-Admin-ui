import {
  CreateManualStudentPayload,
  EducationStage,
  HifzQuality,
} from '../../../core/api/models/student.model';

export type YesNo = '' | 'true' | 'false';

export interface StudentFormModel {
  fullName: string;
  email: string;
  phone: string;
  educationStage: EducationStage | '';
  identificationNumber: string;
  passportNumber: string;
  address: string;
  birthDate: string;
  parentPhone: string;
  surahFrom: number | null;
  surahTo: number | null;
  hifzQuality: HifzQuality | '';
  isHafiz: YesNo;
}

export function createEmptyStudentForm(): StudentFormModel {
  return {
    fullName: '',
    email: '',
    phone: '',
    educationStage: '',
    identificationNumber: '',
    passportNumber: '',
    address: '',
    birthDate: '',
    parentPhone: '',
    surahFrom: null,
    surahTo: null,
    hifzQuality: '',
    isHafiz: '',
  };
}

/** Nest DTO keys so messages land on `<app-field-error>` (UI `fullName` → Nest `name`). */
export function validateStudentForm(form: StudentFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) {
    errors['name'] = 'الاسم الكامل مطلوب';
  }
  if (!form.email.trim()) {
    errors['email'] = 'البريد الإلكتروني مطلوب';
  }
  if (!form.phone.trim()) {
    errors['phone'] = 'رقم الجوال مطلوب';
  }
  if (!form.educationStage) {
    errors['educationStage'] = 'اختر المرحلة الدراسية';
  }
  const identificationNumber = form.identificationNumber.trim();
  if (!identificationNumber) {
    errors['identificationNumber'] = 'رقم الهوية مطلوب';
  } else if (identificationNumber.length > 10) {
    errors['identificationNumber'] = 'رقم الهوية يجب ألا يتجاوز 10 خانات';
  }
  const passportNumber = form.passportNumber.trim();
  if (!passportNumber) {
    errors['passportNumber'] = 'رقم الجواز مطلوب';
  } else if (passportNumber.length > 10) {
    errors['passportNumber'] = 'رقم الجواز يجب ألا يتجاوز 10 خانات';
  }
  if (!form.address.trim()) {
    errors['address'] = 'العنوان مطلوب';
  }
  if (!form.birthDate.trim()) {
    errors['birthDate'] = 'تاريخ الميلاد مطلوب';
  }
  if (!form.parentPhone.trim()) {
    errors['parentPhone'] = 'جوال ولي الأمر مطلوب';
  }
  if (form.surahFrom === null || form.surahFrom < 1 || form.surahFrom > 114) {
    errors['surahFrom'] = 'أدخل سورة البداية (1 إلى 114)';
  }
  if (form.surahTo === null || form.surahTo < 1 || form.surahTo > 114) {
    errors['surahTo'] = 'أدخل سورة النهاية (1 إلى 114)';
  }
  if (!form.hifzQuality) {
    errors['hifzQuality'] = 'اختر جودة الحفظ';
  }
  if (!form.isHafiz) {
    errors['isHafiz'] = 'اختر حالة الحفظ';
  }
  return errors;
}

function yesNoToBool(value: YesNo): boolean {
  return value === 'true';
}

/** Live DTO wants ISO date-time; the date input yields YYYY-MM-DD. */
function toIsoDateTime(dateInput: string): string {
  if (dateInput.includes('T')) {
    return dateInput;
  }
  return `${dateInput}T00:00:00.000Z`;
}

export function buildCreateManualStudentPayload(
  form: StudentFormModel,
): CreateManualStudentPayload {
  return {
    name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    educationStage: form.educationStage as EducationStage,
    identificationNumber: form.identificationNumber.trim(),
    passportNumber: form.passportNumber.trim(),
    address: form.address.trim(),
    birthDate: toIsoDateTime(form.birthDate),
    parentPhone: form.parentPhone.trim(),
    surahFrom: form.surahFrom ?? 1,
    surahTo: form.surahTo ?? 1,
    hifzQuality: form.hifzQuality as HifzQuality,
    isHafiz: yesNoToBool(form.isHafiz),
  };
}
