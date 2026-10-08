/** Nest response wrapper — HTTP status may be 201 while body.statusCode/status is 200. */
export interface ApiEnvelope<T = unknown> {
  statusCode?: number;
  status?: number;
  message?: string;
  data?: T;
}

/** Nest 400 field-level validation item (center-signup POC contract). */
export interface NestFieldError {
  fieldName: string;
  message: string;
}

export interface NestErrorBody {
  statusCode?: number;
  status?: number;
  message?: string | string[];
  error?: string;
  /** Nest error key, e.g. TEACHER_HAS_ASSIGNED_HALAQAS. May also arrive as `message`. */
  code?: string;
  errors?: NestFieldError[];
}
