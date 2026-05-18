/** Marker for nodes managed by the SPA SEO layer (cleaned up on change / unmount). */
export const GW_SEO_ATTR = 'data-gw-seo';

function removeGwSeoNodes(): void {
  document.head.querySelectorAll(`[${GW_SEO_ATTR}]`).forEach((el) => el.remove());
}

function ensureMeta(attr: 'name' | 'property', key: string, content: string): void {
  const selector =
    attr === 'name'
      ? `meta[${GW_SEO_ATTR}][name="${key}"]`
      : `meta[${GW_SEO_ATTR}][property="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(GW_SEO_ATTR, 'true');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureLinkAlternate(hreflang: string, href: string): void {
  const selector = `link[${GW_SEO_ATTR}][rel="alternate"][hreflang="${hreflang}"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute(GW_SEO_ATTR, 'true');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function ensureCanonical(href: string): void {
  const selector = `link[${GW_SEO_ATTR}][rel="canonical"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute(GW_SEO_ATTR, 'true');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export type SeoHeadPayload = {
  title: string;
  description: string;
  ogLocale: 'ar_SA' | 'en_US';
  canonicalUrl: string;
  /** Alternate URLs for hreflang (single-URL app uses `?hl=` hints for crawlers). */
  alternate: { ar: string; en: string; xDefault: string };
  noIndex?: boolean;
};

export function applySeoHead(payload: SeoHeadPayload): () => void {
  removeGwSeoNodes();

  const prevTitle = document.title;
  document.title = payload.title;

  ensureMeta('name', 'description', payload.description);
  if (payload.noIndex) {
    ensureMeta('name', 'robots', 'noindex, nofollow');
  }

  ensureMeta('property', 'og:title', payload.title);
  ensureMeta('property', 'og:description', payload.description);
  ensureMeta('property', 'og:locale', payload.ogLocale);
  ensureMeta('property', 'og:type', 'website');
  ensureMeta('property', 'og:url', payload.canonicalUrl);

  ensureCanonical(payload.canonicalUrl);
  ensureLinkAlternate('ar', payload.alternate.ar);
  ensureLinkAlternate('en', payload.alternate.en);
  ensureLinkAlternate('x-default', payload.alternate.xDefault);

  return () => {
    document.title = prevTitle;
    removeGwSeoNodes();
  };
}
