/** Nest response wrapper — HTTP status may be 201 while body.statusCode/status is 200. */
export interface ApiEnvelope<T = unknown> {
  statusCode?: number;
  status?: number;
  message?: string;
  data?: T;
}

export interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
