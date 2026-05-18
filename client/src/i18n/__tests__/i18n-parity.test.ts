import arAdmin from '../locales/ar/admin.json';
import arAuth from '../locales/ar/auth.json';
import arCommon from '../locales/ar/common.json';
import arDashboard from '../locales/ar/dashboard.json';
import arErrors from '../locales/ar/errors.json';
import arListings from '../locales/ar/listings.json';
import arNotifications from '../locales/ar/notifications.json';
import arPayments from '../locales/ar/payments.json';
import arProfile from '../locales/ar/profile.json';
import arReviews from '../locales/ar/reviews.json';
import arSubscriptions from '../locales/ar/subscriptions.json';
import enAdmin from '../locales/en/admin.json';
import enAuth from '../locales/en/auth.json';
import enCommon from '../locales/en/common.json';
import enDashboard from '../locales/en/dashboard.json';
import enErrors from '../locales/en/errors.json';
import enListings from '../locales/en/listings.json';
import enNotifications from '../locales/en/notifications.json';
import enPayments from '../locales/en/payments.json';
import enProfile from '../locales/en/profile.json';
import enReviews from '../locales/en/reviews.json';
import enSubscriptions from '../locales/en/subscriptions.json';

/** Dot-paths for leaf string values (nested objects become `parent.child`). */
function leafKeyPaths(value: unknown, prefix = ''): Set<string> {
  const out = new Set<string>();
  if (value === null || value === undefined) return out;
  if (typeof value !== 'object') {
    if (prefix) out.add(prefix);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      leafKeyPaths(item, `${prefix}[${i}]`).forEach((k) => out.add(k));
    });
    return out;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      leafKeyPaths(v, path).forEach((x) => out.add(x));
    } else {
      out.add(path);
    }
  }
  return out;
}

const PAIRS: [string, unknown, unknown][] = [
  ['common', arCommon, enCommon],
  ['auth', arAuth, enAuth],
  ['listings', arListings, enListings],
  ['reviews', arReviews, enReviews],
  ['dashboard', arDashboard, enDashboard],
  ['admin', arAdmin, enAdmin],
  ['profile', arProfile, enProfile],
  ['notifications', arNotifications, enNotifications],
  ['payments', arPayments, enPayments],
  ['subscriptions', arSubscriptions, enSubscriptions],
  ['errors', arErrors, enErrors],
];

describe('i18n AR/EN key parity', () => {
  it.each(PAIRS)('namespace %s has matching key paths in ar and en', (_ns, ar, en) => {
    const arKeys = leafKeyPaths(ar);
    const enKeys = leafKeyPaths(en);
    const onlyAr = [...arKeys].filter((k) => !enKeys.has(k)).sort();
    const onlyEn = [...enKeys].filter((k) => !arKeys.has(k)).sort();
    expect({ onlyAr, onlyEn }).toEqual({ onlyAr: [], onlyEn: [] });
  });
});
