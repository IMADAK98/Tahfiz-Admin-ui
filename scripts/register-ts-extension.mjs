/**
 * ponytail: Node's strip-types loader does not resolve Angular's extensionless
 * imports. Only the edit-term self-check needs this, because that module now
 * imports local-date.ts. Upgrade path: drop the hook if Node resolves .ts.
 */
import { register } from 'node:module';

const source = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\\.(?:[cm]?js|ts|json|node)$/.test(specifier)) {
    return nextResolve(specifier + '.ts', context);
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(source)}`, {
  parentURL: import.meta.url,
});
