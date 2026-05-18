import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  sharedDist,
  sharedPkg,
  sharedRoot,
  sharedSiblingReady,
} from './shared-link.mjs';

function fail(message) {
  console.error(`\n[prestart] ${message}\n`);
  process.exit(1);
}

if (!existsSync(sharedPkg)) {
  fail('Missing ../shared folder. Deploy shared/ next to server/ on the host.');
}

if (!existsSync(sharedDist)) {
  console.info('[prestart] Building @growth-world/shared...');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: sharedRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    fail('Could not build shared/. Run: cd ../shared && npm install --include=dev && npm run build');
  }
}

if (!sharedSiblingReady()) {
  fail('shared/dist/index.js is still missing after build.');
}
