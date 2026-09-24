import type { CenterApiRecord } from '../../../core/api/models/center.model';

/** View-only. No phone, email, city, logo, or center id. */
export interface CenterProfileView {
  name: string;
  address: string;
  isActive: boolean;
  initial: string;
}

export function mapCenterProfile(record: CenterApiRecord): CenterProfileView {
  const name = displayText(record.name);
  return {
    name,
    address: displayText(record.address),
    isActive: record.isActive === true,
    initial: name === '—' ? 'م' : name.charAt(0),
  };
}

function displayText(value: unknown): string {
  if (value == null) {
    return '—';
  }
  const trimmed = String(value).trim();
  return trimmed || '—';
}
