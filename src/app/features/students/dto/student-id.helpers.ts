import { coerceStudentId } from '../../../core/api/models/student.model';

export { coerceStudentId };

export function studentInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '؟';
  }
  const first = trimmed.charAt(0);
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

export function formatStudentDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('ar-SA');
}

export function ageFromBirthDate(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
