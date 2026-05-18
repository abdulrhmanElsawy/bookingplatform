import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharedRoot = resolve(serverRoot, '../shared');
const sharedDist = resolve(sharedRoot, 'dist/index.js');
const linkedPkg = resolve(serverRoot, 'node_modules/@growth-world/shared/package.json');
const rootLinkedPkg = resolve(serverRoot, '../node_modules/@growth-world/shared/package.json');

function fail(message) {
  console.error(`\n[prestart] ${message}\n`);
  process.exit(1);
}

if (!existsSync(sharedRoot)) {
  fail(
    'Missing ../shared folder. Deploy shared/ next to server/ (full monorepo), not only server/dist.',
  );
}

if (!existsSync(linkedPkg) && !existsSync(rootLinkedPkg)) {
  fail(
    'Package @growth-world/shared is not installed.\n' +
      '  From project root: npm install && npm run build -w shared\n' +
      '  Or from server/:   npm install (requires ../shared)',
  );
}

if (!existsSync(sharedDist)) {
  console.info('[prestart] Building @growth-world/shared...');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: sharedRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    fail(
      'Could not build shared/. Upload shared/dist from your machine, or install devDependencies and run: npm run build -w shared',
    );
  }
}

if (!existsSync(sharedDist)) {
  fail('shared/dist/index.js is still missing after build.');
}
