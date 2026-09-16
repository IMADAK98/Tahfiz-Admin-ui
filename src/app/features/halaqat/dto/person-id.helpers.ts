export function coercePersonId(id: number | string): number {
  if (typeof id === 'number') {
    return id;
  }
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function coercePersonList<T extends { id: number | string }>(items: T[]): Array<T & { id: number }> {
  return items.map((item) => ({ ...item, id: coercePersonId(item.id) }));
}
