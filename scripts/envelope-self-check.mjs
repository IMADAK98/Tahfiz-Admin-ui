/** ponytail: smallest runnable check for Nest envelope quirks (HTTP 201 + body.statusCode 200). */

function envelopeOk(body, httpStatus) {
  if (!body) return httpStatus >= 200 && httpStatus < 300;
  const bodyStatus = body.statusCode ?? body.status;
  if (bodyStatus !== undefined) return bodyStatus >= 200 && bodyStatus < 300;
  return httpStatus >= 200 && httpStatus < 300;
}

function unwrapData(body, httpStatus) {
  if (!body || !envelopeOk(body, httpStatus)) throw new Error('not ok');
  if (body.data === undefined) throw new Error('missing data');
  return body.data;
}

const cases = [
  [{ statusCode: 200, data: { ok: true } }, 201, { ok: true }],
  [{ status: 200, data: [] }, 200, []],
  [{ statusCode: 400, message: 'nope' }, 400, null],
];

for (const [body, http, expected] of cases) {
  if (expected === null) {
    if (envelopeOk(body, http)) throw new Error('expected failure');
    continue;
  }
  const got = unwrapData(body, http);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    throw new Error(`unexpected: ${JSON.stringify(got)}`);
  }
}

console.log('envelope-self-check: ok');
