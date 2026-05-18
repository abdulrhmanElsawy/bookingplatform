import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.dirname(scriptsDir);

await cp(path.join(serverRoot, 'src', 'i18n'), path.join(serverRoot, 'dist', 'i18n'), {
  recursive: true,
});
