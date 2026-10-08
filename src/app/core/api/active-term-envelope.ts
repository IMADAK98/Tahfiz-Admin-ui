/**
 * Nest `GET /center/:id/active-term` returns HTTP 200 with `status: 404` and
 * `data: null` when the center has no active term. It does not use HTTP 404.
 */
export interface ActiveTermEnvelopeBody {
  statusCode?: number;
  status?: number;
  data?: unknown;
}

export function isNoActiveTermEnvelope(
  body: ActiveTermEnvelopeBody | null | undefined,
  httpStatus: number,
): boolean {
  if (httpStatus === 404) {
    return true;
  }
  const bodyStatus = body?.statusCode ?? body?.status;
  return bodyStatus === 404;
}

/** Active-term read no longer returns the term the admin just tried to end. */
export function activeTermReadDroppedTerm(
  endedTermId: number,
  activeTerm: { id: number } | null,
): boolean {
  return activeTerm == null || activeTerm.id !== endedTermId;
}
