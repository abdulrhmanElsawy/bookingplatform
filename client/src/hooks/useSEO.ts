import { useEffect } from 'react';

import { getSiteUrl } from '../config/publicEnv';
import { applySeoHead } from '../utils/documentSeo';

import { useLanguage } from './useLanguage';

export type BilingualSEO = {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

export type UseSEOOptions = BilingualSEO & {
  /** Path beginning with `/` (include query string when relevant). */
  path?: string;
  noIndex?: boolean;
};

function originForSeo(): string {
  const configured = getSiteUrl();
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return '';
}

function withHl(href: string, lang: 'ar' | 'en'): string {
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}hl=${lang}`;
}

export function useSEO({
  titleAr,
  titleEn,
  descAr,
  descEn,
  path = '/',
  noIndex,
}: UseSEOOptions): void {
  const { currentLang } = useLanguage();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  useEffect(() => {
    const title = currentLang === 'ar' ? titleAr : titleEn;
    const description = currentLang === 'ar' ? descAr : descEn;
    const ogLocale = currentLang === 'ar' ? 'ar_SA' : 'en_US';
    const base = originForSeo();
    const canonicalUrl = base ? `${base}${normalizedPath}` : '';

    if (!canonicalUrl) {
      document.title = title;
      return () => {};
    }

    return applySeoHead({
      title,
      description,
      ogLocale,
      canonicalUrl,
      alternate: {
        ar: withHl(canonicalUrl, 'ar'),
        en: withHl(canonicalUrl, 'en'),
        xDefault: canonicalUrl,
      },
      noIndex,
    });
  }, [currentLang, titleAr, titleEn, descAr, descEn, normalizedPath, noIndex]);
}

const JSON_LD_ID = 'gw-json-ld';

export function useJsonLd(data: Record<string, unknown> | null): void {
  const serialized = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!serialized) {
      document.getElementById(JSON_LD_ID)?.remove();
      return;
    }

    let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = JSON_LD_ID;
      el.type = 'application/ld+json';
      el.setAttribute('data-gw-jsonld', 'true');
      document.head.appendChild(el);
    }
    el.textContent = serialized;

    return () => {
      document.getElementById(JSON_LD_ID)?.remove();
    };
  }, [serialized]);
}
