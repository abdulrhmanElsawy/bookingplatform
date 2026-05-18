import { appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const logPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../debug-0a9759.log',
);
const endpoint =
  'http://127.0.0.1:7627/ingest/de9ec5be-354d-4930-9486-665875decf43';

export function debugLog(hypothesisId, location, message, data = {}) {
  const payload = {
    sessionId: '0a9759',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  console.error('[DEBUG-0a9759]', JSON.stringify(payload));
  try {
    appendFileSync(logPath, `${JSON.stringify(payload)}\n`);
  } catch {
    /* workspace log optional on production */
  }
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '0a9759',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}
