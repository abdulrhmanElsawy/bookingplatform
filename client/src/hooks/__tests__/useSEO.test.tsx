import { renderHook, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';

import { configurePublicEnv } from '../../config/publicEnv';
import i18n from '../../i18n';
import { GW_SEO_ATTR } from '../../utils/documentSeo';
import { useSEO } from '../useSEO';

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('useSEO', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000', siteUrl: 'https://growthworldapp.com' });
    document.head.querySelectorAll(`[${GW_SEO_ATTR}]`).forEach((el) => el.remove());
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  it('sets document title and description meta from the active language', async () => {
    renderHook(
      () =>
        useSEO({
          titleAr: 'عنوان عربي',
          titleEn: 'English title',
          descAr: 'وصف عربي',
          descEn: 'English description',
          path: '/listings',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(document.title).toBe('عنوان عربي');
    });
    const meta = document.querySelector(
      `meta[name="description"][${GW_SEO_ATTR}]`,
    ) as HTMLMetaElement | null;
    expect(meta?.getAttribute('content')).toBe('وصف عربي');
    const og = document.querySelector(
      `meta[property="og:locale"][${GW_SEO_ATTR}]`,
    ) as HTMLMetaElement | null;
    expect(og?.getAttribute('content')).toBe('ar_SA');
  });

  it('updates tags when switching to English', async () => {
    const { rerender } = renderHook(
      () =>
        useSEO({
          titleAr: 'عنوان عربي',
          titleEn: 'English title',
          descAr: 'وصف عربي',
          descEn: 'English description',
          path: '/',
        }),
      { wrapper },
    );

    await waitFor(() => expect(document.title).toBe('عنوان عربي'));

    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    rerender();

    await waitFor(() => {
      expect(document.title).toBe('English title');
    });
    const meta = document.querySelector(
      `meta[name="description"][${GW_SEO_ATTR}]`,
    ) as HTMLMetaElement | null;
    expect(meta?.getAttribute('content')).toBe('English description');
  });
});
