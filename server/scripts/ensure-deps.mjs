import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  linkPath,
  serverRoot,
  sharedDist,
  sharedPkg,
  sharedRoot,
  sharedSiblingReady,
  sharedLinkReady,
} from './shared-link.mjs';

function run(cmd, cwd) {
  console.info(`[ensure-deps] ${cmd} (in ${cwd})`);
  const result = spawnSync(cmd, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function linkEntryPresent() {
  try {
    lstatSync(linkPath);
    return true;
  } catch (err) {
    return !(err && typeof err === 'object' && err.code === 'ENOENT');
  }
}

/** Remove link path including broken symlinks (existsSync is false for those). */
function removeLinkEntry() {
  if (!linkEntryPresent()) return;
  rmSync(linkPath, { recursive: true, force: true });
}

/** Absolute symlink so Node/tsc resolve @growth-world/shared (not ../../shared). */
function linkSharedAbsolute() {
  const scopeDir = resolve(serverRoot, 'node_modules/@growth-world');
  const target = resolve(sharedRoot);
  mkdirSync(scopeDir, { recursive: true });

  removeLinkEntry();

  try {
    symlinkSync(target, linkPath, 'dir');
  } catch (err) {
    if (err && typeof err === 'object' && err.code === 'EEXIST') {
      removeLinkEntry();
      symlinkSync(target, linkPath, 'dir');
      return;
    }
    throw err;
  }
}

if (!existsSync(sharedPkg)) {
  console.error(
    '[ensure-deps] Missing ../shared/package.json — deploy shared/ next to server/.',
  );
  process.exit(1);
}

if (!existsSync(resolve(sharedRoot, 'node_modules'))) {
  run('npm install --include=dev', sharedRoot);
}

if (!existsSync(sharedDist)) {
  run('npm run build', sharedRoot);
}

const serverDepsReady = existsSync(resolve(serverRoot, 'node_modules/express/package.json'));

// npm install resets file:../shared to a relative symlink that often breaks on cPanel.
if (!serverDepsReady) {
  run('npm install --include=dev', serverRoot);
}

try {
  if (!sharedLinkReady()) {
    linkSharedAbsolute();
  }
} catch (err) {
  const linkedPkg = resolve(linkPath, 'package.json');
  if (!existsSync(linkedPkg) && !sharedLinkReady()) {
    console.error('[ensure-deps] Failed to create shared symlink:', err);
    process.exit(1);
  }
}

if (!sharedSiblingReady()) {
  console.error(
    '[ensure-deps] shared/dist is missing.\n' +
      '  cd ../shared && npm install --include=dev && npm run build',
  );
  process.exit(1);
}

const linkedPkg = resolve(linkPath, 'package.json');
if (!existsSync(linkedPkg)) {
  console.error(
    '[ensure-deps] @growth-world/shared is not resolvable in node_modules.\n' +
      `  Expected link: ${linkPath}\n` +
      `  Target folder: ${sharedRoot}\n` +
      '  Run: ln -sfn "$(pwd)/../shared" node_modules/@growth-world/shared',
  );
  process.exit(1);
}

if (!sharedLinkReady()) {
  console.warn(
    '[ensure-deps] Link path check differs from realpath but package.json is present — continuing.',
  );
}
