/** ponytail: smallest runnable check for zero-ḥalaqas 404 → empty list. */

function isNoHalqasForTermError(error) {
  const status = error.statusCode ?? error.status ?? 0;
  if (status !== 404) return false;
  const message = typeof error.message === 'string' ? error.message : null;
  return message !== null && /no halqas found/i.test(message);
}

const emptyCases = [
  { status: 404, message: 'No halqas found for this term' },
  { statusCode: 404, message: 'No halqas found for this term' },
];

const realErrors = [
  { status: 404, message: 'Term not found' },
  { status: 500, message: 'No halqas found for this term' },
  { status: 403, message: 'Forbidden' },
];

for (const body of emptyCases) {
  if (!isNoHalqasForTermError(body)) {
    throw new Error(`expected empty-list 404: ${JSON.stringify(body)}`);
  }
}

for (const body of realErrors) {
  if (isNoHalqasForTermError(body)) {
    throw new Error(`expected real error: ${JSON.stringify(body)}`);
  }
}

console.log('halqa-empty-404-self-check: ok');
