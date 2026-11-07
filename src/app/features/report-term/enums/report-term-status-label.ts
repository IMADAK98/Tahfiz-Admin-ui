import type { TermStatus } from '../../../core/api/models/term.model';

export function reportTermStatusLabel(status: TermStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'نشطة';
    case 'COMPLETED':
      return 'مكتملة';
    case 'INACTIVE':
      return 'غير نشطة';
  }
}

export function reportTermHeading(name: string, status: TermStatus): string {
  return `${name} · ${reportTermStatusLabel(status)}`;
}

export function isCompletedTerm(status: TermStatus | null | undefined): boolean {
  return status === 'COMPLETED';
}
