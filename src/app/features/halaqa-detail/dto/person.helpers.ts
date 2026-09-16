export function coerceId(value: number | string | undefined | null): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function personDisplayName(record: {
  name?: string;
  firstName?: string;
  lastName?: string;
  user?: { name?: string; firstName?: string; lastName?: string };
}): string {
  if (record.name?.trim()) {
    return record.name.trim();
  }
  const user = record.user;
  if (user?.name?.trim()) {
    return user.name.trim();
  }
  const parts = [record.firstName ?? user?.firstName, record.lastName ?? user?.lastName].filter(
    Boolean,
  );
  return parts.join(' ').trim() || '—';
}

export function personInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '؟';
  }
  const first = trimmed.charAt(0);
  if (/[a-z]/i.test(first)) {
    return first.toUpperCase();
  }
  return first;
}

/** Roster query date — today in Asia/Riyadh (YYYY-MM-DD). */
export function todayIsoDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
