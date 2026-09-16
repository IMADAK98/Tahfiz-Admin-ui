import { NestErrorBody } from './models/api-envelope.model';

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly bodyStatus?: number;

  constructor(message: string, httpStatus: number, bodyStatus?: number) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.bodyStatus = bodyStatus;
  }
}

export function apiErrorFromBody(body: unknown, httpStatus: number): ApiError {
  if (body && typeof body === 'object') {
    const nest = body as NestErrorBody;
    const message = formatNestMessage(nest.message) ?? nest.error ?? 'Request failed';
    return new ApiError(message, httpStatus, nest.statusCode);
  }
  return new ApiError('Request failed', httpStatus);
}

function formatNestMessage(message: NestErrorBody['message']): string | undefined {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return undefined;
}
