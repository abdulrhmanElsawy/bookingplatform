import {
  existsSync,
  lstatSync,
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

function linkEntryPresent() {
  try {
    lstatSync(linkPath);
    return true;
  } catch (err) {
    return !(err && typeof err === 'object' && err.code === 'ENOENT');
  }
}

function linkDiagnostics() {
  const linkedPkg = resolve(linkPath, 'package.json');
  const entryPresent = linkEntryPresent();
  let readlink = null;
  let realpath = null;
  let lstatIsSymbolicLink = false;
  try {
    if (entryPresent) {
      const st = lstatSync(linkPath);
      lstatIsSymbolicLink = st.isSymbolicLink();
      readlink = readlinkSync(linkPath);
    }
  } catch {
    /* ignore */
  }
  try {
    if (entryPresent) realpath = realpathSync(linkPath);
  } catch {
    /* ignore */
  }
  return {
    serverRoot,
    sharedRoot,
    linkPath,
    linkEntryPresent: entryPresent,
    linkExists: existsSync(linkPath),
    brokenSymlink: entryPresent && !existsSync(linkPath),
    lstatIsSymbolicLink,
    linkedPkgExists: existsSync(linkedPkg),
    readlink,
    realpath,
    sharedDistExists: existsSync(sharedDist),
    sharedLinkReady: sharedLinkReady(),
    correctRelativeFromScope: '../../../shared',
  };
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

debugLog('H1', 'ensure-deps.mjs:start', 'paths', linkDiagnostics());

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
  debugLog('H2', 'ensure-deps.mjs:after-npm-install', 'after fresh install', linkDiagnostics());
} else {
  debugLog('H2', 'ensure-deps.mjs:skip-npm-install', 'server deps present', linkDiagnostics());
}

try {
  if (!sharedLinkReady()) {
    linkSharedAbsolute();
  }
} catch (err) {
  const diag = linkDiagnostics();
  debugLog('H3', 'ensure-deps.mjs:link-error', 'symlink failed', {
    ...diag,
    error: err instanceof Error ? err.message : String(err),
  });
  if (diag.linkedPkgExists || sharedLinkReady()) {
    debugLog('H5', 'ensure-deps.mjs:link-recover', 'link ok after error', diag);
  } else {
    console.error('[ensure-deps] Failed to create shared symlink:', err);
    process.exit(1);
  }
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
