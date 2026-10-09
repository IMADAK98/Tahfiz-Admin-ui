/** Immediate plans-tab patches. The signal must change before the details refetch. */

export function plansWithoutItem<T extends { id: number; items: ReadonlyArray<{ id: number }> }>(
  plans: readonly T[],
  planId: number,
  itemId: number,
): T[] {
  return plans.map((plan) => {
    if (plan.id !== planId || !plan.items.some((item) => item.id === itemId)) {
      return plan;
    }
    return { ...plan, items: plan.items.filter((item) => item.id !== itemId) };
  });
}

export function plansWithStudents<
  T extends { id: number; students: ReadonlyArray<{ id: number }> },
  S extends { id: number },
>(plans: readonly T[], planId: number, additions: readonly S[]): T[] {
  if (!additions.length) {
    return [...plans];
  }
  return plans.map((plan) => {
    if (plan.id !== planId) {
      return plan;
    }
    const seen = new Set(plan.students.map((student) => student.id));
    const students = [...plan.students];
    for (const student of additions) {
      if (seen.has(student.id)) {
        continue;
      }
      seen.add(student.id);
      students.push(student as T['students'][number]);
    }
    if (students.length === plan.students.length) {
      return plan;
    }
    return { ...plan, students };
  });
}
