import { ApiError, apiErrorFromBody } from './api-error';
import { ApiEnvelope } from './models/api-envelope.model';

/** True when Nest body status or HTTP status indicates success. */
export function envelopeOk(body: ApiEnvelope<unknown> | null | undefined, httpStatus: number): boolean {
  if (!body) {
    return httpStatus >= 200 && httpStatus < 300;
  }

  const bodyStatus = body.statusCode ?? body.status;
  if (bodyStatus !== undefined) {
    return bodyStatus >= 200 && bodyStatus < 300;
  }

  return httpStatus >= 200 && httpStatus < 300;
}

/** Unwrap `{ data }` from a Nest envelope; throws ApiError on failure. */
export function unwrapEnvelope<T>(body: ApiEnvelope<T> | null, httpStatus: number): T {
  if (!body || !envelopeOk(body, httpStatus)) {
    throw apiErrorFromBody(body, httpStatus);
  }

  if (body.data === undefined) {
    throw new ApiError(body.message ?? 'Missing response data', httpStatus, body.statusCode ?? body.status);
  }

  return body.data;
}

/** Unwrap when `data` may legitimately be null (e.g. no active term). */
export function unwrapEnvelopeOrNull<T>(body: ApiEnvelope<T | null> | null, httpStatus: number): T | null {
  if (!body || !envelopeOk(body, httpStatus)) {
    throw apiErrorFromBody(body, httpStatus);
  }

  return body.data ?? null;
}

/** Map HttpClient observe:'response' to unwrapped data. */
export function mapEnvelopeResponse<T>(res: { body: ApiEnvelope<T> | null; status: number }): T {
  return unwrapEnvelope(res.body, res.status);
}
