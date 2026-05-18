import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharedRoot = resolve(serverRoot, '../shared');
const sharedPkg = resolve(sharedRoot, 'package.json');
const sharedDist = resolve(sharedRoot, 'dist/index.js');
const scopeDir = resolve(serverRoot, 'node_modules/@growth-world');
const linkPath = resolve(scopeDir, 'shared');

export { serverRoot, sharedRoot, sharedPkg, sharedDist, linkPath };

/** True when ../shared is present and built. */
export function sharedSiblingReady() {
  return existsSync(sharedPkg) && existsSync(sharedDist);
}

/** True when node_modules link resolves to ../shared. */
export function sharedLinkReady() {
  if (!existsSync(linkPath) || !existsSync(sharedPkg)) return false;

  const sharedReal = resolve(sharedRoot);

  try {
    if (resolve(realpathSync(linkPath)) === sharedReal) return true;
  } catch {
    /* fall through */
  }

  try {
    const raw = readlinkSync(linkPath);
    const fromLink = resolve(dirname(linkPath), raw);
    if (resolve(fromLink) === sharedReal) return true;
  } catch {
    /* not a symlink */
  }

  return false;
}

function removeLinkPath() {
  if (!existsSync(linkPath)) return;
  rmSync(linkPath, { recursive: true, force: true });
}

function tryCreateSymlink() {
  mkdirSync(scopeDir, { recursive: true });
  removeLinkPath();
  try {
    symlinkSync(sharedRoot, linkPath, 'dir');
  } catch (err) {
    if (err && typeof err === 'object' && err.code === 'EEXIST') {
      return;
    }
    throw err;
  }
}

/**
 * Ensure @growth-world/shared is available. Never throws EEXIST — npm's link is enough.
 */
export function ensureSharedLink() {
  if (!existsSync(sharedPkg)) {
    throw new Error(
      `Missing ${sharedRoot} — deploy shared/ next to server/ on the host.`,
    );
  }

  if (sharedLinkReady() || (existsSync(linkPath) && sharedSiblingReady())) {
    return;
  }

  tryCreateSymlink();

  if (!sharedLinkReady() && !(existsSync(linkPath) && sharedSiblingReady())) {
    throw new Error(
      `Could not link @growth-world/shared (expected at ${linkPath}).`,
    );
  }
}
