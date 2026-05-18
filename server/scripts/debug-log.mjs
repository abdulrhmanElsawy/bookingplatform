/** Debug logging — console only (no fetch; avoids OOM on low-memory shared hosting). */
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
  // #endregion
}
