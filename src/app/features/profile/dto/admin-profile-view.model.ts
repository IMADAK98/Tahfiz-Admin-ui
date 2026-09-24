import type { UserApiRecord } from '../../../core/api/models/user.model';
import { adminRoleFactLabel, adminRoleHeadLabel } from '../enums/admin-role-label';

export interface AdminProfileView {
  name: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  birthDate: string;
  identificationNumber: string;
  passportNumber: string;
  isActive: boolean;
  roleLabel: string;
  roleHeadLabel: string;
  centerName: string;
  initial: string;
}

export function mapAdminProfile(record: UserApiRecord): AdminProfileView {
  const name = displayText(record.name);
  const roleName = roleNameOf(record.role);
  return {
    name,
    email: displayText(record.email),
    phone: displayText(record.phone),
    address: displayText(record.address),
    nationality: displayText(record.nationality),
    birthDate: displayDate(record.birthDate),
    identificationNumber: displayText(record.identificationNumber),
    passportNumber: displayText(record.passportNumber),
    isActive: record.isActive === true,
    roleLabel: adminRoleFactLabel(roleName),
    roleHeadLabel: adminRoleHeadLabel(roleName),
    centerName: displayText(record.center?.name),
    initial: name === '—' ? 'م' : name.charAt(0),
  };
}

function roleNameOf(role: UserApiRecord['role']): string | null {
  if (typeof role === 'string') {
    return role.trim() || null;
  }
  if (role && typeof role === 'object' && typeof role.name === 'string') {
    return role.name.trim() || null;
  }
  return null;
}

function displayText(value: unknown): string {
  if (value == null) {
    return '—';
  }
  const trimmed = String(value).trim();
  return trimmed || '—';
}

function displayDate(value: unknown): string {
  const text = displayText(value);
  if (text === '—') {
    return text;
  }
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate ? isoDate[1] : text;
}
