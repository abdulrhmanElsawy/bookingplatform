import { getApiUrl } from '../config/publicEnv';

export async function syncLanguagePreference(lang: 'ar' | 'en'): Promise<boolean> {
  const apiBase = getApiUrl();
  if (!apiBase) return false;

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/users/me/preferences`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': lang,
      },
      body: JSON.stringify({ language: lang }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
