// Node.js register hook — loaded via --import
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const loaderUrl = new URL('./_loader.mjs', import.meta.url);
register(loaderUrl.href, pathToFileURL('./'));
