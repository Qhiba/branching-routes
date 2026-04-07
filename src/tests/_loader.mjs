// Node.js custom loader to resolve @/ alias to src/
import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const resolved = pathResolve(process.cwd(), 'src', specifier.slice(2));
    return nextResolve(pathToFileURL(resolved).href, context);
  }
  return nextResolve(specifier, context);
}
