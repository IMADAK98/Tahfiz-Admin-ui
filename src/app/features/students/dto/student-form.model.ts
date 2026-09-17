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

export function validateStudentForm(form: StudentFormModel): string | null {
  if (!form.fullName.trim()) {
    return 'الاسم الكامل مطلوب';
  }
  if (!form.email.trim()) {
    return 'البريد الإلكتروني مطلوب';
  }
  if (!form.phone.trim()) {
    return 'رقم الجوال مطلوب';
  }
  if (!form.educationStage) {
    return 'اختر المرحلة الدراسية';
  }
  if (!form.identificationNumber.trim()) {
    return 'رقم الهوية مطلوب';
  }
  if (form.identificationNumber.trim().length > 10) {
    return 'رقم الهوية يجب ألا يتجاوز 10 خانات';
  }
  if (!form.passportNumber.trim()) {
    return 'رقم الجواز مطلوب';
  }
  if (form.passportNumber.trim().length > 10) {
    return 'رقم الجواز يجب ألا يتجاوز 10 خانات';
  }
  if (!form.address.trim()) {
    return 'العنوان مطلوب';
  }
  if (!form.birthDate.trim()) {
    return 'تاريخ الميلاد مطلوب';
  }
  if (!form.parentPhone.trim()) {
    return 'جوال ولي الأمر مطلوب';
  }
  if (form.surahFrom === null || form.surahFrom < 1 || form.surahFrom > 114) {
    return 'أدخل سورة البداية (1 إلى 114)';
  }
  if (form.surahTo === null || form.surahTo < 1 || form.surahTo > 114) {
    return 'أدخل سورة النهاية (1 إلى 114)';
  }
  if (!form.hifzQuality) {
    return 'اختر جودة الحفظ';
  }
  if (!form.isHafiz) {
    return 'اختر حالة الحفظ';
  }
  return null;
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

export function buildCreateManualStudentPayload(form: StudentFormModel): CreateManualStudentPayload {
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
