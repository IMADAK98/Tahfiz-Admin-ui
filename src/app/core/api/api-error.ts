import { formatNestMessage, parseNestFieldErrors } from './error-message.helpers';
import { NestErrorBody } from './models/api-envelope.model';

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly bodyStatus?: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    httpStatus: number,
    bodyStatus?: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.bodyStatus = bodyStatus;
    this.fieldErrors = fieldErrors;
  }
}

export function apiErrorFromBody(body: unknown, httpStatus: number): ApiError {
  if (body && typeof body === 'object') {
    const nest = body as NestErrorBody;
    const message = formatNestMessage(nest.message) ?? nest.error ?? 'Request failed';
    return new ApiError(message, httpStatus, nest.statusCode, parseNestFieldErrors(nest.errors));
  }
  if (typeof body === 'string' && body.trim()) {
    return new ApiError(body, httpStatus);
  }
  return new ApiError('Request failed', httpStatus);
}
