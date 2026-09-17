export interface IdentifyFormValues {
  token: string;
  termHint: string;
  usePassport: boolean;
  identification: string;
  passportNumber: string;
}

/** Coerce Nest id (often string `"26"`) to number for ActivateStudentDto. */
export function coerceId(id: number | string | null | undefined): number | null {
  if (id === null || id === undefined || id === '') return null;
  const n = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(n) ? n : null;
}
