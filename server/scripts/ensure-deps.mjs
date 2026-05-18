import {
  existsSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { debugLog } from './debug-log.mjs';
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

function linkDiagnostics() {
  const linkedPkg = resolve(linkPath, 'package.json');
  let readlink = null;
  let realpath = null;
  try {
    if (existsSync(linkPath)) readlink = readlinkSync(linkPath);
  } catch {
    /* ignore */
  }
  try {
    if (existsSync(linkPath)) realpath = realpathSync(linkPath);
  } catch {
    /* ignore */
  }
  return {
    serverRoot,
    sharedRoot,
    linkPath,
    linkExists: existsSync(linkPath),
    linkedPkgExists: existsSync(linkedPkg),
    readlink,
    realpath,
    sharedDistExists: existsSync(sharedDist),
    sharedLinkReady: sharedLinkReady(),
    correctRelativeFromScope: '../../../shared',
  };
}

/** Absolute symlink so Node/tsc resolve @growth-world/shared (not ../../shared). */
function linkSharedAbsolute() {
  const scopeDir = resolve(serverRoot, 'node_modules/@growth-world');
  const target = resolve(sharedRoot);
  mkdirSync(scopeDir, { recursive: true });

  if (existsSync(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true });
  }

  symlinkSync(target, linkPath, 'dir');
}

if (!existsSync(sharedPkg)) {
  console.error(
    '[ensure-deps] Missing ../shared/package.json — deploy shared/ next to server/.',
  );
  process.exit(1);
}

debugLog('H1', 'ensure-deps.mjs:start', 'paths', linkDiagnostics());

if (!existsSync(resolve(sharedRoot, 'node_modules'))) {
  run('npm install --include=dev', sharedRoot);
}

if (!existsSync(sharedDist)) {
  run('npm run build', sharedRoot);
}

run('npm install --include=dev', serverRoot);

debugLog('H2', 'ensure-deps.mjs:after-npm-install', 'before link', linkDiagnostics());

try {
  if (!sharedLinkReady()) {
    linkSharedAbsolute();
  }
} catch (err) {
  debugLog('H3', 'ensure-deps.mjs:link-error', 'symlink failed', {
    ...linkDiagnostics(),
    error: err instanceof Error ? err.message : String(err),
  });
  console.error('[ensure-deps] Failed to create shared symlink:', err);
  process.exit(1);
}

const after = linkDiagnostics();
debugLog('H4', 'ensure-deps.mjs:after-link', 'after link', after);

if (!sharedSiblingReady()) {
  console.error(
    '[ensure-deps] shared/dist is missing.\n' +
      '  cd ../shared && npm install --include=dev && npm run build',
  );
  process.exit(1);
}

if (!after.linkedPkgExists) {
  console.error(
    '[ensure-deps] @growth-world/shared is not resolvable in node_modules.\n' +
      `  Expected link: ${linkPath}\n` +
      `  Target folder: ${sharedRoot}\n` +
      '  Run: ln -sfn "$(pwd)/../shared" node_modules/@growth-world/shared\n' +
      '  (from server/, NOT ../../shared — that points to server/shared)',
  );
  process.exit(1);
}

if (!after.sharedLinkReady) {
  console.warn(
    '[ensure-deps] Link path check differs from realpath but package.json is present — continuing.',
  );
}
