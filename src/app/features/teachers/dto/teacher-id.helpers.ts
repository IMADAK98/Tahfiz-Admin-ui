/** Teacher/profile ids may arrive as JSON strings from live Nest — coerce defensively. */
export function coerceTeacherId(value: number | string | undefined | null): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function teacherInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '؟';
  }
  const first = trimmed.charAt(0);
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}
