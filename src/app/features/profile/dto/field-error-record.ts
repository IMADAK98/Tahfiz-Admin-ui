/** Drops empty keys so FieldErrorBag.applyMap stays a string map. */
export function fieldErrorRecord(errors: object): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === 'string' && value) {
      record[key] = value;
    }
  }
  return record;
}
