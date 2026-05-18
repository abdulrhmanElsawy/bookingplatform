import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../i18n';
import { GW_LANGUAGE_CHANGED, type GwLanguageChangedDetail } from '../../../lib/languageEvents';
import { LanguageLiveRegion } from '../LanguageLiveRegion';

function renderRegion() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageLiveRegion />
    </I18nextProvider>,
  );
}

describe('LanguageLiveRegion', () => {
  afterEach(() => {
    cleanup();
  });

  it('announces switch to English in the live region', async () => {
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    renderRegion();
    const region = screen.getByTestId('language-live-region');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent<GwLanguageChangedDetail>(GW_LANGUAGE_CHANGED, { detail: { lang: 'en' } }),
      );
    });

    await waitFor(() => {
      expect(region).toHaveTextContent('Switched to English');
    });
  });

  it('announces switch to Arabic', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderRegion();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent<GwLanguageChangedDetail>(GW_LANGUAGE_CHANGED, { detail: { lang: 'ar' } }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('language-live-region')).toHaveTextContent('تم التحويل إلى العربية');
    });
  });
});
