import type { TFunction } from 'i18next';

const PLACEHOLDER_MESSAGES = new Set([
  'error',
  'request failed',
  'invalid response',
]);

function isPlaceholderMessage(message: string): boolean {
  return PLACEHOLDER_MESSAGES.has(message.trim().toLowerCase());
}

export type ApiLikeError = Error & { status: number; code?: string };

export function isApiLikeError(err: unknown): err is ApiLikeError {
  return (
    err instanceof Error &&
    'status' in err &&
    typeof (err as ApiLikeError).status === 'number'
  );
}

/**
 * Maps fetch/API failures to translated `errors` namespace strings when appropriate,
 * otherwise returns a server-provided message (already localized via Accept-Language).
 */
export function getApiErrorMessage(
  err: unknown,
  t: TFunction<'errors', undefined>,
): string {
  if (err instanceof TypeError) {
    return t('networkError');
  }

  if (!isApiLikeError(err)) {
    return err instanceof Error && err.message.trim()
      ? err.message
      : t('serverError');
  }

  const { status, message, code } = err;

  if (status === 0) {
    return t('networkError');
  }

  if (status === 413) {
    return t('uploadTooLarge', { max: '10' });
  }

  if (status === 415) {
    return t('uploadInvalidType');
  }

  if (code === 'SESSION_EXPIRED') {
    return t('sessionExpired');
  }

  if (code === 'EMAIL_NOT_VERIFIED') {
    if (message && !isPlaceholderMessage(message)) return message;
    return t('emailNotVerified');
  }

  if (code === 'EMAIL_SEND_FAILED') {
    if (message && !isPlaceholderMessage(message)) return message;
    return t('emailSendFailed');
  }

  if (code === 'ACCOUNT_LOCKED') {
    if (message && !isPlaceholderMessage(message)) return message;
  }

  if (status === 401) {
    if (message && !isPlaceholderMessage(message)) return message;
    return t('unauthorized');
  }

  if (status === 403) {
    if (message && !isPlaceholderMessage(message)) return message;
    return t('forbidden');
  }
  if (status === 404) return t('notFound');
  if (status === 429) return t('rateLimited');
  if (status >= 500 && status < 600) return t('serverError');

  if (status === 400) {
    if (message && !isPlaceholderMessage(message)) return message;
    return t('validation');
  }

  if (message && !isPlaceholderMessage(message)) return message;

  return t('serverError');
}
