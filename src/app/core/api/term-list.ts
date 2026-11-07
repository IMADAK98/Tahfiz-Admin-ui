import type { TermListItem } from './models/term.model';

/**
 * GET /term body is the term array itself.
 * An envelope `{ data: [...] }` is a different shape and must not be unwrapped here.
 */
export function readTermList(body: unknown): TermListItem[] {
  if (!Array.isArray(body)) {
    throw new Error('GET /term did not return a term array');
  }
  return body as TermListItem[];
}
